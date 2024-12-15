"""Common definitions."""

from typing import Optional
import sys
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime
from threading import RLock, Lock
import json
from uuid import uuid4
from enum import Enum


@dataclass
class User:
    """User definition."""

    name: str
    avatar: Path
    json_file: Path

    @property
    def json(self) -> dict:
        """Returns serialized representation of the given object."""
        return {"name": self.name, "avatar": str(self.avatar)}


@dataclass
class Auth:
    """User auth information."""

    KEY = "peerChatAuth"
    file: Path
    value: Optional[str]


class MessageStatus(Enum):
    """Message status enum."""

    OK = "ok"
    QUEUED = "queued"
    SENDING = "sending"
    DRAFT = "draft"
    DELETED = "deleted"
    ERROR = "error"


@dataclass
class Message:
    """
    Record class for message metadata and content. Implements
    (de-)serialization methods `json` and `from_json`.
    """

    id_: str
    body: Optional[str] = None
    status: MessageStatus = MessageStatus.DRAFT
    last_modified: datetime = field(default_factory=datetime.now)

    @property
    def json(self) -> dict:
        """Returns a serializable representation of this object."""
        return {
            "id": self.id_,
            "body": self.body,
            "status": self.status.value,
            "lastModified": self.last_modified.isoformat(),
        }

    @staticmethod
    def from_json(json_: dict) -> "Conversation":
        """
        Returns instance initialized from serialized representation.
        """
        return Message(
            id_=json_["id"],
            body=json_["body"],
            status=MessageStatus(json_["status"]),
            last_modified=datetime.fromisoformat(json_["lastModified"]),
        )


@dataclass
class Conversation:
    """
    Record class for conversation metadata and content. Implements
    (de-)serialization methods `json` and `from_json`.
    """

    origin: str
    name: str
    id_: str = field(default_factory=lambda: str(uuid4()))
    path: Optional[Path] = None  # points to index-file
    length: int = 0
    last_modified: datetime = field(default_factory=datetime.now)
    messages: dict[int, Message] = field(default_factory=dict)

    @property
    def json(self) -> dict:
        """Returns a serializable representation of this object."""
        return {
            "id": self.id_,
            "origin": self.origin,
            "name": self.name,
            "length": self.length,
            "lastModified": self.last_modified.isoformat(),
        }

    @staticmethod
    def from_json(json_: dict) -> "Conversation":
        """
        Returns instance initialized from serialized representation.
        """
        return Conversation(
            id_=json_["id"],
            origin=json_["origin"],
            name=json_["name"],
            path=(None if "path" not in json_ else Path(json_["path"])),
            length=json_["length"],
            last_modified=datetime.fromisoformat(json_["lastModified"]),
        )


class MessageStore:
    """
    Handles loading, writing, and caching content.

    Due to the caching-mechanism, the store can only correctly track
    changes made to the underlying data on disk if all changes to the
    data are made through the store.

    Keyword arguments:
    working_dir -- working directory
    """

    def __init__(self, working_dir: Path) -> None:
        self._working_dir = working_dir
        self._cache: dict[str, Conversation] = {}
        self._master_lock = Lock()
        self._cache_lock: dict[str, RLock] = {}

    def _check_locks(self, cid: str) -> RLock:
        """
        Checks for existing lock for conversation `cid` in _cache_lock-
        register and creates new if it does not exist.
        """
        if cid not in self._cache_lock:
            with self._master_lock:
                if cid not in self._cache_lock:
                    self._cache_lock[cid] = RLock()
        return self._cache_lock[cid]

    def load_conversation(self, cid: str) -> Optional[Conversation]:
        """
        Loads conversation-metadata into memory and returns
        `Conversation` (or `None` in case of error).

        Keyword arguments:
        cid -- conversation id to be loaded
        """
        with self._check_locks(cid):
            if cid in self._cache:
                return self._cache[cid]

            index = self._working_dir / cid / "index.json"
            try:
                self._cache[cid] = Conversation.from_json(
                    json.loads(
                        index.read_text(
                            encoding="utf-8"
                        )
                    ) | {"path": index}
                )
            except (
                Exception  # pylint: disable=broad-exception-caught
            ) as exc_info:
                print(
                    f"ERROR: Unable to load conversation '{cid}': {exc_info}",
                    file=sys.stderr,
                )
                return None
            return self._cache[cid]

    def load_message(self, cid: str, mid: str) -> Optional[Message]:
        """
        Loads conversation-metadata into memory and returns
        `Conversation` (or `None` in case of error).

        Keyword arguments:
        cid -- conversation id
        mid -- message id
        """
        # TODO
