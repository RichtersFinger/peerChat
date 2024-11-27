# peerChat

A minimal self-hosted p2p chat application.

## Backend

### General

### Configuration

- `USER_JSON_FILE` [DEFAULT ".user.json"] JSON-document location storing user profile settings
- `DEFAULT_USER_AVATAR` [DEFAULT "static/avatar.png"] fallback user avatar location
- `SECRET_KEY_FILE` [DEFAULT ".secret_key"] location for app's secret key file

### Endpoints

- `GET-/ping` returns `"pong"`
- `GET-/who` returns JSON-object that describes the available parts of the API in the format
  ```json
  { "api": { "0": "/api/v0" }, "name": "peerChatAPI" }
  ```

### API v0

### Endpoints

See [general endpoint](#endpoints) `GET-/who` for base-url path

- `GET-/user/name` returns the client's name
- `GET-/user/avatar` returns the client's avatar
