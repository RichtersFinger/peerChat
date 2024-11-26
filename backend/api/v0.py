"""Definition of blueprint for backend API v0."""

from flask import Blueprint, Response


def blueprint_factory() -> Blueprint:
    """Returns a flask-Blueprint implementing the API v0."""
    bp = Blueprint("v0", "v0")

    @bp.route("/ping", methods=["GET"])
    def ping():
        return Response("pong", mimetype="text/plain", status=200)

    return bp
