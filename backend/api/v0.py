"""Definition of blueprint for backend API v0."""

from flask import (
    Blueprint,
    Response,
    jsonify,
    make_response,
    send_file,
    request,
)
from flask_socketio import SocketIO

# pylint: disable=relative-beyond-top-level
from ..common import (
    User,
    Auth,
    MessageStore,
    Message,
    MessageStatus,
    Conversation,
)


def blueprint_factory(
    user: User, auth: Auth, socket: SocketIO, store: MessageStore
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
        if user.avatar:
            r = make_response(send_file(user.avatar))
            r.headers["Access-Control-Allow-Origin"] = "*"
            return r
        return jsonify(user.avatar), 404

    @bp.route("/message", methods=["POST"])
    def post_message():
        """
        Processes posted messages. Expected json-contents
        `{"cid": <conversation-id>, "msg": <Message.json>, "peer": <origin-peer-url>}`.
        """
        json = request.get_json(silent=True)
        if not json:
            return Response("Missing JSON.", mimetype="text/plain", status=400)
        # TODO: validate 'cid'-format (alphanumeric/uuid?)
        c = None
        try:
            c = store.load_conversation(json["cid"])
            if c is None:
                c = Conversation(
                    json.get("peer", request.remote_addr),
                    name="New Conversation",
                    id_=json["cid"],
                )
                store.set_conversation_path(c)
                store.create_conversation(c)
            else:
                if "peer" in json:
                    c.peer = json["peer"]
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
            socket.emit("got-message", {"cid": c.id_, "mid": mid})
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

    return bp
