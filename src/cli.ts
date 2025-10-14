#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';

import { transformFenrirCode } from './transformer.js';
import { PackageManager } from './packageManager.js';
import { ArchiveSystem } from './archiveSystem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = process.argv[2];
const args = process.argv.slice(3);

const packageManager = new PackageManager();
const archiveSystem = new ArchiveSystem();

const executeCode = async (filePath: string) => {
    try {
        if (!await fs.pathExists(filePath)) {
            console.error(`Error: File ${filePath} not found.`);
            process.exit(1);
        }

        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        if (!fileContent.trim()) {
            console.error('Error: The file is empty or contains only space characters.');
            process.exit(1);
        }

        const aperiumConfig = fs.existsSync('fenrir.json') 
            ? JSON.parse(await fs.readFile('fenrir.json', 'utf8')) 
            : {};
            
        const jsCode = await transformFenrirCode(fileContent, filePath, aperiumConfig.imports || {});

        if (process.env.FENRIR_DEBUG) {
            console.log('\nConverted JavaScript code:');
            console.log(jsCode);
        }

        const tempDir = path.join(os.tmpdir(), `fenrir_temp_${Date.now()}`);
        await fs.ensureDir(tempDir);
        const tempFilePath = path.join(tempDir, 'runtime_output.mjs');
        
        // node_modules kopyalama işlemini iyileştir
        const originalNodeModulesPath = path.join(process.cwd(), 'node_modules');
        const tempNodeModulesPath = path.join(tempDir, 'node_modules');
        
        if (await fs.pathExists(originalNodeModulesPath)) {
            try {
                await fs.copy(originalNodeModulesPath, tempNodeModulesPath, {
                    dereference: true,
                    preserveTimestamps: false
                });
            } catch (copyError: any) {
                console.warn('Warning: Could not copy node_modules:', copyError?.message || copyError);
            }
        }

        const originalPackageJsonPath = path.join(process.cwd(), 'package.json');
        if (await fs.pathExists(originalPackageJsonPath)) {
            try {
                await fs.copy(originalPackageJsonPath, path.join(tempDir, 'package.json'));
            } catch (err: any) {
                console.warn('Warning: Could not copy package.json:', err?.message || err);
            }
        }

        const runtimePath = path.join(__dirname, 'runtime.js');
        let finalCode = jsCode;
        
        if (fs.existsSync(runtimePath)) {
            const runtimeCode = await fs.readFile(runtimePath, 'utf8');
            finalCode = `${runtimeCode}\n\n${jsCode}`;
        }
        
        await fs.writeFile(tempFilePath, finalCode);

        const env = { 
            ...process.env,
            NODE_PATH: [
                path.join(tempDir, 'node_modules'),
                path.join(process.cwd(), 'node_modules'),
                process.env.NODE_PATH
            ].filter(Boolean).join(path.delimiter)
        };

        if (process.env.FENRIR_DEBUG) {
            console.log('Temp directory:', tempDir);
            console.log('Original CWD:', process.cwd());
            console.log('NODE_PATH:', env.NODE_PATH);
            console.log('\nGenerated code:');
            console.log('================');
            console.log(finalCode);
            console.log('================\n');
        }

        const child = spawn('node', [tempFilePath], {
            stdio: 'inherit',
            shell: false,
            env: env,
            cwd: process.cwd()
        });

        child.on('close', async (code) => {
            try {
                await fs.remove(tempDir);
            } catch (err) {
            }
            process.exit(code || 0);
        });

        child.on('error', async (err: any) => {
            console.error('An error occurred while running Node.js:');
            
            if (err.message.includes('SyntaxError')) {
                console.error('Syntax error detected. Transformed code:');
                finalCode.split('\n').forEach((line: string, index: number) => {
                    console.error(`${(index + 1).toString().padStart(2, ' ')}: ${line}`);
                });
            } else {
                console.error(err);
            }
            
            try {
                await fs.remove(tempDir);
            } catch (cleanupErr) {
            }
            process.exit(1);
        });

    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error('Syntax error:', error.message);
        } else {
            console.error('An unexpected error occurred:', error);
        }
        process.exit(1);
    }
};

const showHelp = () => {
    console.log(`
Fenrir Programming Language v0.0.1

Usage:
  fenrir <file.fnr>
  fenrir install [package]
  fenrir remove <package> 
  fenrir archive [message]
  fenrir archives
  fenrir rollback [archive-id]
  fenrir clean [number]
  fenrir help
`);
};

const run = async () => {
    if (!command || command === 'help') {
        showHelp();
        return;
    }

    switch (command) {
        case 'install':
            await packageManager.install(args[0]);
            break;
            
        case 'remove':
            if (!args[0]) {
                console.error('Package name not specified.');
                console.log('Usage: fenrir remove <package-name>');
                process.exit(1);
            }
            await packageManager.remove(args[0]);
            break;
            
        case 'archive':
            await archiveSystem.createArchive(args[0]);
            break;
            
        case 'archives':
            await archiveSystem.listArchives();
            break;
            
        case 'rollback':
            await archiveSystem.rollback(args[0]);
            break;
            
        case 'clean':
            const keepCount = args[0] ? parseInt(args[0]) : 10;
            await archiveSystem.cleanArchives(keepCount);
            break;
            
        default:
            if (command.endsWith('.fnr')) {
                const filePath = path.resolve(process.cwd(), command);
                await executeCode(filePath);
            } else {
                console.error(`Unknown command: ${command}`);
                console.log('For help: fenrir help');
                process.exit(1);
            }
    }
};

run().catch((error) => {
    console.error('A critical error occurred while running the program:', error);
    process.exit(1);
});
