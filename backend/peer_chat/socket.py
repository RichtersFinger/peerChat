"""Socket.IO-websocket definition."""

import sys
from datetime import datetime
from dataclasses import dataclass, field

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
    inform_peers as _inform_peers,
    send_message as _send_message,
)


@dataclass
class SocketInfo:
    socket: SocketIO
    connections: list[str] = field(default_factory=list)


def socket_(
    config: AppConfig, auth: Auth, store: MessageStore, user: User
) -> SocketInfo:
    """
    Returns a fully configured `SocketIO`-object that can be registered
    with a Flask-application.
    """
    # enable CORS in development-environment
    if config.MODE == "dev":
        print("INFO: Configuring socket for CORS.", file=sys.stderr)
        socket_info = SocketInfo(
            SocketIO(cors_allowed_origins=config.DEV_CORS_FRONTEND_URL)
        )
    else:
        socket_info = SocketInfo(SocketIO())

    @socket_info.socket.on("connect")
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
        socket_info.connections.append(request.sid)
        print("connected", request.sid)
        return True

    @socket_info.socket.on("disconnect")
    def disconnect():
        socket_info.connections = [
            c for c in socket_info.connections if c != request.sid
        ]
        print("disconnected", request.sid)
        return True

    @socket_info.socket.on("event")
    def event():
        print("event happened")
        socket_info.socket.emit("event-response", {"value": 1})
        return "event happened"

    @socket_info.socket.on("ping")
    def ping():
        return "pong"

    @socket_info.socket.on("inform-peers")
    def inform_peers():
        """Posts update-notification to all peers."""
        _inform_peers(store, user)

    @socket_info.socket.on("create-conversation")
    def create_conversation(name: str, peer: str):
        """Creates a new conversation and returns its id."""
        c = Conversation(peer=peer, name=name)
        store.set_conversation_path(c)
        store.create_conversation(c)
        c.unread_messages = False
        store.write(c.id_)
        socket_info.socket.emit("new-conversation", c.id_)
        return c.id_

    @socket_info.socket.on("delete-conversation")
    def delete_conversation(cid: str):
        """Deletes an existing conversation."""
        c = store.load_conversation(cid)
        if not c:
            return
        store.delete_conversation(c)
        socket_info.socket.emit("removed-conversation", cid)

    @socket_info.socket.on("list-conversations")
    def list_conversations():
        """Returns a (heuristic) list of conversations."""
        return store.list_conversations()

    @socket_info.socket.on("get-conversation")
    def get_conversation(cid: str):
        """Returns conversation metadata."""
        try:
            return store.load_conversation(cid).json
        except AttributeError:
            return None

    @socket_info.socket.on("mark-conversation-read")
    def mark_conversation_read(cid: str):
        """Mark conversation as read."""
        c = store.set_conversation_read(cid)
        if c:
            socket_info.socket.emit("update-conversation", c.json)

    @socket_info.socket.on("change-conversation-details")
    def change_conversation_details(cid: str, name: str, peer: str):
        """Mark conversation as read."""
        c = store.load_conversation(cid)
        if not c:
            return False
        c.name = name
        c.peer = peer
        store.write(cid)
        socket_info.socket.emit("update-conversation", c.json)
        return True

    @socket_info.socket.on("get-message")
    def get_message(cid: str, mid: int):
        """Returns message data."""
        try:
            return store.load_message(cid, mid).json
        except AttributeError:
            return None

    @socket_info.socket.on("post-message")
    def post_message(cid: str, msg: dict):
        """Post message data."""
        return store.post_message(cid, Message.from_json(msg))

    @socket_info.socket.on("send-message")
    def send_message(cid: str, mid: int):
        """Send message to peer."""
        c = store.load_conversation(cid)
        if not c:
            return False
        m = store.load_message(cid, mid)
        if not m:
            return False
        c.last_modified = datetime.now()
        socket_info.socket.emit("update-conversation", c.json)

        return _send_message(c, m, store, user, socket_info.socket)

    @socket_info.socket.on("delete-message")
    def delete_message(cid: str, mid: int):
        """Send message to peer."""
        c = store.load_conversation(cid)
        if not c:
            return
        m = store.load_message(cid, mid)
        if not m or m.status != MessageStatus.QUEUED:
            return
        c.queued_messages.remove(mid)
        m.status = MessageStatus.DELETED
        store.write(cid)
        store.write(cid, mid)
        socket_info.socket.emit("update-conversation", c.json)
        socket_info.socket.emit(
            "update-message",
            {"cid": c.id_, "message": m.json},
        )

    return socket_info
