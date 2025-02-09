# peerChat

A minimal self-hosted p2p chat application written in python (backend) and React (frontend).

## Install
tdb

## Run
tdb

## Update
tdb

## Build from source
The provided `Makefile` provides targets for building from source.
Run
* `make build` to build the python package bundled with the static client (react)
  * the distribution-files can be found in `backend/dist`
  * the build version can be set with `make build VERSION="1.0.0.post5+a6cd1d01"`
  * the client build can be skipped with `make build SKIP_CLIENT="yes"`
* `make clean` to remove build artifacts

A build requires `npm` as well as the `venv`-module of `python3` to be successful.

## Authorization-concept

Since the service is intended for self-hosting, it only supports a single user per running instance of `peerChat`.
In order to identify a user, a (automatically generated or user-defined) key is used.
The backend-API allows to configure this key only once.

To reset that key, the corresponding key-file `.peerChat.auth` can be deleted.
After deleting, the service needs to be restarted for changes to take effect.

## Environment configuration
The following environment variables can be set to configure peerChat:

- `FLASK_RUN_PORT` [DEFAULT 27182] peerChat port
- `WORKING_DIRECTORY` [DEFAULT ".peerChat"] working directory of the application; default is the subdirectory `.peerChat` in the current working directory
- `SECRET_KEY` [DEFAULT null] override the otherwise automatically generated secret key
- `USER_PEER_URL` [DEFAULT null] can be used to set the public peer-url; can also be set via the UI

Extended options for configuration can be accessed via the `AppConfig`-class used by the underlying `flask`-webserver which is passed in to the app-factory.

### Public API v0
The following list briefly describes the public part of the peerChat API.

- `GET-/ping` returns `"pong"`
- `GET-/who` returns JSON-object that describes the available parts of the API in the format
  ```json
  { "api": { "0": "/api/v0" }, "name": "peerChatAPI" }
  ```
- `GET-/user/name` returns the client's name
- `GET-/user/avatar` returns the client's avatar
- `POST-/message` post new message; return `200` if request is ok, `400` on bad body

  expected request body-format
  ```json
  {
    "cid": <conversation-id>,
    "msg": <Message.json>,  // TODO
    "peer": <origin-peer-url>
  }
  ```
  (the optional field `"peer"` can be used to provide a callback-url for the given conversation)
