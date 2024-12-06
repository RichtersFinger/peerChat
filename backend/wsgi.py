"""Define app for flask-cli."""

from .app import app_factory


app = app_factory()[0]
