import { constants } from 'node:fs';
import { chmod, lstat, mkdir, open, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fail } from './errors.js';
import { CLI_NAME } from './brand.js';
/** Atomic replacement: the delivery is acknowledged only after this is durable. */
export async function saveTokenFile(filename, origin, token, account) {
    const directory = path.dirname(filename);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const info = await lstat(directory);
    if (!info.isDirectory() || (process.getuid && info.uid !== process.getuid()))
        fail('invalid_credentials_file', 'The credential directory must be owned by your user and cannot be a symlink.');
    await chmod(directory, 0o700);
    try {
        const existing = await lstat(filename);
        if (!existing.isFile() || (process.getuid && existing.uid !== process.getuid()))
            fail('invalid_credentials_file', 'Refusing to replace an unsafe credential file.');
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
    }
    const temporary = `${filename}.${randomUUID()}.tmp`;
    try {
        const file = await open(temporary, 'wx', 0o600);
        try {
            await file.writeFile(JSON.stringify({ version: 2, api_origin: origin, token, ...(account ? { account } : {}) }) + '\n');
            await file.sync();
        }
        finally {
            await file.close();
        }
        await rename(temporary, filename);
        const dir = await open(directory, constants.O_RDONLY);
        try {
            await dir.sync();
        }
        finally {
            await dir.close();
        }
    }
    finally {
        await rm(temporary, { force: true });
    }
}
/** Private credentials are origin-bound and never embedded in client config. Version 1 files (token only) are still readable. */
export async function readCredential(filename, origin) {
    if (!path.isAbsolute(filename))
        fail('invalid_credentials_file', 'The token file path must be absolute.');
    let file;
    try {
        file = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
    }
    catch {
        fail('invalid_credentials_file', `Cannot open the token file. Run ${CLI_NAME} login to sign in.`);
    }
    try {
        const info = await file.stat();
        if (!info.isFile() || info.size > 4096 || (info.mode & 0o077) !== 0 || (process.getuid && info.uid !== process.getuid())) {
            fail('invalid_credentials_file', 'The token file must be a private file owned by your user (permissions 600).');
        }
        const raw = await file.readFile('utf8');
        if (Buffer.byteLength(raw) > 4096)
            fail('invalid_credentials_file', 'The token file exceeds its size limit.');
        let value;
        try {
            value = JSON.parse(raw);
        }
        catch {
            fail('invalid_credentials_file', `The token file is invalid. Run ${CLI_NAME} login to sign in.`);
        }
        const data = value;
        if (!data || ![1, 2].includes(data.version) || data.api_origin !== origin || typeof data.token !== 'string' || !/^sp_local_[a-f0-9]{64}$/.test(data.token)) {
            fail('invalid_credentials_file', 'The token file does not contain a valid credential for this API origin.');
        }
        const account = data.account;
        const valid = account && typeof account.id === 'string' && /^[1-9][0-9]*$/.test(account.id) && typeof account.email === 'string' && account.email.length <= 320;
        return { token: data.token, ...(valid ? { account: { id: account.id, email: account.email } } : {}) };
    }
    finally {
        await file.close();
    }
}
export async function readTokenFile(filename, origin) {
    return (await readCredential(filename, origin)).token;
}
//# sourceMappingURL=credentials.js.map