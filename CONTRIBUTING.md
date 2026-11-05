# Development

Needs podman only. `make` runs on host machine, actual work happens inside a container (node).

```sh
make setup # then F5 in VS Code
```

Or without F5:

```sh
make install # build and install into codium
make install VSCODE=code # or regular VS Code
make build # build/*.vsix only
```

Other commands:

```sh
make format # Prettier
make audit # fix vulnerable deps
```
