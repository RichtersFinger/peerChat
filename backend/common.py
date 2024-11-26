"""Common definitions."""

from dataclasses import dataclass
from pathlib import Path


@dataclass
class User:
    """User definition."""

    name: str
    avatar: Path

    @property
    def json(self) -> dict:
        """Returns serialized representation of the given object."""
        return {"name": self.name, "avatar": str(self.avatar)}
