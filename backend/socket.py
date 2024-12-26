"""Socket.IO-websocket definition."""

import os
import sys

from flask import request
from flask_socketio import SocketIO

from .common import Auth, MessageStore, Conversation


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

    @socketio.on("create-conversation")
    def create_conversation(peer: str, name: str):
        """Creates a new conversation and returns its id."""
        c = Conversation(peer=peer, name=name)
        store.set_conversation_path(c)
        store.create_conversation(c)
        return c.id_

    @socketio.on("list-conversations")
    def list_conversations():
        """Returns a (heuristic) list of conversations."""
        return store.list_conversations()

    @socketio.on("get-conversation")
    def get_conversation(cid: str):
        """Returns conversation metadata."""
        try:
            return store.load_conversation(cid).json
        except AttributeError:
            return None

    @socketio.on("get-message")
    def get_message(cid: str, mid: str):
        """Returns message data."""
        try:
            return store.load_message(cid, mid).json
        except AttributeError:
            return None

    return socketio
