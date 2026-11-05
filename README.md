# FormatExt for VS Code

Format any file with a command that reads stdin and writes stdout. Works with Format Document and `editor.formatOnSave`.

Formatters are set in Settings under FormatExt, each with the file endings to use it for. Comes with `clang-format` and `prettier` for the file types they support.

```json
"formatExt.formatters": {
  "shfmt --filename ${file}": ".sh,.bash"
}
```

`${file}` is the file's path. Formatters run in the file's directory. Clear the endings to turn a formatter off.

If another extension formats the same files, set `editor.defaultFormatter` to `1hue.format-ext`.

Formatting is off in Restricted Mode.

Formatter warnings and errors go to the FormatExt output. Add `--log-level debug` to Prettier to see which config it picks.
