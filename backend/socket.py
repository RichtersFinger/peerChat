"""Socket.IO-websocket definition."""

import os
import sys
import requests

from flask import request
from flask_socketio import SocketIO

from .common import Auth, MessageStore, Conversation, Message, MessageStatus


def socket_(auth: Auth, store: MessageStore, callback_url: str) -> SocketIO:
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

    @socketio.on("disconnect")
    def disconnect():
        print("disconnected")
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

    @socketio.on("post-message")
    def post_message(cid: str, msg: dict):
        """Post message data."""
        return store.post_message(cid, Message.from_json(msg))

    @socketio.on("send-message")
    def send_message(cid: str, mid: str):
        """Send message to peer."""
        m = store.load_message(cid, mid)
        if not m:
            return False
        m.status = MessageStatus.SENDING
        store.post_message(cid, m)
        c = store.load_conversation(cid)
        if not c:
            return False

        socketio.emit("update-conversation", c.json)
        try:
            requests.post(
                c.peer + "/api/v0/message",
                json={"cid": cid, "msg": m.json, "peer": callback_url},
                timeout=5,
            )
        # pylint: disable=broad-exception-caught
        except Exception as exc_info:
            print(
                f"ERROR: Unable to send message '{cid}.{mid}': {exc_info}",
                file=sys.stderr,
            )
            return False
        m.status = MessageStatus.OK
        store.post_message(cid, m)
        socketio.emit("update-message", {"cid": cid, "message": m.json})
        return True

    return socketio
