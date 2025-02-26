"""Definition of blueprint for backend API v0."""

from datetime import datetime

from flask import (
    Blueprint,
    Response,
    jsonify,
    make_response,
    send_file,
    request,
)
from flask_socketio import SocketIO

from peer_chat.config import AppConfig
from peer_chat.common import (
    User,
    MessageStore,
    Message,
    MessageStatus,
    Conversation,
)


def blueprint_factory(
    config: AppConfig, user: User, socket: SocketIO, store: MessageStore
) -> Blueprint:
    """Returns a flask-Blueprint implementing the API v0."""
    bp = Blueprint("v0", "v0")

    @bp.route("/user/name", methods=["GET"])
    def user_name():
        """Returns user name."""
        return Response(
            user.name,
            headers={"Access-Control-Allow-Origin": "*"},
            mimetype="text/plain",
            status=200,
        )

    @bp.route("/user/avatar", methods=["GET"])
    def user_image():
        """Returns avatar as file (if configured)."""
        if (config.WORKING_DIRECTORY / config.USER_AVATAR_PATH).is_file():
            r = make_response(
                send_file(
                    (
                        config.WORKING_DIRECTORY / config.USER_AVATAR_PATH
                    ).resolve(),
                    mimetype="image/xyz",
                )
            )
            r.headers["Access-Control-Allow-Origin"] = "*"
            return r
        return jsonify(user.avatar), 404

    @bp.route("/message", methods=["POST"])
    def post_message():
        """
        Processes posted messages.

        Expected JSON
        `{"cid": <conversation-id>, "name": <conversation-name>, "msg": <Message.json>, "peer": <origin-peer-url>}`.
        """
        json = request.get_json(silent=True)
        if not json:
            return Response("Missing JSON.", mimetype="text/plain", status=400)
        c = None
        try:
            c = store.load_conversation(json["cid"])
            if c is None:
                c = Conversation(
                    json.get("peer", request.remote_addr),
                    name=json.get("name", "New Conversation"),
                    id_=json["cid"],
                )
                store.set_conversation_path(c)
                store.create_conversation(c)
            else:
                if "peer" in json:
                    c.peer = json["peer"]
                c.unread_messages = True
            mid = store.post_message(
                c.id_,
                Message.from_json(
                    json["msg"]
                    | {
                        "id": None,
                        "isMine": False,
                        "status": MessageStatus.OK,
                    }
                ),
            )
            c.last_modified = datetime.now()
            m = store.load_message(c.id_, mid)
            socket.emit("update-conversation", c.json)
            socket.emit(
                "update-message",
                {"cid": c.id_, "message": m.json},
            )
        # pylint: disable=broad-exception-caught
        except Exception as exc_info:
            if c is not None:
                store.delete_conversation(c)
            return Response(
                f"Error processing request: {exc_info} "
                + f"({type(exc_info).__name__})",
                mimetype="text/plain",
                status=400,
            )
        return Response(c.id_, mimetype="text/plain", status=200)

    @bp.route("/update-available", methods=["POST"])
    def post_update():
        """
        Handles update notification (online status, changed avatar, or
        changed name).

        Expected JSON
        `{"peer": <origin-peer-url>}`.
        """
        json = request.get_json(silent=True)
        if not json:
            return Response("Missing JSON.", mimetype="text/plain", status=400)
        if "peer" not in json:
            return Response("Bad JSON.", mimetype="text/plain", status=422)
        socket.emit("changed-peer", json["peer"])
        return Response("OK", mimetype="text/plain", status=200)

    return bp
