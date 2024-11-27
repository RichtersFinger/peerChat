"""peerChat-backend definition."""

import os
import sys
from pathlib import Path
import json
from uuid import uuid4

from flask import Flask, Response, jsonify

from .common import User
from .api.v0 import blueprint_factory as v0_blueprint


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
        user_json["name"],
        Path(user_json["avatar"]),
    )
except (KeyError, TypeError) as exc_info:
    print(f"WARNING: Bad data in user json file: {exc_info}", file=sys.stderr)
    user = User(DEFAULT_NAME, DEFAULT_AVATAR)
if not user.avatar.exists():
    user.avatar = DEFAULT_AVATAR
USER_JSON_FILE.write_text(json.dumps(user.json), encoding="utf-8")


# define Flask-app
app = Flask(__name__)
app.register_blueprint(
    v0_blueprint(USER_JSON_FILE, user),
    url_prefix="/api/v0",
)

# load or generate (and store) secret key
SECRET_KEY_FILE = Path(os.environ.get("SECRET_KEY_FILE", ".secret_key"))
if SECRET_KEY_FILE.exists():
    app.secret_key = SECRET_KEY_FILE.read_text(encoding="utf-8")
else:
    print(
        f"INFO: Generating new secret key in {SECRET_KEY_FILE}",
        file=sys.stderr,
    )
    app.secret_key = str(uuid4())
    SECRET_KEY_FILE.write_text(app.secret_key, encoding="utf-8")


@app.route("/ping", methods=["GET"])
def ping():
    """
    Returns 'pong'.
    """
    return Response("pong", mimetype="text/plain", status=200)


@app.route("/who", methods=["GET"])
def who():
    """
    Returns JSON-object identifying this as a peerChatAPI with base-url
    paths.
    """
    return jsonify(name="peerChatAPI", api={"0": "/api/v0"}), 200
