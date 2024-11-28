# peerChat

A minimal self-hosted p2p chat application.

## Authorization-concept

Since the service is intended for self-hosting, it only supports a single user per running instance of peerChat.
In order to identify a user, a (automatically generated or user-defined) key is used.
The backend-API allows to configure this key only once.
To reset that key, the corresponding key-file has to be deleted or another file has to be referenced (see variable `AUTH_FILE`) before restarting the service (backend, specifically).

## Backend

### General

### Configuration

- `USER_JSON_FILE` [DEFAULT ".user.json"] JSON-document location storing user profile settings
- `DEFAULT_USER_AVATAR` [DEFAULT "static/avatar.png"] fallback user avatar location
- `SECRET_KEY_FILE` [DEFAULT ".secret_key"] location for app's secret key file
- `AUTH_FILE` [DEFAULT ".auth"] location for app's user-auth file

### Endpoints

- `GET-/ping` returns `"pong"`
- `GET-/who` returns JSON-object that describes the available parts of the API in the format
  ```json
  { "api": { "0": "/api/v0" }, "name": "peerChatAPI" }
  ```
- `GET-/auth/key` returns status `200` if key has been set (note that the key value will not be provided) and `404` otherwise
- `POST-/auth/key` set new key if possible; returns status `409` if key has already been set and otherwise `200` along with the key value in plain text

  expected request body-format for user-defined key:
  ```json
  {"peerChatAuth": <value>}
  ```


### API v0

### Endpoints

See [general endpoint](#endpoints) `GET-/who` for base-url path

- `GET-/user/name` returns the client's name
- `GET-/user/avatar` returns the client's avatar
