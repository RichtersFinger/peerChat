"""Common fixtures."""

from pathlib import Path
from shutil import rmtree
from json import dumps
from datetime import datetime
import random

import pytest

from ..common import Conversation, Message, MessageStatus


@pytest.fixture(scope="session", name="tmp")
def _tmp():
    """Set up file_storage"""
    return Path("tests/tmp")


@pytest.fixture(scope="session", autouse=True)
def fs_setup(request, tmp: Path):
    """Set up file_storage"""

    def cleanup():
        """Cleanup tmp-dir."""
        if tmp.is_dir():
            rmtree(tmp)

    cleanup()

    tmp.mkdir(parents=True, exist_ok=True)
    request.addfinalizer(cleanup)


def fake_conversation(dir_: Path) -> Conversation:
    """
    Creates a fake conversation and returns `Conversation`.
    """
    c = Conversation(
        origin=".".join([str(random.randint(1, 255)) for _ in range(4)]),
        name=f"conversation {random.randint(1, 10)}",
        length=random.randint(1, 5),
        last_modified=datetime.now(),
    )
    c.path = dir_ / c.id_ / "index.json"
    c.path.parent.mkdir(parents=True, exist_ok=False)
    c.path.write_text(
        dumps(c.json),
        encoding="utf-8",
    )
    for msg_id in range(c.length):
        c.messages[msg_id] = Message(
            msg_id,
            random.choice(["cat", "dog", "bird"]),
            random.choice(list(MessageStatus)),
        )
        (c.path.parent / f"{msg_id}.json").write_text(
            dumps(c.messages[msg_id].json),
            encoding="utf-8",
        )

    return c
