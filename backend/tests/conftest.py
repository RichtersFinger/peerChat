"""Common fixtures."""

from pathlib import Path
from shutil import rmtree
from datetime import datetime
import random
from uuid import uuid4
import urllib
from time import time, sleep
from multiprocessing import Process

import pytest
from flask import Flask

from peer_chat.config import AppConfig
from peer_chat.common import Conversation, Message, MessageStatus, MessageStore


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


@pytest.fixture(name="testing_config")
def _testing_config(tmp):
    class TestingConfig(AppConfig):
        WORKING_DIRECTORY = tmp
        TESTING = True

    return TestingConfig()


@pytest.fixture(name="fake_conversation")
def _fake_conversation():
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

    return fake_conversation


@pytest.fixture(name="run_app")
def run_app(request):
    """
    Factory for flask-app startup within pytest-test.
    """
    HEALTH_PATH = "is-alive"

    def _(app: Flask, port: str) -> Process:
        def run_process():
            @app.route(
                f"/{HEALTH_PATH}",
                methods=["GET"],
                provide_automatic_options=False,
            )
            def is_alive():
                """Generic service health."""
                return "OK", 200

            app.run(host="0.0.0.0", port=port, debug=False)

        p = Process(target=run_process)
        p.start()

        def kill_process():
            if p.is_alive():
                p.kill()
                p.join()

        request.addfinalizer(kill_process)

        # wait for service to have started up
        t0 = time()
        running = False
        while not running and time() - t0 < 5:
            try:
                running = (
                    urllib.request.urlopen(
                        f"http://localhost:{port}/{HEALTH_PATH}"
                    ).status
                    == 200
                )
            except (urllib.error.URLError, ConnectionResetError):
                sleep(0.01)
        if not running:
            raise RuntimeError("Service did not start.")

        return p

    yield _
