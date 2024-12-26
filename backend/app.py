"""peerChat-backend definition."""

from typing import Optional
import os
import sys
from pathlib import Path
import json
from threading import Lock
from uuid import uuid4

from flask import Flask, Response, jsonify, request
from flask_socketio import SocketIO

from .common import User, Auth, MessageStore
from .api.v0 import blueprint_factory as v0_blueprint
from .socket import socket_


def load_config() -> User:
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


def app_factory(working_dir: Optional[Path] = None) -> tuple[Flask, SocketIO]:
    """Returns peerChat-Flask app."""
    # define Flask-app
    _app = Flask(__name__)

    # load or generate (and store) secret key
    _app.secret_key = load_secret_key()

    # load user config and user auth
    user = load_config()
    auth = load_auth()

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
                    "Key already exists.", mimetype="text/plain", status=200
                )
            return Response(
                "Key does not exist yet.", mimetype="text/plain", status=404
            )
        with auth_lock:
            if auth.value is not None:
                return Response(
                    "Key already exists.", mimetype="text/plain", status=409
                )
            auth_json = request.get_json(force=True, silent=True)
            if auth_json is not None and auth_json.get(auth.KEY):
                auth.value = auth_json[auth.KEY]
            else:
                auth.value = str(uuid4())
            auth.file.write_text(auth.value, encoding="utf-8")
            return Response(auth.value, mimetype="text/plain", status=200)

    # socket
    _socket = socket_(auth, store)
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
