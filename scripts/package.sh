#!/bin/sh
# Build .vsix into build/ - run by make build and release workflow
set -eu

# Build in copy - keeps node_modules out of project
project=$(pwd)
cp -a . /tmp/src
cd /tmp/src

npm ci
npm run package

mkdir -p "$project/build"
cp build/*.vsix "$project/build/"
