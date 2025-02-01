"""Test module for backend Flask app."""

from pathlib import Path
from uuid import uuid4
from json import dumps

from peer_chat.config import AppConfig
from peer_chat.app import (
    load_user_config,
    load_auth,
    load_secret_key,
    app_factory,
)
from peer_chat.common import User, Auth


def test_load_config(tmp: Path):
    """Test function `load_config`."""
    file = tmp / str(uuid4())
    user = User("A", "http://localhost:5000").json
    file.write_text(dumps(user), encoding="utf-8")

    user_ = load_user_config(file)
    assert user == user_


def test_load_config_missing(tmp: Path):
    """Test function `load_config` for missing file."""
    file = tmp / str(uuid4())
    assert not file.exists()

    user = load_user_config(file)
    assert not file.exists()
    assert user.get("name")


def test_load_auth(tmp: Path):
    """Test function `load_auth`."""
    file = tmp / str(uuid4())
    value = str(uuid4())
    file.write_text(value, encoding="utf-8")

    auth = load_auth(file)
    assert auth == value


def test_load_auth_missing(tmp: Path):
    """Test function `load_auth` for missing file."""
    file = tmp / str(uuid4())

    auth = load_auth(file)
    assert auth is None


def test_load_secret_key(tmp: Path):
    """Test function `load_secret_key`."""
    file = tmp / str(uuid4())
    key = str(uuid4())
    file.write_text(key, encoding="utf-8")

    assert load_secret_key(file) == key


def test_load_secret_key_missing(tmp: Path):
    """Test function `load_secret_key` for missing file."""
    file = tmp / str(uuid4())

    key = load_secret_key(file)
    assert key
    assert key == file.read_text(encoding="utf-8")


def test_app_ping(testing_config: AppConfig):
    """Test endpoint `GET-/ping`."""
    client = app_factory(testing_config)[0].test_client()
    response = client.get("/ping")
    assert response.status_code == 200
    assert response.data == b"pong"


def test_app_who(testing_config: AppConfig):
    """Test endpoint `GET-/who`."""
    client = app_factory(testing_config)[0].test_client()
    response = client.get("/who")
    assert response.status_code == 200
    assert "name" in response.json and response.json["name"] == "peerChatAPI"
    assert "api" in response.json


def test_app_create_auth_key(testing_config: AppConfig):
    """Test endpoint `/auth/key` for missing auth file."""

    client = app_factory(testing_config)[0].test_client()
    assert client.get("/auth/key").status_code == 404
    response = client.post("/auth/key")
    assert response.status_code == 200
    assert (
        response.data
        == (
            testing_config.WORKING_DIRECTORY
            / testing_config.USER_AUTH_KEY_PATH
        ).read_bytes()
    )
    assert client.get("/auth/key").status_code == 200
    assert client.post("/auth/key").status_code == 409


def test_app_create_auth_key_existing(testing_config: AppConfig):
    """Test endpoint `/auth/key` for existing auth file."""
    (
        testing_config.WORKING_DIRECTORY / testing_config.USER_AUTH_KEY_PATH
    ).write_text(str(uuid4()), encoding="utf-8")

    client = app_factory(testing_config)[0].test_client()
    assert client.get("/auth/key").status_code == 200


def test_app_create_auth_key_user_value(testing_config: AppConfig):
    """Test endpoint `/auth/key` with user-defined key value."""
    key = str(uuid4())
    client = app_factory(testing_config)[0].test_client()
    response = client.post("/auth/key", json={Auth.KEY: key})
    assert response.status_code == 200
    assert response.data == key.encode(encoding="utf-8")
    assert response.data == (
        testing_config.WORKING_DIRECTORY / testing_config.USER_AUTH_KEY_PATH
    ).read_bytes()
