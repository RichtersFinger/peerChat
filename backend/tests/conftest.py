"""Common fixtures."""

from pathlib import Path
from shutil import rmtree
from datetime import datetime
import random
from uuid import uuid4

import pytest

from ..common import Conversation, Message, MessageStatus, MessageStore


@pytest.fixture(scope="session", name="tmp_base")
def _tmp_base():
    """Base for test file-storage."""
    return Path("tests/tmp")


@pytest.fixture(scope="session", autouse=True)
def fs_setup(request, tmp_base: Path):
    """Set up file_storage"""

    def cleanup():
        """Cleanup tmp-dir."""
        if tmp_base.is_dir():
            rmtree(tmp_base)

    cleanup()

    tmp_base.mkdir(parents=True, exist_ok=True)
    request.addfinalizer(cleanup)


@pytest.fixture(name="tmp")
def _tmp(tmp_base: Path):
    """Test-specific working directory."""
    p = tmp_base / str(uuid4())
    p.mkdir()
    return p


def fake_conversation(dir_: Path) -> Conversation:
    """
    Creates a fake conversation and returns `Conversation`.
    """
    ms = MessageStore(dir_)
    c = Conversation(
        peer=".".join([str(random.randint(1, 255)) for _ in range(4)]),
        name=f"conversation {random.randint(1, 10)}",
        length=random.randint(1, 5),
        last_modified=datetime.now(),
    )
    ms.set_conversation_path(c)
    ms.create_conversation(c)
    ms.write(c.id_)
    for msg_id in map(str, range(c.length)):
        ms.post_message(
            c.id_,
            Message(
                msg_id,
                random.choice(["cat", "dog", "bird"]),
                random.choice(list(MessageStatus)),
            ),
        )
        ms.write(c.id_, msg_id)

    return c
