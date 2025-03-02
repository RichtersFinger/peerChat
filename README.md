# peerChat

A minimal self-hosted peer-to-peer chat application written in python (Flask+Socket.IO-backend) and TypeScript (React-frontend).

It is
* platform-independent,
* easy to setup and use,

and features for example
* message queues (auto-resend if peers are offline)

## Install
`peerChat` can be installed using `pip` by entering
```
pip install peerChat
```
It is recommended to use a virtual environment
```
python3 -m venv venv
source venv/bin/activate
```

## Run
Start the `peerChat`-application with
```
peerChat
```
By default, the web-UI is available on port `http://localhost:27182`.
If you are done, stop by hitting `Ctrl`+`C`.

When the UI is first opened, some configuration has to be performed.
Follow the dialog shown in the UI to set a key (or password) that will be used to authenticate with the server.
Note that this key will be stored unencrypted in your file system (`peerChat` is intended to be run locally so usually that key will never leave the local machine).

After this technical setup is complete, your profile can be customized by selecting `Settings` in the context menu at the top of the sidebar.
Here, most importantly, you should set your public network address to ensure your peers can respond to your messages.

## Update
Run
```
pip install --upgrade peerChat
```
to get the latest version.

## Building from source
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

- `PORT` [DEFAULT 27182] peerChat port
- `WORKING_DIRECTORY` [DEFAULT ".peerChat"] working directory of the application; default is the subdirectory `.peerChat` in the current working directory
- `SECRET_KEY` [DEFAULT null] override the otherwise automatically generated secret key
- `USER_PEER_URL` [DEFAULT null] can be used to set the public peer-url; can also be set via the UI
- `MODE` [DEFAULT prod] execution mode; one of "prod" or "dev"

Extended options for configuration can be accessed via the `AppConfig`-class used by the underlying `flask`-webserver which is passed in to the app-factory.

### Public API
The public part of the `peerChat`-API can be used to
* fetch information on a given peer,
* post messages, and
* notify of changes.

Please refer to the OpenAPI v3-document `openapi.yaml` for details.

### Running in dev-mode
The development setup requires both `python3` and the node package manager `npm` to be installed.
Contrary to the pure python production server, back- and frontend are run separately in the development context.

To run the backend server, enter
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install .
pip install -r dev-requirements.txt
MODE=dev flask run
```

Based on pre-defined scripts, the frontend development server can be started with
```
cd frontend
npm install
npm start
```

The client can then be accessed via the node-development server at `http://localhost:3000`.
