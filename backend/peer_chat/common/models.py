"""Common data model definitions."""

from typing import Optional
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime
import json
from uuid import uuid4
from enum import Enum


@dataclass
class User:
    """User definition."""

    name: str
    address: Optional[str] = None

    @property
    def json(self) -> dict:
        """Returns serialized representation of the given object."""
        _json = {"name": self.name}
        if self.address:
            _json["address"] = self.address
        return _json

    @classmethod
    def from_json(cls, json_) -> "User":
        """Returns deserialized object."""
        return cls(
            name=json_.get("name"),
            address=json_.get("address")
        )

    def write(self, path: Path) -> None:
        """Write to disk."""
        path.write_text(json.dumps(self.json), encoding="utf-8")


@dataclass
class Auth:
    """User auth information."""

    KEY = "peerChatAuth"
    value: Optional[str]

    def write(self, path: Path) -> None:
        """Write to disk."""
        if not path.is_file:
            path.touch(mode=0o600)
        path.write_text(self.value, encoding="utf-8")


class MessageStatus(Enum):
    """Message status enum."""

    OK = "ok"
    SENDING = "sending"
    DRAFT = "draft"
    DELETED = "deleted"
    ERROR = "error"


@dataclass
class Message:
    """
    Record class for message metadata and content. Implements
    (de-)serialization methods `json` and `from_json`.

    Message `id_`s are integer values 0, 1, 2... representing order of
    messages.
    """

    id_: Optional[int] = None
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
        kwargs = {}
        for key, jsonkey in (
            ("id_", "id"),
            ("body", "body"),
            ("status", "status"),
            ("is_mine", "isMine"),
            ("last_modified", "lastModified"),
        ):
            if jsonkey in json_:
                kwargs[key] = json_[jsonkey]
        if "status" in kwargs:
            kwargs["status"] = MessageStatus(kwargs["status"])
        if "last_modified" in kwargs:
            kwargs["last_modified"] = datetime.fromisoformat(
                kwargs["last_modified"]
            )
        return Message(**kwargs)


@dataclass
class Conversation:
    """
    Record class for conversation metadata and content. Implements
    (de-)serialization methods `json` and `from_json`.

    The keys in `messages` are `Message.id_`s.
    """

    peer: str
    name: str
    id_: str = field(default_factory=lambda: str(uuid4()))
    path: Optional[Path] = None  # points to directory
    length: int = 0
    last_modified: datetime = field(default_factory=datetime.now)
    unread_messages: bool = True
    messages: dict[int, Message] = field(default_factory=dict)

    @property
    def json(self) -> dict:
        """Returns a serializable representation of this object."""
        return {
            "id": self.id_,
            "peer": self.peer,
            "name": self.name,
            "length": self.length,
            "lastModified": self.last_modified.isoformat(),
            "unreadMessages": self.unread_messages,
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
            unread_messages=json_["unreadMessages"],
        )
