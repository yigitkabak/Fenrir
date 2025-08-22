import { execSync, spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class FenrirRuntime {
    private static instance: FenrirRuntime;
    private packageCache = new Map<string, any>();
    private runtimeCache = new Map<string, Function>();

    static getInstance(): FenrirRuntime {
        if (!FenrirRuntime.instance) {
            FenrirRuntime.instance = new FenrirRuntime();
        }
        return FenrirRuntime.instance;
    }

    log = (...args: any[]): void => {
        process.stdout.write(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n');
    }

    readFile = (filePath: string): string => {
        try {
            return fs.readFileSync(path.resolve(filePath), 'utf8');
        } catch (error) {
            throw new Error(`File cannot be read: ${filePath}`);
        }
    }

    writeFile = (filePath: string, content: string): void => {
        try {
            fs.writeFileSync(path.resolve(filePath), content, 'utf8');
        } catch (error) {
            throw new Error(`File could not be written: ${filePath}`);
        }
    }

    fetch = async (url: string, options?: any): Promise<any> => {
        const https = require('https');
        const http = require('http');
        
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            const req = client.get(url, (res: any) => {
                let data = '';
                res.on('data', (chunk: any) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(data);
                    }
                });
            });
            req.on('error', reject);
        });
    }

    require = (packageName: string): any => {
        if (this.packageCache.has(packageName)) {
            return this.packageCache.get(packageName);
        }

        try {
            const pkg = require(packageName);
            this.packageCache.set(packageName, pkg);
            return pkg;
        } catch (error) {
            throw new Error(`Package not found: ${packageName}. Install it with the command 'fenrir install ${packageName}'.`);
        }
    }

    exec = (command: string): string => {
        try {
            return execSync(command, { encoding: 'utf8' });
        } catch (error) {
            throw new Error(`Command could not be executed: ${command}`);
        }
    }

    now = (): number => Date.now()
    time = (): string => new Date().toISOString()
    sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
}

const fenrir = FenrirRuntime.getInstance();

Object.assign(globalThis, { 
    fenrir,
    log: fenrir.log,
    readFile: fenrir.readFile,
    writeFile: fenrir.writeFile,
    fetch: fenrir.fetch,
    exec: fenrir.exec,
    now: fenrir.now,
    sleep: fenrir.sleep
});

export { fenrir };
export default FenrirRuntime;