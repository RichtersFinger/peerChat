"""Common definitions."""

from typing import Optional
import sys
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime
from threading import RLock
import json


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


@dataclass
class Conversation:
    """
    Record class for conversation metadata and content. Implements
    (de-)serialization methods for metadata.
    """

    id_: str
    origin: str
    name: str
    path: Optional[Path] = None
    length: int = 0
    last_modified: datetime = field(default_factory=datetime.now)
    # TODO: add messages-field

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
            last_modified=json_["lastModified"],
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
        self._cache_lock = RLock()

    def load_conversation(self, id_: str) -> Optional[Conversation]:
        """
        Loads conversation-index into memory and returns `Conversation`-
        object. Returns `None` in case of error.

        Keyword arguments:
        id_ -- conversation id to be loaded
        """
        with self._cache_lock:
            if id_ in self._cache:
                return self._cache[id_]

            try:
                self._cache[id_] = Conversation.from_json(
                    json.loads(
                        (self._working_dir / id_ / "index.json").read_text(
                            encoding="utf-8"
                        )
                    )
                )
            except (
                Exception  # pylint: disable=broad-exception-caught
            ) as exc_info:
                print(
                    f"ERROR: Unable to load conversation '{id_}': {exc_info}",
                    file=sys.stderr,
                )
                return None
            return self._cache[id_]
