"""peerChat flask-backend configuration."""

import os
from pathlib import Path


# pylint: disable=R0903:too-few-public-methods
class AppConfig:
    """peerChat-backend configuration info."""

    WORKING_DIRECTORY = (
        Path(os.environ["WORKING_DIRECTORY"])
        if "WORKING_DIRECTORY" in os.environ
        else Path(".peerChat")
    )
    SECRET_KEY_PATH = Path(".secret_key")
    SECRET_KEY = os.environ.get("SECRET_KEY")
    USER_AUTH_KEY_PATH = Path(".auth")
    USER_AUTH_KEY = os.environ.get("USER_AUTH_KEY")
    USER_CONFIG_PATH = Path(".user.json")
    USER_CONFIG = None
    USER_PEER_URL = os.environ.get("USER_PEER_URL")
    DATA_DIRECTORY = Path("data")
