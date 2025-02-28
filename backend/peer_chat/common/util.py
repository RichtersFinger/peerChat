"""Utility-definitions."""

import sys

import requests
from flask_socketio import SocketIO

from peer_chat.common import (
    Conversation,
    Message,
    MessageStatus,
    MessageStore,
    User,
)


def inform_peers(store: MessageStore, user: User) -> None:
    """
    Send update-notifications to all peers in `store` (using
    `user.address`).
    """
    completed = []
    for cid in store.list_conversations():
        c = store.load_conversation(cid)
        if c is None or c.peer in completed:
            continue
        try:
            requests.post(
                c.peer + "/api/v0/update-available",
                json={"peer": user.address},
                timeout=2,
            )
        except (
            requests.exceptions.BaseHTTPError,
            requests.exceptions.ConnectionError,
        ):
            pass
        completed.append(c.peer)


def send_message(
    c: Conversation,
    m: Message,
    store: MessageStore,
    user: User,
    socket: SocketIO,
) -> bool:
    """
    Attempt to send given message. During this process the message
    status is updated accordingly (store and client via socket).
    """
    if m.status == MessageStatus.OK:
        return True
    m.status = MessageStatus.SENDING
    socket.emit("update-message", {"cid": c.id_, "message": m.json})
    try:
        body = {"cid": c.id_, "msg": m.json, "name": c.name}
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
            f"ERROR: Unable to send message '{c.id_}.{m.id_}': {exc_info}",
            file=sys.stderr,
        )
        m.status = MessageStatus.QUEUED
        if m.id_ not in c.queued_messages:
            c.queued_messages.append(m.id_)
        store.post_message(c.id_, m)
        socket.emit("update-message", {"cid": c.id_, "message": m.json})
        return False
    m.status = MessageStatus.OK
    store.post_message(c.id_, m)
    socket.emit("update-message", {"cid": c.id_, "message": m.json})
    return True
