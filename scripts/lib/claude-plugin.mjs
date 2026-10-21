import path from 'node:path';
import { readFile } from 'node:fs/promises';

export const PLUGIN_NAME = 'wtfm';
// The plugin's earlier name; installs made under it keep it until reinstalled.
const PLUGIN_NAMES = [PLUGIN_NAME, 'supportpages-writer'];

/** True when Claude Code has the WTFM plugin installed (any
 * marketplace, any scope). The plugin brings its own MCP server and writer
 * agent, so a separate registration would show every tool twice. */
export async function claudePluginInstalled({ home, env = {} }) {
  const file = path.join(env.CLAUDE_CONFIG_DIR || path.join(home, '.claude'), 'plugins', 'installed_plugins.json');
  try {
    const plugins = JSON.parse(await readFile(file, 'utf8')).plugins ?? {};
    return Object.entries(plugins).some(([id, installs]) => PLUGIN_NAMES.includes(id.split('@')[0]) && Array.isArray(installs) && installs.length > 0);
  } catch { return false; }
}
