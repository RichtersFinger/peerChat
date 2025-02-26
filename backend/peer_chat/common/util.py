"""Utility-definitions."""

import requests

from peer_chat.common import MessageStore, User


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
