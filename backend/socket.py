"""Socket.IO-websocket definition."""

import os
import sys

from flask import request
from flask_socketio import SocketIO

from .common import Auth, MessageStore


def socket_(auth: Auth, store: MessageStore) -> SocketIO:
    """
    Returns a fully configured `SocketIO`-object that can be registered
    with a Flask-application.
    """
    # enable CORS in development-environment
    try:
        # pylint: disable=import-outside-toplevel, unused-import
        from flask_cors import (
            CORS,
        )
    except ImportError:
        socketio = SocketIO()
    else:
        print("INFO: Configuring socket for CORS.", file=sys.stderr)
        socketio = SocketIO(
            cors_allowed_origins=os.environ.get(
                "CORS_FRONTEND_URL", "http://localhost:3000"
            )
        )

    @socketio.on("connect")
    def connect():
        if auth.value is None:
            print("connection rejected, missing key setup")
            return False
        if auth.KEY not in request.cookies:
            print("connection rejected, missing cookie")
            return False
        if request.cookies[auth.KEY] != auth.value:
            print("connection rejected, bad cookie")
            return False
        print("connected")
        return True

    @socketio.on("event")
    def event():
        print("event happened")
        socketio.emit("event-response", {"value": 1})
        return "event happened"

    @socketio.on("ping")
    def ping():
        return "pong"

    @socketio.on("get-conversation")
    def get_conversation(id_: str):
        return store.load_conversation(id_).json

    return socketio
