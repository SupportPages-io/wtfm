import { lstat, mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
const devicePreferencesFile = (configDir) => path.join(configDir, 'preferences.json');
export async function devicePreferences(configDir) {
    try {
        const value = JSON.parse(await readFile(devicePreferencesFile(configDir), 'utf8'));
        return value && typeof value === 'object' && value.version === 1 ? value : {};
    }
    catch {
        return {};
    }
}
/** Atomic private write, like the credentials beside it. */
export async function saveDevicePreferences(configDir, changes) {
    const file = devicePreferencesFile(configDir);
    const value = { ...await devicePreferences(configDir), ...changes, version: 1 };
    await mkdir(configDir, { recursive: true, mode: 0o700 });
    try {
        if ((await lstat(file)).isSymbolicLink())
            throw new Error(`Refusing to write through a symlink: ${file}`);
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
    }
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
        const handle = await open(temporary, 'wx', 0o600);
        try {
            await handle.writeFile(JSON.stringify(value, null, 2) + '\n');
            await handle.sync();
        }
        finally {
            await handle.close();
        }
        await rename(temporary, file);
    }
    finally {
        await rm(temporary, { force: true });
    }
    return value;
}
//# sourceMappingURL=preferences.js.map