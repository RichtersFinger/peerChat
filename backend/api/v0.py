"""Definition of blueprint for backend API v0."""

from flask import Blueprint, Response, jsonify, send_file

from ..common import User, Auth  # pylint: disable=relative-beyond-top-level


def blueprint_factory(user: User, auth: Auth) -> Blueprint:
    """Returns a flask-Blueprint implementing the API v0."""
    bp = Blueprint("v0", "v0")

    @bp.route("/user/name", methods=["GET"])
    def user_name():
        return Response(user.name, mimetype="text/plain", status=200)

    @bp.route("/user/avatar", methods=["GET"])
    def user_image():
        if user.avatar:
            return send_file(user.avatar)
        return jsonify(user.avatar), 404

    return bp
