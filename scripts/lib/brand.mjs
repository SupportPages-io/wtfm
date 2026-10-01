// The command users type and read. `supportpages` stays installed as an alias,
// and every persisted integration name (MCP server, tools, config and data
// directories, SUPPORTPAGES_* variables) keeps its supportpages spelling.
// Kept dependency-free: the source bootstrap loads it before dist/ exists.
// Mirrored in src/brand.ts for the MCP server; a test keeps them equal.
export const CLI_NAME = 'wtfm';
export const LEGACY_CLI_NAME = 'supportpages';
export const INSTALL_COMMAND = 'curl -fsSL https://wtfm.sh/install | bash';
export const LANDING_URL = 'https://supportpages.io/wtfm';
