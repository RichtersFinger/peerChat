import os
import sys

from flask_socketio import SocketIO


def socket_() -> SocketIO:
    """
    Returns a fully configured `SocketIO`-object that can registered
    with a Flask-application.
    """
    # enable CORS in development-environment
    try:
        from flask_cors import CORS  # pylint: disable=import-outside-toplevel, unused-import
    except ImportError:
        socketio = SocketIO()
    else:
        print("INFO: Configuring socket for CORS.", file=sys.stderr)
        socketio = SocketIO(
            cors_allowed_origins=os.environ.get(
                "CORS_FRONTEND_URL", "http://localhost:3000"
            )
        )

    @socketio.on("connect")
    def connect():
        print("connected")

    @socketio.on("event")
    def event():
        print("event happened")
        socketio.emit("event-response", {"value": 1})

    return socketio
