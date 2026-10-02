import { spawn } from 'node:child_process';
/** Only the managed versions/<release>/mcp layout can update itself. */
export declare function installationRoot(installRoot: string): string | undefined;
export declare function autoUpdateEnabled(env: NodeJS.ProcessEnv): boolean;
/** Keep this session's engine on the same immutable release as its JS modules.
 * Older installers registered the bundled skills by an absolute version path,
 * first as mcp/skills and now as mcp/engine; both map to this release's engine.
 * External engine checkouts remain exactly the user's choice.
 */
export declare function pinSkills(installRoot: string, skillsDir: string): Promise<string>;
/** No inherited protocol streams, no waiting, and no prompts in an agent session. */
export declare function startBackgroundUpdate(installRoot: string, env?: NodeJS.ProcessEnv, spawnProcess?: typeof spawn): void;
