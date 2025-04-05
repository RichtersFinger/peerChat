FROM python:3.10-alpine

# setup for all users
RUN umask 022
RUN pip install peerChat

# setup non-root default user
RUN adduser -u 27182 -S peer_chat -G users
USER peer_chat
WORKDIR /app

ENTRYPOINT ["peerChat"]
