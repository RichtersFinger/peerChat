"""Common definitions."""

from typing import Optional
from dataclasses import dataclass
from pathlib import Path


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
