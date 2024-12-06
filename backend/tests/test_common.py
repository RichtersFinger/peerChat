"""Test module for common code."""

from pathlib import Path
from shutil import rmtree
from uuid import uuid4
from json import dumps
from datetime import datetime
import random

# pylint: disable=relative-beyond-top-level
from ..common import MessageStore


def fake_conversation(dir_: Path) -> Path:
    """
    Creates a fake conversation and returns path to the disk-location.
    """
    id_ = str(uuid4())
    length = random.randint(1, 5)
    conversation_dir = dir_ / id_
    conversation_dir.mkdir(parents=True, exist_ok=False)
    index = conversation_dir / "index.json"
    index.write_text(
        dumps(
            {
                "id": id_,
                "origin": ".".join(
                    [str(random.randint(1, 255)) for _ in range(4)]
                ),
                "name": f"conversation {random.randint(1, 10)}",
                "length": length,
                "lastModified": datetime.now().isoformat(),
            }
        ),
        encoding="utf-8",
    )
    for msg_id in range(length):
        msg_file = conversation_dir / f"{msg_id}.json"
        msg_file.write_text(
            dumps(
                {
                    "id": msg_id,
                    "body": random.choice(["cat", "dog", "bird"]),
                    "status": random.choice(
                        [
                            "ok",
                            "queued",
                            "sending",
                            "draft",
                            "deleted",
                            "error",
                        ]
                    ),
                    "lastModified": datetime.now().isoformat(),
                }
            ),
            encoding="utf-8",
        )

    return conversation_dir


def test_message_store_loading_and_caching_conversation(tmp: Path):
    """Test loading and caching of conversations in `MessageStore`."""
    store = MessageStore(tmp)

    # check behavior for missing data
    assert store.load_conversation("unknown-id") is None

    # prepare and load test-data
    conversation_dir = fake_conversation(tmp)
    conversation = store.load_conversation(conversation_dir.name)

    assert conversation is not None
    assert conversation.id_ == conversation_dir.name

    # test caching
    rmtree(conversation_dir)
    conversation = store.load_conversation(conversation_dir.name)
    assert conversation is not None
