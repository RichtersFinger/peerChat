"""peerChat-backend definition."""

from typing import Optional
import os
import sys
from pathlib import Path
import json
from threading import Lock
from uuid import uuid4
import socket
from functools import wraps
import base64

from flask import Flask, Response, jsonify, request
from flask_socketio import SocketIO
import requests

from peer_chat.config import AppConfig
from peer_chat.common import User, Auth, MessageStore
from peer_chat.api.v0 import blueprint_factory as v0_blueprint
from peer_chat.socket import socket_


def load_secret_key(path: Path) -> str:
    """
    Generates random key, writes to file, and returns value.
    """
    if path.is_file():
        secret_key = path.read_text(encoding="utf-8")
    else:
        print(
            f"INFO: Generating new secret key in '{path}'.",
            file=sys.stderr,
        )
        secret_key = str(uuid4())
        path.touch(mode=0o600)
        path.write_text(secret_key, encoding="utf-8")
    return secret_key


def load_user_config(path: Path) -> User:
    """
    Returns user-config (from file if existent or newly generated
    otherwise) as `User`-object.
    """

    try:
        user_json = json.loads(path.read_text(encoding="utf-8"))
    except (
        json.JSONDecodeError,
        FileNotFoundError,
    ) as exc_info:
        print(
            f"WARNING: Unable to load existing user json file: {exc_info}",
            file=sys.stderr,
        )
        user_json = {"name": "Anonymous"}

    return user_json


def load_auth(path: Path) -> Optional[str]:
    """
    Returns existing auth-file contents as `Auth`-type.
    """
    if path.is_file():
        return path.read_text(encoding="utf-8")
    print(
        f"INFO: Auth-key has not been set in '{path}'.",
        file=sys.stderr,
    )
    return None


def load_cors(_app: Flask) -> None:
    """Loads CORS-extension if required."""
    # configure for CORS (development environment-only)
    try:
        from flask_cors import CORS
    except ImportError:
        pass
    else:
        print("INFO: Configuring app for CORS.", file=sys.stderr)
        _ = CORS(
            _app,
            resources={
                "*": {
                    "origins": os.environ.get(
                        "CORS_FRONTEND_URL", "http://localhost:3000"
                    )
                }
            },
        )


def load_callback_url_options() -> list[dict]:
    """
    Returns a list of default-options to be used as this peer's address.

    Every record contains the fields 'name' and 'address'.
    """
    options = []

    # get LAN-address (https://stackoverflow.com/a/28950776)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        s.connect(("10.254.254.254", 1))
        options.append({"address": s.getsockname()[0], "name": "local"})
    # pylint: disable=broad-exception-caught
    except Exception:
        pass
    finally:
        s.close()

    # get global IP
    try:
        options.append(
            {
                "address": requests.get(
                    "https://api.ipify.org", timeout=1
                ).text,
                "name": "global",
            }
        )
    # pylint: disable=broad-exception-caught
    except Exception:
        pass

    return options


def login_required(auth: Auth):
    def decorator(route):
        @wraps(route)
        def __():
            if auth.value is None:
                return Response(
                    "Missing configuration.",
                    headers={"Access-Control-Allow-Credentials": "true"},
                    mimetype="text/plain",
                    status=500,
                )
            if Auth.KEY not in request.cookies:
                return Response(
                    "Missing credentials.",
                    headers={"Access-Control-Allow-Credentials": "true"},
                    mimetype="text/plain",
                    status=401,
                )
            if auth.value != request.cookies.get(Auth.KEY):
                return Response(
                    "Bad credentials.",
                    headers={"Access-Control-Allow-Credentials": "true"},
                    mimetype="text/plain",
                    status=401,
                )
            return route()

        return __

    return decorator


