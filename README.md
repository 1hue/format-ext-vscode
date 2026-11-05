# FormatExt for VS Code

Any custom formatter for any filetype. Lean.

Set your paths and target extensions in Settings.

```json
"formatExt.formatters": {
  "prettier --stdin-filepath ${file}": ".js,.ts"
}
```

Also recommended:

```json
{
  "editor.formatOnSave": true
}
```

Ensure `editor.defaultFormatter` is set to `1hue.format-ext`.

Formatting is off in Restricted Mode.

For logs and errors check the VS Code's Output panel (FormatExt).
