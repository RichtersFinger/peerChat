"""Define app for flask-cli."""

from peer_chat.config import AppConfig
from peer_chat.app import app_factory


app = app_factory(AppConfig())[0]