def app_factory(config: AppConfig) -> tuple[Flask, SocketIO]:
    """Returns peerChat-Flask app."""
    # define Flask-app
    _app = Flask(__name__)

    # prepare storage
    (config.WORKING_DIRECTORY / config.DATA_DIRECTORY).mkdir(
        parents=True, exist_ok=True
    )

    # load or generate (and store) secret key if not set yet
    if not config.SECRET_KEY:
        config.SECRET_KEY = load_secret_key(
            config.WORKING_DIRECTORY / config.SECRET_KEY_PATH
        )

    # load user config
    if not config.USER_CONFIG:
        config.USER_CONFIG = load_user_config(
            config.WORKING_DIRECTORY / config.USER_CONFIG_PATH
        )
    user = User.from_json(config.USER_CONFIG)

    # load user callback url
    user_address_options_cached = load_callback_url_options()
    if config.USER_PEER_URL:
        user.address = config.USER_PEER_URL
    else:
        if not user.address and user_address_options_cached:
            user.address = user_address_options_cached[0]["address"]
    user.write(config.WORKING_DIRECTORY / config.USER_CONFIG_PATH)

    # load user auth if not set yet
    if not config.USER_AUTH_KEY:
        config.USER_AUTH_KEY = load_auth(
            config.WORKING_DIRECTORY / config.USER_AUTH_KEY_PATH
        )
    auth = Auth(config.USER_AUTH_KEY)
    if auth.value:
        auth.write(config.WORKING_DIRECTORY / config.USER_AUTH_KEY_PATH)

    _app.config.from_object(config)

    # message store
    store = MessageStore(config.WORKING_DIRECTORY / config.DATA_DIRECTORY)

    # extensions
    load_cors(_app)

    # initialize ressource-locks
    auth_lock = Lock()

    @_app.route("/ping", methods=["GET"])
    def ping():
        """
        Returns 'pong'.
        """
        return Response("pong", mimetype="text/plain", status=200)

    @_app.route("/who", methods=["GET"])
    def who():
        """
        Returns JSON-object identifying this as a peerChatAPI with base-url
        paths.
        """
        return jsonify(name="peerChatAPI", api={"0": "/api/v0"}), 200

    @_app.route("/auth/key", methods=["GET", "POST"])
    def create_auth_key():
        """
        If no auth-key has been set, request to create anew and return that
        key.
        """
        if request.method == "GET":
            if auth.value is not None:
                return Response(
                    "Key already set.", mimetype="text/plain", status=200
                )
            return Response(
                "Key has not been set.", mimetype="text/plain", status=404
            )
        with auth_lock:
            if auth.value is not None:
                return Response(
                    "Key already set.", mimetype="text/plain", status=409
                )
            auth_json = request.get_json(force=True, silent=True)
            if auth_json is not None and auth_json.get(auth.KEY):
                auth.value = auth_json[auth.KEY]
            else:
                auth.value = str(uuid4())
            auth.write(config.WORKING_DIRECTORY / config.USER_AUTH_KEY_PATH)
            return Response(auth.value, mimetype="text/plain", status=200)

    @_app.route("/auth/test", methods=["GET"])
    @login_required(auth)
    def auth_test():
        """
        Returns 200 if auth is ok.
        """
        return Response(
            "ok",
            headers={"Access-Control-Allow-Credentials": "true"},
            mimetype="text/plain",
            status=200,
        )

    @_app.route("/user/address", methods=["GET", "POST", "OPTIONS"])
    @login_required(auth)
    def user_address():
        """
        Interact with user.address (public address among peers).
        """
        if request.method == "GET":
            if user.address:
                return Response(
                    user.address,
                    headers={"Access-Control-Allow-Credentials": "true"},
                    mimetype="text/plain",
                    status=200,
                )
            return Response(
                "Address has not been set.",
                headers={"Access-Control-Allow-Credentials": "true"},
                mimetype="text/plain",
                status=404,
            )
        if request.method == "POST":
            user.address = request.data.decode(encoding="utf-8")
            user.write(config.WORKING_DIRECTORY / config.USER_CONFIG_PATH)
            return Response(
                "ok",
                headers={"Access-Control-Allow-Credentials": "true"},
                mimetype="text/plain",
                status=200,
            )
        return jsonify(user_address_options_cached), 200

    @_app.route("/user/name", methods=["POST"])
    @login_required(auth)
    def set_user_name():
        """Sets user name."""
        user.name = request.data.decode(encoding="utf-8")
        user.write(config.WORKING_DIRECTORY / config.USER_CONFIG_PATH)
        return Response(
            "ok",
            headers={"Access-Control-Allow-Credentials": "true"},
            mimetype="text/plain",
            status=200,
        )

    @_app.route("/user/avatar", methods=["POST"])
    @login_required(auth)
    def set_user_avatar():
        """Sets user avatar."""
        (config.WORKING_DIRECTORY / config.USER_AVATAR_PATH).write_bytes(
            base64.decodebytes(
                request.data.decode(encoding="utf-8").split(",")[1].encode()
            )
        )
        return Response(
            "ok",
            headers={"Access-Control-Allow-Credentials": "true"},
            mimetype="text/plain",
            status=200,
        )

    # socket
    _socket = socket_(auth, store, user)
    _socket.init_app(_app)

    # API
    _app.register_blueprint(
        v0_blueprint(
            config,
            user,
            socket=_socket,
            store=store,
        ),
        url_prefix="/api/v0",
    )

    return _app, _socket
