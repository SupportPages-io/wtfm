#!/usr/bin/env node
// `wtfm mcp [options]` (or the `supportpages` alias) runs the stdio MCP server, so MCP clients and
// registries can launch it through the package's single command (npx).
if (process.argv[2] === 'mcp') {
  const server = new URL('../dist/index.js', import.meta.url);
  process.argv.splice(1, 2, (await import('node:url')).fileURLToPath(server));
  await import(server.href);
} else await import('./lib/cli-main.mjs');
