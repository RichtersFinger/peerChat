"""Test module for backend Flask socket."""

import os
from pathlib import Path
from uuid import uuid4

import pytest
from flask import Flask
from flask_socketio import SocketIO

# pylint: disable=relative-beyond-top-level
from ..app import app_factory
from ..common import Auth
from .conftest import fake_conversation


def unload_environment_variable(name: str):
    """Helper for environment cleanup. Unset env-variable."""
    del os.environ[name]


@pytest.fixture(name="clients")
def _clients(request, tmp: Path):
    """Returns authenticated clients for http and websocket."""
    request.addfinalizer(lambda: unload_environment_variable("AUTH_FILE"))
    file = tmp / str(uuid4())
    key = str(uuid4())
    file.write_text(key, encoding="utf-8")
    os.environ["AUTH_FILE"] = str(file)

    app, socket = app_factory(tmp)
    http_client = app.test_client()
    http_client.set_cookie(Auth.KEY, key)
    socket_client = socket.test_client(app=app, flask_test_client=http_client)

    return http_client, socket_client


def test_connect(request, tmp: Path):
    """Test opening socket."""
    request.addfinalizer(lambda: unload_environment_variable("AUTH_FILE"))
    file = tmp / str(uuid4())
    key = str(uuid4())
    file.write_text(key, encoding="utf-8")
    os.environ["AUTH_FILE"] = str(file)

    app, socket = app_factory()
    http_client = app.test_client()
    socket_client = socket.test_client(app=app, flask_test_client=http_client)

    assert not socket_client.is_connected()
    http_client.set_cookie(Auth.KEY, key)
    assert not socket_client.is_connected()
    socket_client.connect()
    assert socket_client.is_connected()


def test_ping(clients: tuple[Flask, SocketIO]):
    """Test 'ping'-event."""
    _, socket_client = clients

    assert socket_client.emit("ping", callback=True) == "pong"


def test_get_conversation_unknown(clients: tuple[Flask, SocketIO]):
    """Test 'get-conversation'-event for unknown conversation."""
    _, socket_client = clients

    assert (
        socket_client.emit("get-conversation", "unknown-id", callback=True)
        == []
    )


def test_get_conversation(clients: tuple[Flask, SocketIO], tmp: Path):
    """Test 'get-conversation'-event."""
    _, socket_client = clients

    c = fake_conversation(tmp)
    c.messages = {}

    assert (
        socket_client.emit("get-conversation", c.id_, callback=True) == c.json
    )


def test_get_message_unknown(clients: tuple[Flask, SocketIO], tmp: Path):
    """Test 'get-message'-event for unknown message."""
    _, socket_client = clients

    c = fake_conversation(tmp)

    assert (
        socket_client.emit("get-message", c.id_, "unknown-id", callback=True)
        == []
    )


def test_get_message(clients: tuple[Flask, SocketIO], tmp: Path):
    """Test 'get-message'-event."""
    _, socket_client = clients

    c = fake_conversation(tmp)

    assert (
        socket_client.emit("get-message", c.id_, "0", callback=lambda p: None)
        == c.messages[0].json
    )
