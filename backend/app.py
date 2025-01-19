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

from flask import Flask, Response, jsonify, request
from flask_socketio import SocketIO
import requests

from .common import User, Auth, MessageStore
from .api.v0 import blueprint_factory as v0_blueprint
from .socket import socket_


def load_user_config() -> User:
    """
    Returns user-config (from file if existent or newly generated
    otherwise) as `User`-object.
    """

    # load and process (or initialize) user data
    USER_JSON_FILE = Path(os.environ.get("USER_JSON_FILE", ".user.json"))
    DEFAULT_NAME = "Anonymous"
    DEFAULT_AVATAR = Path(
        os.environ.get("DEFAULT_USER_AVATAR", Path("static") / "avatar.png")
    )
    if not DEFAULT_AVATAR.exists():
        print(
            "WARNING: Fallback-user avatar not available. "
            + "(Set 'DEFAULT_USER_AVATAR' to correct path.)"
        )

    try:
        user_json = json.loads(USER_JSON_FILE.read_text(encoding="utf-8"))
    except (
        json.JSONDecodeError,
        FileNotFoundError,
    ) as exc_info:
        print(
            f"WARNING: Unable to load existing user json file: {exc_info}",
            file=sys.stderr,
        )
        user_json = {"name": DEFAULT_NAME, "avatar": DEFAULT_AVATAR}
    try:
        user = User(
            user_json["name"], Path(user_json["avatar"]), USER_JSON_FILE
        )
    except (KeyError, TypeError) as exc_info:
        print(
            f"WARNING: Bad data in user json file: {exc_info}", file=sys.stderr
        )
        user = User(DEFAULT_NAME, DEFAULT_AVATAR, USER_JSON_FILE)
    if not user.avatar.exists():
        user.avatar = DEFAULT_AVATAR
    if "address" in user_json:
        user.address = user_json["address"]
    else:
        print("WARNING: User address has not been set.", file=sys.stderr)
    USER_JSON_FILE.write_text(json.dumps(user.json), encoding="utf-8")

    return user


# load auth information/prepare Auth-object
def load_auth() -> Auth:
    """
    Returns existing auth-file contents as `Auth`-type.
    """
    AUTH_FILE = Path(os.environ.get("AUTH_FILE", ".auth"))
    if AUTH_FILE.exists():
        auth = Auth(AUTH_FILE, AUTH_FILE.read_text(encoding="utf-8") or None)
    else:
        print(
            f"INFO: Auth-key has not been set in '{AUTH_FILE}'.",
            file=sys.stderr,
        )
        auth = Auth(AUTH_FILE, None)
    return auth


def load_secret_key() -> str:
    """
    Returns secret key (from disk if file exists or new key otherwise).
    """
    SECRET_KEY_FILE = Path(os.environ.get("SECRET_KEY_FILE", ".secret_key"))
    if SECRET_KEY_FILE.exists():
        secret_key = SECRET_KEY_FILE.read_text(encoding="utf-8")
    else:
        print(
            f"INFO: Generating new secret key in '{SECRET_KEY_FILE}'.",
            file=sys.stderr,
        )
        secret_key = str(uuid4())
        SECRET_KEY_FILE.write_text(secret_key, encoding="utf-8")
    return secret_key


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


def app_factory(
    callback_url: Optional[str] = None, working_dir: Optional[Path] = None
) -> tuple[Flask, SocketIO]:
    """Returns peerChat-Flask app."""
    # define Flask-app
    _app = Flask(__name__)

    # load or generate (and store) secret key
    _app.secret_key = load_secret_key()

    # load user config and user auth
    user = load_user_config()
    auth = load_auth()

    # load user callback url
    user_address_options_cached = load_callback_url_options()
    if callback_url:
        user.address = callback_url
    else:
        if not user.address and user_address_options_cached:
            user.address = user_address_options_cached[0]["address"]
            Path(os.environ.get("USER_JSON_FILE", ".user.json")).write_text(
                json.dumps(user.json), encoding="utf-8"
            )
            print(
                f"Set default user address to '{user.address}'.",
                file=sys.stderr,
            )

    # message store
    store = MessageStore(
        working_dir or Path(os.environ.get("WORKING_DIR", "./data"))
    )

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
            auth.file.write_text(auth.value, encoding="utf-8")
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
            Path(os.environ.get("USER_JSON_FILE", ".user.json")).write_text(
                json.dumps(user.json), encoding="utf-8"
            )
            return Response(
                "ok",
                headers={"Access-Control-Allow-Credentials": "true"},
                mimetype="text/plain",
                status=200,
            )
        return jsonify(user_address_options_cached), 200

    # socket
    _socket = socket_(auth, store, user)
    _socket.init_app(_app)

    # API
    _app.register_blueprint(
        v0_blueprint(
            user,
            auth,
            socket=_socket,
            store=store,
        ),
        url_prefix="/api/v0",
    )

    return _app, _socket
