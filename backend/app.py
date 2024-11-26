"""peerChat-backend definition."""

from flask import Flask

from .api.v0 import blueprint_factory as v0_blueprint


app = Flask(__name__)
app.register_blueprint(
    v0_blueprint(),
    url_prefix="/api/v0/",
)
