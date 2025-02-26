"""Socket.IO-websocket definition."""

import sys
from datetime import datetime

import requests
from flask import request
from flask_socketio import SocketIO

from peer_chat.config import AppConfig
from peer_chat.common import (
    Auth,
    User,
    MessageStore,
    Conversation,
    Message,
    MessageStatus,
    inform_peers as _inform_peers
)


def socket_(
    config: AppConfig, auth: Auth, store: MessageStore, user: User
) -> SocketIO:
    """
    Returns a fully configured `SocketIO`-object that can be registered
    with a Flask-application.
    """
    # enable CORS in development-environment
    if config.MODE == "dev":
        print("INFO: Configuring socket for CORS.", file=sys.stderr)
        socketio = SocketIO(cors_allowed_origins=config.DEV_CORS_FRONTEND_URL)
    else:
        socketio = SocketIO()

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

    @socketio.on("inform-peers")
    def inform_peers():
        """Posts update-notification to all peers."""
        _inform_peers(store, user)

    @socketio.on("create-conversation")
    def create_conversation(peer: str, name: str):
        """Creates a new conversation and returns its id."""
        c = Conversation(peer=peer, name=name)
        store.set_conversation_path(c)
        store.create_conversation(c)
        socketio.emit("new-conversation", c.id_)
        return c.id_

    @socketio.on("delete-conversation")
    def delete_conversation(cid: str):
        """Deletes an existing conversation."""
        c = store.load_conversation(cid)
        if not c:
            return
        store.delete_conversation(c)
        socketio.emit("removed-conversation", cid)

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

    @socketio.on("mark-conversation-read")
    def mark_conversation_read(cid: str):
        """Mark conversation as read."""
        c = store.set_conversation_read(cid)
        if c:
            socketio.emit("update-conversation", c.json)

    @socketio.on("get-message")
    def get_message(cid: str, mid: int):
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
    def send_message(cid: str, mid: int):
        """Send message to peer."""
        m = store.load_message(cid, mid)
        if not m:
            return False
        m.status = MessageStatus.SENDING
        store.post_message(cid, m)
        c = store.load_conversation(cid)
        if not c:
            return False
        c.last_modified = datetime.now()

        socketio.emit("update-conversation", c.json)
        try:
            body = {"cid": cid, "msg": m.json, "name": c.name}
            if user.address:
                body["peer"] = user.address
            requests.post(
                c.peer + "/api/v0/message",
                json=body,
                timeout=2,
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
