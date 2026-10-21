import { fail } from './errors.js';
import { z } from 'zod';
import { CLI_NAME } from './brand.js';
export const efforts = { claude: ['low', 'medium', 'high', 'xhigh', 'max'], codex: ['minimal', 'low', 'medium', 'high', 'xhigh'] };
export const modelValid = (value) => typeof value === 'string' && value.length <= 200 && /^[a-zA-Z0-9][a-zA-Z0-9._:/\[\]-]*$/.test(value);
export const settingsFile = (bridge) => `${bridge.stateRoot}/setup/settings.json`;
// Undefined means SupportPages.io defaults; null explicitly inherits the agent setting.
export function modelSettings(agent, saved = {}) {
    if (!efforts[agent])
        fail('invalid_agent', 'Choose Claude Code or Codex.');
    const values = z.object({ model: z.unknown().optional(), effort: z.unknown().optional() }).safeParse(saved);
    if (!values.success)
        fail('invalid_configuration', `Invalid coding-agent settings. Run ${CLI_NAME} configure to change them.`);
    const model = values.data.model === undefined ? (agent === 'claude' ? 'sonnet' : null) : values.data.model;
    const effort = values.data.effort === undefined ? (agent === 'claude' ? 'low' : null) : values.data.effort;
    if (model !== null && !modelValid(model) || effort !== null && (typeof effort !== 'string' || !efforts[agent].includes(effort))) {
        fail('invalid_configuration', `Invalid coding-agent model or effort. Run ${CLI_NAME} configure to change it.`);
    }
    return { model, effort };
}
export async function readAgentSettings(bridge) {
    const value = await bridge.ws.exists(settingsFile(bridge)) ? await bridge.ws.json(settingsFile(bridge)) : {};
    const result = z.object({
        models: z.record(z.string(), z.unknown()).optional(),
        agents: z.array(z.enum(['claude', 'codex'])).min(1).max(2).refine(agents => new Set(agents).size === agents.length).optional(),
    }).passthrough().safeParse(value);
    if (!result.success) {
        fail('invalid_configuration', 'The saved coding-agent settings are invalid.');
    }
    return result.data;
}
export async function executionSettings(bridge, agent) {
    return modelSettings(agent, (await readAgentSettings(bridge)).models?.[agent] ?? {});
}
//# sourceMappingURL=agent-settings.js.map