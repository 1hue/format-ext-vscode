# Format Ext

Format any language with a command that reads stdin and writes stdout, like `clang-format`. Works with Format Document and `editor.formatOnSave`.

```json
"formatExt.formatters": [
  {
    "command": "clang-format",
    "args": ["--assume-filename=${file}"],
    "languages": ["glsl", "gdshader"]
  }
]
```

Commands run in the file's directory. `${file}` in args is replaced with the document path.

If another extension formats the same language, set `editor.defaultFormatter` to `1hue.format-ext`.

Workspace formatters are ignored in Restricted Mode.
