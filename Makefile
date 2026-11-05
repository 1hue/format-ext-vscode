# Development commands in containers
.PHONY: build install compile format audit setup sh clean clean-npm

# Colors when run in terminal
TTY := $(shell [ -t 0 ] && echo -t)
RUN = podman run --rm -i $(TTY) -e TERM --userns=keep-id -e HOME=/tmp
# No network
RUN_OFFLINE = $(RUN) --network=none
# Images with project mount
NODE_IMAGE = docker.io/library/node:latest
NODE = -v .:/app:z -w /app $(NODE_IMAGE)

# VS Code CLI
VSCODE ?= codium

build:
	$(RUN) --pull=newer $(NODE) sh scripts/package.sh

install: build
	$(VSCODE) --install-extension build/format-ext-*.vsix --force

compile: node_modules/.package-lock.json
	$(RUN_OFFLINE) $(NODE) npm run compile

# Format TS, JSON and YAML
format: node_modules/.package-lock.json
	$(RUN_OFFLINE) $(NODE) node_modules/.bin/prettier --write .

# Fix vulnerable deps
audit: node_modules/.package-lock.json
	$(RUN) $(NODE) npm audit fix --audit-level=moderate

# Update image, install deps and audit
setup:
	podman pull $(NODE_IMAGE)
	$(RUN) $(NODE) npm ci
	$(RUN) $(NODE) npm audit --audit-level=moderate

# Install deps when lockfile changes
node_modules/.package-lock.json: package-lock.json
	$(MAKE) setup

# Shell into container with Debian colours
sh:
	$(RUN) $(NODE) bash --rcfile /etc/skel/.bashrc

clean:
	rm -rf out build/*.vsix

clean-npm: clean
	rm -rf node_modules
