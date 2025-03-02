SHELL := /bin/bash
VENV := venv
SKIP_CLIENT =
VERSION =

_:
	echo "Missing target. See README for details."

venv:
	[ -d "${VENV}" ] || python3 -m venv venv

ifeq ($(SKIP_CLIENT), yes)
$(info skipping client!)
build-frontend:
else
build-frontend:
	cd frontend && \
		npm install && \
		GENERATE_SOURCEMAP=false npm run build
endif

build-backend:
	rm -rf backend/peer_chat/client
	cp -r frontend/build backend/peer_chat/client

build: venv build-frontend build-backend
	[ "${VERSION}" != "" ] && \
		VERSIONENV="VERSION=${VERSION}" || \
		echo "Using default version"
	source "${VENV}/bin/activate" && \
		pip install --upgrade pip wheel setuptools && \
		cd backend && \
		${VERSIONENV} python3 setup.py sdist bdist_wheel || \
		python3 setup.py sdist bdist_wheel

publish: venv
	source "${VENV}/bin/activate" && \
		pip install --upgrade pip twine && \
		cd backend && \
		python3 -m twine upload dist/*

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
