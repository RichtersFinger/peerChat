SHELL := /bin/bash
VENV := venv
SKIP_CLIENT =
VERSION =

_:
	echo "Missing target. See README for details."

venv:
	[ -d "${VENV}" ] || python3 -m venv venv

build-frontend:
	[ "${SKIP_CLIENT}" != "yes" ] && \
		cd frontend && \
		npm install && \
		GENERATE_SOURCEMAP=false npm run build || \
		echo "skip building client"

build-backend:
	rm -rf backend/peer_chat/client
	cp -r frontend/build backend/peer_chat/client

build: venv build-frontend build-backend
	source "${VENV}/bin/activate" && \
		pip install --upgrade pip wheel setuptools && \
		cd backend && \
		VERSION=${VERSION} python3 setup.py sdist bdist_wheel

publish:
	echo "not yet implemented"

clean-frontend:
	rm -rf frontend/build

clean-backend:
	rm -rf backend/peer_chat/client
	rm -rf backend/build
	rm -rf backend/peerChat.egg-info
	rm -rf backend/__pycache__

clean-build:
	rm -rf "${VENV}"
	rm -rf backend/dist
	rm -rf backend/peer_chat/client

clean: clean-frontend clean-backend clean-build
