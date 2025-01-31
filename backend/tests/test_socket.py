"""Test module for backend Flask socket."""

import os
from pathlib import Path
from uuid import uuid4

import pytest
from flask import Flask
from flask_socketio import SocketIO

from peer_chat.app import app_factory
from peer_chat.common import Auth, Message, MessageStatus


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

    app, socket = app_factory(working_dir=tmp)
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


def test_list_conversations(clients: tuple[Flask, SocketIO], tmp: Path, fake_conversation):
    """Test 'list-conversations'-event."""
    _, socket_client = clients

    c = fake_conversation(tmp)

    assert socket_client.emit("list-conversations", callback=True) == [c.id_]


def test_get_conversation_unknown(clients: tuple[Flask, SocketIO]):
    """Test 'get-conversation'-event for unknown conversation."""
    _, socket_client = clients

    assert (
        socket_client.emit("get-conversation", "unknown-id", callback=True)
        == []
    )


def test_get_conversation(clients: tuple[Flask, SocketIO], tmp: Path, fake_conversation):
    """Test 'get-conversation'-event."""
    _, socket_client = clients

    c = fake_conversation(tmp)
    c.messages = {}

    assert (
        socket_client.emit("get-conversation", c.id_, callback=True) == c.json
    )


def test_create_conversations(clients: tuple[Flask, SocketIO]):
    """Test 'create-conversation'-event."""
    _, socket_client = clients

    cid = socket_client.emit(
        "create-conversation",
        "hostname.com",
        "some topic",
        callback=True,
    )

    assert socket_client.emit("list-conversations", callback=True) == [cid]
    c = socket_client.emit("get-conversation", cid, callback=True)
    assert c["peer"] == "hostname.com"
    assert c["name"] == "some topic"


def test_get_message_unknown(clients: tuple[Flask, SocketIO], tmp: Path, fake_conversation):
    """Test 'get-message'-event for unknown message."""
    _, socket_client = clients

    c = fake_conversation(tmp)

    assert (
        socket_client.emit("get-message", c.id_, "unknown-id", callback=True)
        == []
    )


def test_get_message(clients: tuple[Flask, SocketIO], tmp: Path, fake_conversation):
    """Test 'get-message'-event."""
    _, socket_client = clients

    c = fake_conversation(tmp)

    assert (
        socket_client.emit("get-message", c.id_, "0", callback=True)
        == c.messages["0"].json
    )


def test_post_message_minimal(clients: tuple[Flask, SocketIO], tmp: Path, fake_conversation):
    """Test 'post-message'-event."""
    _, socket_client = clients

    c = fake_conversation(tmp)
    m = Message(body="text1")

    assert socket_client.emit(
        "post-message", c.id_, m.json, callback=True
    ) == str(c.length)
    assert socket_client.emit(
        "get-message", c.id_, str(c.length), callback=True
    ) == m.json | {"id": str(c.length)}


def test_post_message(clients: tuple[Flask, SocketIO], tmp: Path, fake_conversation):
    """Test 'post-message'-event."""
    _, socket_client = clients

    c = fake_conversation(tmp)
    m = Message(
        id_="1", body="text2", is_mine=True, status=MessageStatus.ERROR
    )

    assert (
        socket_client.emit("post-message", c.id_, m.json, callback=True)
        == m.id_
    )
    assert (
        socket_client.emit("get-message", c.id_, m.id_, callback=True)
        == m.json
    )


def test_api_post_message(clients: tuple[Flask, SocketIO]):
    """Test API-endpoint for POST-/message."""
    flask_client, socket_client = clients

    cid = socket_client.emit(
        "create-conversation",
        "hostname.com",
        "some topic",
        callback=True,
    )
    m = Message(body="text")

    response = flask_client.post(
        "/api/v0/message", json={"cid": cid, "msg": m.json}
    )
    assert response.status_code == 200

    msgs = socket_client.get_received()
    assert len(msgs) == 2
    assert any(
        msg["name"].startswith("update-conversation")
        and msg["name"].endswith(cid)
        for msg in msgs
    )
    assert any(
        msg["name"].startswith("update-message")
        and msg["args"][0]["cid"] == cid
        and msg["args"][0]["message"]["id"] == "0"
        and msg["args"][0]["message"]["body"] == m.body
        for msg in msgs
    )
    assert (
        socket_client.emit("get-message", cid, "0", callback=True)["body"]
        == m.body
    )


def test_api_post_message_missing_json(clients: tuple[Flask, SocketIO]):
    """Test API-endpoint for POST-/message with missing JSON."""
    flask_client, _ = clients

    assert flask_client.post("/api/v0/message").status_code == 400


def test_api_post_message_missing_json_content(
    clients: tuple[Flask, SocketIO], tmp: Path, fake_conversation
):
    """Test API-endpoint for POST-/message with missing JSON content."""
    flask_client, _ = clients

    c = fake_conversation(tmp)
    m = Message(body="text")

    assert (
        flask_client.post("/api/v0/message", json={"msg": m.json}).status_code
        == 400
    )

    assert (
        flask_client.post("/api/v0/message", json={"cid": c.id_}).status_code
        == 400
    )


def test_api_post_message_new_conversation(clients: tuple[Flask, SocketIO]):
    """Test API-endpoint for POST-/message for new conversation."""
    flask_client, socket_client = clients

    cid = str(uuid4())
    m = Message(body="text")

    response = flask_client.post(
        "/api/v0/message", json={"cid": cid, "msg": m.json}
    )
    assert response.status_code == 200
    assert response.text == cid
    assert (
        socket_client.emit("get-conversation", cid, callback=True)["length"]
        == 1
    )


def test_api_post_message_change_peer(clients: tuple[Flask, SocketIO]):
    """Test API-endpoint for POST-/message with peer-address update."""
    flask_client, socket_client = clients

    cid = socket_client.emit(
        "create-conversation",
        "hostname.com",
        "some topic",
        callback=True,
    )
    assert (
        socket_client.emit("get-conversation", cid, callback=True)["peer"]
        == "hostname.com"
    )
    m = Message(body="text")

    assert (
        flask_client.post(
            "/api/v0/message",
            json={"cid": cid, "msg": m.json, "peer": "new-hostname.com"},
        ).status_code
        == 200
    )
    assert (
        socket_client.emit("get-conversation", cid, callback=True)["peer"]
        == "new-hostname.com"
    )


def test_send_message(
    clients: tuple[Flask, SocketIO], tmp_base: Path, run_app
):
    """Test API-endpoint for POST-/message with send-message-event."""
    other_working_dir = tmp_base / "test_send_message"
    run_app(
        app_factory("http://localhost:8081", other_working_dir)[0],
        "8081",
    )

    _, socket_client = clients

    cid = socket_client.emit(
        "create-conversation",
        "http://localhost:8081",
        "some topic",
        callback=True,
    )
    m = Message(body="text")
    mid = socket_client.emit("post-message", cid, m.json, callback=True)

    assert not (other_working_dir / cid).exists()

    assert socket_client.emit("send-message", cid, mid, callback=True)

    assert (other_working_dir / cid).exists()
    assert (other_working_dir / cid / "index.json").is_file()
    assert (other_working_dir / cid / "0.json").is_file()
