SHELL := /bin/bash
VENV := venv
SKIP_CLIENT =
VERSION =
INSTALLLOCATION := ${HOME}/.local/share/
INSTALLNAME := peerChat
INSTALLPATH = ${INSTALLLOCATION}${INSTALLNAME}
SERVICE_FILE = ${HOME}/.config/systemd/user/peerChat.service

define SERVICE_STARTSH
#!/bin/bash

cd "$$(dirname "$$0")" \
  && source venv/bin/activate \
  && peerChat
endef
export SERVICE_STARTSH

define SERVICE
[Unit]
Description=peerChat-service

[Service]
Type=simple
ExecStartPre=/bin/sleep 0.5
ExecStart=${INSTALLPATH}/start.sh
Restart=always

[Install]
WantedBy=default.target
endef
export SERVICE

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

service:
	# prepare target directory
	if [ -d "${INSTALLPATH}" ]; then \
		echo "destination '${INSTALLPATH}' already exists"; \
		exit 1; \
	fi
	mkdir -p "${INSTALLPATH}"

	# install peerChat in venv
	cd "${INSTALLPATH}" && \
		python3 -m venv venv && \
		source venv/bin/activate && \
		pip install peerChat

	# add startup-script
	echo "$${SERVICE_STARTSH}" > "${INSTALLPATH}/start.sh" && \
		chmod +x "${INSTALLPATH}/start.sh"

	# add service-file
	mkdir -p "${HOME}/.config/systemd/user/"
	if [ -f "${SERVICE_FILE}" ]; then \
		echo "service file '${SERVICE_FILE}' already exists"; \
		exit 1; \
	fi
	echo "$${SERVICE}" > "${SERVICE_FILE}"

	# enable/start service
	systemctl --user enable peerChat.service
	systemctl --user start peerChat.service
