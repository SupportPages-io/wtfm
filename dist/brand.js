// The command users type and read; `supportpages` remains an installed alias.
// Persisted integration names (MCP server `supportpages`, `supportpages_*`
// tools, config directories, SUPPORTPAGES_* variables) are deliberately not
// derived from this. Mirrors scripts/lib/brand.mjs; a test keeps them equal.
export const CLI_NAME = 'wtfm';
export const LEGACY_CLI_NAME = 'supportpages';
export const INSTALL_COMMAND = 'curl -fsSL https://wtfm.sh/install | bash';
export const LANDING_URL = 'https://supportpages.io/wtfm';
//# sourceMappingURL=brand.js.map