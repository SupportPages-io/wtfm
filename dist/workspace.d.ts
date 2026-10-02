export declare class Workspace {
    root: string;
    private constructor();
    static create(root: string): Promise<Workspace>;
    private contains;
    resolve(relative: string): Promise<string>;
    read(relative: string, limit?: number): Promise<NonSharedBuffer>;
    json(relative: string): Promise<unknown>;
    exists(relative: string): Promise<boolean>;
    write(relative: string, data: string | Buffer): Promise<string>;
    writeJson(relative: string, data: unknown): Promise<string>;
    list(relative: string): Promise<import("fs").Dirent<string>[]>;
    lock<T>(fn: () => Promise<T>): Promise<T>;
}
