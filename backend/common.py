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

    Message `id_`s are strings of integer values 0, 1, 2...
    """

    id_: Optional[str] = None
    body: Optional[str] = None
    status: MessageStatus = MessageStatus.DRAFT
    is_mine: bool = True
    last_modified: datetime = field(default_factory=datetime.now)

    @property
    def json(self) -> dict:
        """Returns a serializable representation of this object."""
        return {
            "id": self.id_,
            "body": self.body,
            "status": self.status.value,
            "isMine": self.is_mine,
            "lastModified": self.last_modified.isoformat(),
        }

    @staticmethod
    def from_json(json_: dict) -> "Message":
        """
        Returns instance initialized from serialized representation.
        """
        return Message(
            id_=json_["id"],
            body=json_["body"],
            status=MessageStatus(json_["status"]),
            is_mine=json_["isMine"],
            last_modified=datetime.fromisoformat(json_["lastModified"]),
        )


@dataclass
class Conversation:
    """
    Record class for conversation metadata and content. Implements
    (de-)serialization methods `json` and `from_json`.

    The keys in `messages` are strings of integer values 0, 1, 2...
    """

    peer: str
    name: str
    id_: str = field(default_factory=lambda: str(uuid4()))
    path: Optional[Path] = None  # points to directory
    length: int = 0
    last_modified: datetime = field(default_factory=datetime.now)
    messages: dict[str, Message] = field(default_factory=dict)

    @property
    def json(self) -> dict:
        """Returns a serializable representation of this object."""
        return {
            "id": self.id_,
            "peer": self.peer,
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
            peer=json_["peer"],
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
        working_dir.mkdir(parents=True, exist_ok=True)
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

    def list_conversations(self) -> list[str]:
        """Returns a (heuristic) list of conversation-ids."""
        conversations = []
        for c in self._working_dir.glob("*"):
            if c.is_dir() and (c / "index.json").is_file():
                conversations.append(c.name)
        return conversations

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
                    json.loads(index.read_text(encoding="utf-8"))
                    | {"path": index.parent}
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
        with self._check_locks(cid):
            c = self.load_conversation(cid)
            if c is None:
                return None

            if mid in c.messages:
                return c.messages[mid]
            try:
                c.messages[mid] = Message.from_json(
                    json.loads(
                        (c.path / f"{mid}.json").read_text(encoding="utf-8")
                    )
                )
            except (
                Exception  # pylint: disable=broad-exception-caught
            ) as exc_info:
                print(
                    f"ERROR: Unable to load conversation '{cid}': {exc_info}",
                    file=sys.stderr,
                )
                return None
            return c.messages[mid]

    def set_conversation_path(self, c: Conversation) -> None:
        """Sets a `Conversation`'s index-path."""
        c.path = self._working_dir / c.id_

    def create_conversation(self, c: Conversation) -> None:
        """
        Creates new conversation.

        Keyword arguments:
        c -- conversation object
        """
        with self._check_locks(c.id_):
            c.path.mkdir(parents=True, exist_ok=True)
            self._cache[c.id_] = c
            self.write(c.id_)

    def post_message(self, cid: str, msg: Message) -> str:
        """
        Handle request to post new message in existing conversation.
        Returns `Message.id_`.

        Keyword arguments:
        cid -- conversation id
        msg -- message object
        """
        with self._check_locks(cid):
            c = self.load_conversation(cid)
            if c is None:
                print(
                    f"ERROR: Unable to post to conversation '{cid}'.",
                    file=sys.stderr,
                )
                return
            if msg.id_ is None:
                msg.id_ = str(c.length)
            c.messages[msg.id_] = msg
            c.length = len(c.messages)
            self.write(c.id_, msg.id_)
            return msg.id_

    def write(self, cid: str, mid: Optional[str] = None) -> None:
        """
        Write `Conversation` metadata or `Message` from cache to disk.

        If `mid` is not `None`, the references `Message` will be written
        instead of the Conversation-metadata

        Keyword arguments:
        cid -- conversation id
        mid -- message id
               (default None)
        """
        with self._check_locks(cid):
            c = self.load_conversation(cid)
            if c is None:
                print(
                    f"ERROR: Unable to write conversation '{cid}'.",
                    file=sys.stderr,
                )
                return
            if mid is None:
                (c.path / "index.json").write_text(
                    json.dumps(c.json), encoding="utf-8"
                )
                return
            if mid not in c.messages:
                print(
                    f"ERROR: Unable to write message '{cid}.{mid}'.",
                    file=sys.stderr,
                )
                return
            (c.path / f"{mid}.json").write_text(
                json.dumps(c.messages[mid].json), encoding="utf-8"
            )
