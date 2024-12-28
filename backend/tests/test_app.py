"""Test module for backend Flask app."""

import os
from pathlib import Path
from uuid import uuid4
from json import dumps

# pylint: disable=relative-beyond-top-level
from ..app import load_config, load_auth, load_secret_key, app_factory
from ..common import User, Auth


def unload_environment_variable(name: str):
    """Helper for environment cleanup. Unset env-variable."""
    del os.environ[name]


def test_load_config(request, tmp: Path):
    """Test function `load_config`."""
    request.addfinalizer(lambda: unload_environment_variable("USER_JSON_FILE"))
    file = tmp / str(uuid4())
    avatar = tmp / str(uuid4())
    avatar.touch()
    user_json_text = dumps(User("A", avatar, file).json)
    file.write_text(user_json_text, encoding="utf-8")

    os.environ["USER_JSON_FILE"] = str(file)
    user = load_config()
    assert dumps(user.json) == user_json_text


def test_load_config_missing(request, tmp: Path):
    """Test function `load_config` for missing file."""
    request.addfinalizer(lambda: unload_environment_variable("USER_JSON_FILE"))
    file = tmp / str(uuid4())
    assert not file.exists()

    os.environ["USER_JSON_FILE"] = str(file)
    user = load_config()
    assert file.exists()
    assert dumps(user.json) == file.read_text(encoding="utf-8")


def test_load_auth(request, tmp: Path):
    """Test function `load_auth`."""
    request.addfinalizer(lambda: unload_environment_variable("AUTH_FILE"))
    file = tmp / str(uuid4())
    value = str(uuid4())
    file.write_text(value, encoding="utf-8")

    os.environ["AUTH_FILE"] = str(file)
    auth = load_auth()
    assert auth.value == value


def test_load_auth_missing(request, tmp: Path):
    """Test function `load_auth` for missing file."""
    request.addfinalizer(lambda: unload_environment_variable("AUTH_FILE"))
    file = tmp / str(uuid4())

    os.environ["AUTH_FILE"] = str(file)
    auth = load_auth()
    assert auth.value is None


def test_load_secret_key(request, tmp: Path):
    """Test function `load_secret_key`."""
    request.addfinalizer(
        lambda: unload_environment_variable("SECRET_KEY_FILE")
    )
    file = tmp / str(uuid4())
    key = str(uuid4())
    file.write_text(key, encoding="utf-8")

    os.environ["SECRET_KEY_FILE"] = str(file)
    assert load_secret_key() == key


def test_load_secret_key_missing(request, tmp: Path):
    """Test function `load_secret_key` for missing file."""
    request.addfinalizer(
        lambda: unload_environment_variable("SECRET_KEY_FILE")
    )
    file = tmp / str(uuid4())

    os.environ["SECRET_KEY_FILE"] = str(file)
    key = load_secret_key()
    assert key
    assert key == file.read_text(encoding="utf-8")


def test_app_ping():
    """Test endpoint `GET-/ping`."""
    client = app_factory("")[0].test_client()
    response = client.get("/ping")
    assert response.status_code == 200
    assert response.data == b"pong"


def test_app_who():
    """Test endpoint `GET-/who`."""
    client = app_factory("")[0].test_client()
    response = client.get("/who")
    assert response.status_code == 200
    assert "name" in response.json and response.json["name"] == "peerChatAPI"
    assert "api" in response.json


def test_app_create_auth_key(request, tmp: Path):
    """Test endpoint `/auth/key` for missing auth file."""
    request.addfinalizer(lambda: unload_environment_variable("AUTH_FILE"))
    file = tmp / str(uuid4())
    os.environ["AUTH_FILE"] = str(file)

    client = app_factory("")[0].test_client()
    assert client.get("/auth/key").status_code == 404
    response = client.post("/auth/key")
    assert response.status_code == 200
    assert response.data == file.read_bytes()
    assert client.get("/auth/key").status_code == 200
    assert client.post("/auth/key").status_code == 409


def test_app_create_auth_key_existing(request, tmp: Path):
    """Test endpoint `/auth/key` for existing auth file."""
    request.addfinalizer(lambda: unload_environment_variable("AUTH_FILE"))
    file = tmp / str(uuid4())
    file.write_text(str(uuid4()), encoding="utf-8")
    os.environ["AUTH_FILE"] = str(file)

    client = app_factory("")[0].test_client()
    assert client.get("/auth/key").status_code == 200


def test_app_create_auth_key_user_value(request, tmp: Path):
    """Test endpoint `/auth/key` with user-defined key value."""
    request.addfinalizer(lambda: unload_environment_variable("AUTH_FILE"))
    file = tmp / str(uuid4())
    key = str(uuid4())
    os.environ["AUTH_FILE"] = str(file)

    client = app_factory("")[0].test_client()
    response = client.post("/auth/key", json={Auth.KEY: key})
    assert response.status_code == 200
    assert response.data == file.read_bytes()
    assert response.data == key.encode(encoding="utf-8")
