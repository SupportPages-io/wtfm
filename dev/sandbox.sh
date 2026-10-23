#!/usr/bin/env bash
# A throwaway "new user" for trying this checkout's WTFM in Claude Code and Codex
# without touching your own setup. Everything lives under one folder with its
# own HOME: Claude Code and Codex settings, the WTFM install and its config,
# and a small demo app. Telemetry is off, so sandbox runs are not counted.
#
#   dev/sandbox.sh create [DIR]   new sandbox (default ~/wtfm-sandbox), then opens its shell
#   dev/sandbox.sh shell [DIR]    open a shell inside an existing sandbox
#   dev/sandbox.sh rebuild [DIR]  reinstall this checkout after code changes
#
# Inside the shell, try either install route (or both):
#   Standalone: wtfm setup             (as after curl … | bash)
#   Plugin:     codex plugin marketplace add "$WTFM_SANDBOX/marketplace"
#               codex plugin add wtfm@wtfm-local
# Sign in to each agent once in the sandbox (codex login, or /login in claude).
# Your own Codex sign-in is never copied: Codex rotates its tokens, so a shared
# copy would sign one of them out. Delete the folder to start over.
set -euo pipefail

checkout="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
command="${1:-}"
sandbox="${2:-$HOME/wtfm-sandbox}"
home="$sandbox/home"

usage() { sed -n '2,19p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

# The agents' real binaries, resolved before HOME changes.
real_bin() { local found; found="$(command -v "$1" 2>/dev/null)" || return 0; python3 -c 'import os,sys;print(os.path.realpath(sys.argv[1]))' "$found"; }

in_sandbox() {
  env -u CODEX_HOME -u CLAUDE_CONFIG_DIR -u XDG_CONFIG_HOME -u XDG_DATA_HOME -u SUPPORTPAGES_API_URL -u RTFM_SKILLS_DIR \
    HOME="$home" ZDOTDIR="$home" WTFM_SANDBOX="$sandbox" SUPPORTPAGES_TELEMETRY=0 \
    PATH="$home/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" "$@"
}

install_build() {
  echo "Installing this checkout's WTFM into the sandbox…"
  (cd "$checkout" && npm run build >/dev/null)
  in_sandbox bash "$checkout/install-cli.sh" --yes >/dev/null
  echo "Building the Codex plugin marketplace…"
  rm -rf "$sandbox/marketplace"
  mkdir -p "$sandbox/marketplace/.agents/plugins"
  node "$checkout/scripts/build-plugin.mjs" --out "$sandbox/marketplace/wtfm" --target codex >/dev/null
  cat > "$sandbox/marketplace/.agents/plugins/marketplace.json" <<'JSON'
{
  "name": "wtfm-local",
  "interface": { "displayName": "WTFM local build" },
  "plugins": [
    { "name": "wtfm", "source": { "source": "local", "path": "./wtfm" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" }, "category": "Developer Tools" }
  ]
}
JSON
}

create() {
  if [ -e "$sandbox" ]; then echo "$sandbox already exists. Use: dev/sandbox.sh shell, or delete it first." >&2; exit 1; fi
  mkdir -p "$home/.local/bin"
  for agent in claude codex; do
    target="$(real_bin "$agent")"
    [ -n "$target" ] && ln -s "$target" "$home/.local/bin/$agent"
  done
  printf '[user]\n\tname = %s\n\temail = %s\n' "$(git config user.name || echo 'WTFM Sandbox')" "$(git config user.email || echo 'sandbox@example.com')" > "$home/.gitconfig"
  cat > "$home/.zshrc" <<'ZSH'
PROMPT='%F{magenta}[wtfm-sandbox]%f %~ %# '
cd "$HOME/demo-app" 2>/dev/null
ZSH
  demo_app
  install_build
  echo
  echo "Sandbox ready: $sandbox"
}

# A small app with a few pages, so there is something to document.
demo_app() {
  local app="$home/demo-app"
  mkdir -p "$app"
  cat > "$app/package.json" <<'JSON'
{ "name": "taskboard", "private": true, "scripts": { "start": "node server.js" } }
JSON
  cat > "$app/server.js" <<'JS'
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const pages = { '/': 'index.html', '/tasks': 'tasks.html', '/settings': 'settings.html' };
http.createServer((req, res) => {
  const file = pages[req.url] ?? (req.url === '/styles.css' ? 'styles.css' : null);
  if (!file) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : 'text/html' });
  fs.createReadStream(path.join(__dirname, 'public', file)).pipe(res);
}).listen(3000, () => console.log('Taskboard on http://localhost:3000'));
JS
  mkdir -p "$app/public"
  local nav='<nav><a href="/">Home</a> <a href="/tasks">Tasks</a> <a href="/settings">Settings</a></nav>'
  cat > "$app/public/index.html" <<HTML
<!doctype html><html><head><title>Taskboard</title><link rel="stylesheet" href="/styles.css"></head>
<body>$nav<main><h1>Taskboard</h1><p>Plan your week and track what is done.</p><a class="button" href="/tasks">Open your tasks</a></main></body></html>
HTML
  cat > "$app/public/tasks.html" <<HTML
<!doctype html><html><head><title>Tasks · Taskboard</title><link rel="stylesheet" href="/styles.css"></head>
<body>$nav<main><h1>Tasks</h1>
<form><input name="title" placeholder="What needs doing?"><button class="button">Add task</button></form>
<ul class="tasks"><li><input type="checkbox"> Write the launch post</li><li><input type="checkbox" checked> Book the venue</li></ul></main></body></html>
HTML
  cat > "$app/public/settings.html" <<HTML
<!doctype html><html><head><title>Settings · Taskboard</title><link rel="stylesheet" href="/styles.css"></head>
<body>$nav<main><h1>Settings</h1>
<label>Display name <input value="Sam"></label>
<label><input type="checkbox" checked> Email me a weekly summary</label>
<button class="button">Save settings</button></main></body></html>
HTML
  cat > "$app/public/styles.css" <<'CSS'
body { font-family: system-ui, sans-serif; margin: 0; color: #1f2933; background: #f7f7fb; }
nav { display: flex; gap: 1rem; padding: 1rem 2rem; background: #4338ca; }
nav a { color: white; text-decoration: none; }
main { max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
.button { background: #4338ca; color: white; border: 0; border-radius: 6px; padding: .5rem 1rem; text-decoration: none; }
.tasks { list-style: none; padding: 0; } label { display: block; margin: 1rem 0; }
CSS
  (cd "$app" && in_sandbox git init -q && in_sandbox git add -A && in_sandbox git commit -qm "Initial Taskboard app")
}

case "$command" in
  create) create; in_sandbox zsh -i ;;
  shell) [ -d "$home" ] || { echo "No sandbox at $sandbox. Run: dev/sandbox.sh create" >&2; exit 1; }; in_sandbox zsh -i ;;
  rebuild) [ -d "$home" ] || { echo "No sandbox at $sandbox. Run: dev/sandbox.sh create" >&2; exit 1; }; install_build
    echo "Reinstalled. Start new agent sessions to load it; for the plugin, run: codex plugin add wtfm@wtfm-local" ;;
  -h|--help|help) usage ;;
  *) usage 1 ;;
esac
