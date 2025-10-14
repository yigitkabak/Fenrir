import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { glob } from 'glob';

export class ArchiveSystem {
    private projectRoot: string;
    private archiveDir: string;

    constructor(projectRoot: string = process.cwd()) {
        this.projectRoot = projectRoot;
        this.archiveDir = path.join(projectRoot, '.fenrir', 'archives');
    }

    async createArchive(message?: string): Promise<string> {
        const now = new Date();
        const timestamp = this.formatTimestamp(now);
        const archivePath = path.join(this.archiveDir, timestamp);

        await fs.ensureDir(archivePath);

        const filesToArchive = await this.getFilesToArchive();
        
        for (const file of filesToArchive) {
            const srcPath = path.join(this.projectRoot, file);
            const destPath = path.join(archivePath, file);
            
            await fs.ensureDir(path.dirname(destPath));
            await fs.copy(srcPath, destPath);
        }

        const metadata = {
            timestamp: now.toISOString(),
            message: message || 'Automatic archiving',
            files: filesToArchive.length,
            hash: this.generateHash(filesToArchive),
            gitHash: await this.getGitHash().catch(() => null)
        };

        await fs.writeJSON(path.join(archivePath, '.metadata.json'), metadata, { spaces: 2 });
        
        console.log(`Archive created: ${timestamp}`);
        console.log(` ${filesToArchive.length}  file archived`);
        console.log(`message: ${metadata.message}`);
        
        return timestamp;
    }

    async listArchives(): Promise<void> {
        if (!fs.existsSync(this.archiveDir)) {
            console.log('No archives have been created yet.');
            return;
        }

        const archives = await fs.readdir(this.archiveDir);
        archives.sort().reverse();

        console.log('Archive history:');
        
        for (const archive of archives.slice(0, 10)) {
            const metadataPath = path.join(this.archiveDir, archive, '.metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                const metadata = await fs.readJSON(metadataPath);
                const date = new Date(metadata.timestamp);
                
                console.log(` ${archive} - ${metadata.message}`);
                console.log(` ${date.toLocaleString('en-US')}`);
                console.log(` ${metadata.files} file`);
                console.log('');
            }
        }

        if (archives.length > 10) {
            console.log(`   ... and ${archives.length - 10} archive more`);
        }
    }

    async rollback(archiveId?: string): Promise<void> {
        if (!fs.existsSync(this.archiveDir)) {
            console.log('Archive not found.');
            return;
        }

        let targetArchive = archiveId;
        
        if (!targetArchive) {
            const archives = await fs.readdir(this.archiveDir);
            archives.sort().reverse();
            targetArchive = archives[0];
        }

        const archivePath = path.join(this.archiveDir, targetArchive);
        
        if (!fs.existsSync(archivePath)) {
            console.log(`Archive not found: ${targetArchive}`);
            return;
        }

        console.log('Current status is being backed up...');
        await this.createArchive(`Pre-rollback backup - ${new Date().toISOString()}`);

        const metadataPath = path.join(archivePath, '.metadata.json');
        const metadata = await fs.readJSON(metadataPath);
        
        console.log(`${targetArchive} returning to archive...`);
        console.log(` ${metadata.message}`);

        const currentFiles = await this.getFilesToArchive();
        for (const file of currentFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                await fs.remove(filePath);
            }
        }

        const archiveFiles = await glob('**/*', { 
            cwd: archivePath, 
            nodir: true,
            ignore: '.metadata.json'
        });

        for (const file of archiveFiles) {
            const srcPath = path.join(archivePath, file);
            const destPath = path.join(this.projectRoot, file);
            
            await fs.ensureDir(path.dirname(destPath));
            await fs.copy(srcPath, destPath);
        }

        console.log(`The return has been completed!`);
        console.log(`${archiveFiles.length} file restored`);
    }

    async cleanArchives(keepCount: number = 10): Promise<void> {
        if (!fs.existsSync(this.archiveDir)) {
            return;
        }

        const archives = await fs.readdir(this.archiveDir);
        archives.sort().reverse();

        if (archives.length <= keepCount) {
            console.log(`${archives.length} There is an archive, no cleaning is necessary.`);
            return;
        }

        const toDelete = archives.slice(keepCount);
        
        for (const archive of toDelete) {
            await fs.remove(path.join(this.archiveDir, archive));
        }

        console.log(`${toDelete.length} The old archive has been cleared.`);
        console.log(`${keepCount} The archive has been preserved.`);
    }

    private formatTimestamp(date: Date): string {
        return date.toISOString()
            .replace(/T/, '_')
            .replace(/:/g, '-')
            .substring(0, 19);
    }

    private async getFilesToArchive(): Promise<string[]> {
        const patterns = [
            '**/*.py', 
            '**/*.pyc', 
            '**/*.pyo',
            '**/*.java', 
            '**/*.class', 
            '**/*.jar',
            '**/*.cpp', 
            '**/*.cxx', 
            '**/*.cc', 
            '**/*.c', 
            '**/*.hpp', 
            '**/*.h', 
            '**/*.hxx',
            '**/*.cs', 
            '**/*.csproj', 
            '**/*.sln',
            '**/*.rb', 
            '**/*.rake',
            '**/*.php', 
            '**/*.phtml', 
            '**/*.php3', 
            '**/*.php4', 
            '**/*.php5',
            '**/*.swift',
            '**/*.go',
            '**/*.rs',
            '**/*.js', 
            '**/*.ts', 
            '**/*.jsx', 
            '**/*.tsx', 
            '**/*.mjs', 
            '**/*.cjs',
            '**/*.css', 
            '**/*.scss', 
            '**/*.sass', 
            '**/*.less',
            '**/*.html', 
            '**/*.htm', 
            '**/*.xhtml',
            '**/*.json',
            '**/*.xml',
            '**/*.yml', 
            '**/*.yaml',
            '**/*.md', 
            '**/*.markdown', 
            '**/*.mdown',
            '**/*.txt',
            '**/*.ini', 
            '**/*.conf', 
            '**/*.cfg',
            '**/*.sh', 
            '**/*.bash',
            '**/*.npm', 
            '**/*.lock',
            '**/*.fnr',
            '**/Makefile'
        ];

        const ignorePatterns = [
            '.fenrir/**',
            'node_modules/**',
            '.git/**',
            '*.log',
            '.DS_Store',
            'Thumbs.db',
            '.env*',
            'dist/**',
            'build/**',
            '.cache/**'
        ];

        const files: string[] = [];
        
        for (const pattern of patterns) {
            const matches = await glob(pattern, {
                cwd: this.projectRoot,
                ignore: ignorePatterns,
                nodir: true
            });
            files.push(...matches);
        }

        return [...new Set(files)].sort();
    }

    private generateHash(files: string[]): string {
        const hash = crypto.createHash('md5');
        hash.update(files.join('|'));
        return hash.digest('hex').substring(0, 8);
    }

    private async getGitHash(): Promise<string> {
        return execSync('git rev-parse HEAD', { 
            cwd: this.projectRoot,
            encoding: 'utf8' 
        }).trim();
    }
}
