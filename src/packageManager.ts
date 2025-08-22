import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export class PackageManager {
    private projectRoot: string;
    private packageJsonPath: string;
    private fenrirJsonPath: string;

    constructor(projectRoot: string = process.cwd()) {
        this.projectRoot = projectRoot;
        this.packageJsonPath = path.join(projectRoot, 'package.json');
        this.fenrirJsonPath = path.join(projectRoot, 'fenrir.json');
    }

    async install(packageName?: string): Promise<void> {
        if (!fs.existsSync(this.fenrirJsonPath)) {
            await this.initProject();
        }

        if (packageName) {
            console.log(`${packageName} loading...`);
            
            try {
                execSync(`npm install ${packageName}`, { 
                    cwd: this.projectRoot,
                    stdio: 'pipe'
                });

                await this.updateFenrirJson(packageName);
                
                console.log(`${packageName} Successfully loaded!`);
            } catch (error) {
                console.error(`${packageName} An error occurred while loading:`, error);
                throw error;
            }
        } else {
            console.log('All dependencies are being loaded...');
            execSync('npm install', { 
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
        }
    }

    async remove(packageName: string): Promise<void> {
        console.log(` ${packageName} being removed...`);
        
        try {
            execSync(`npm uninstall ${packageName}`, { 
                cwd: this.projectRoot,
                stdio: 'pipe'
            });

            await this.removeFomFenrirJson(packageName);
            
            console.log(`${packageName} removed!`);
        } catch (error) {
            console.error(`${packageName} An error occurred while removing:`, error);
        }
    }
    
    private async initProject(): Promise<void> {
        const projectName = path.basename(this.projectRoot);
        
        const fenrirJson = {
            name: projectName,
            version: "0.0.1",
            description: "A Fenrir project",
            dependencies: {},
            fenrirVersion: "0.0.1"
        };

        await fs.writeJSON(this.fenrirJsonPath, fenrirJson, { spaces: 2 });
        
        if (!fs.existsSync(this.packageJsonPath)) {
            const packageJson = {
                name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                version: "0.0.1",
                type: "module",
                dependencies: {}
            };
            await fs.writeJSON(this.packageJsonPath, packageJson, { spaces: 2 });
        }

        console.log('The Fenrir project has been launched!');
    }

    private async readFenrirJson(): Promise<any> {
        if (!fs.existsSync(this.fenrirJsonPath)) {
            return { dependencies: {} };
        }
        return await fs.readJSON(this.fenrirJsonPath);
    }

    private async updateFenrirJson(packageName: string): Promise<void> {
        const fenrirJson = await this.readFenrirJson();
        
        const packageJson = await fs.readJSON(this.packageJsonPath);
        const version = packageJson.dependencies?.[packageName] || 'latest';
        
        if (!fenrirJson.dependencies) {
            fenrirJson.dependencies = {};
        }
        
        fenrirJson.dependencies[packageName] = version;
        
        await fs.writeJSON(this.fenrirJsonPath, fenrirJson, { spaces: 2 });
    }

    private async removeFomFenrirJson(packageName: string): Promise<void> {
        const fenrirJson = await this.readFenrirJson();
        
        if (fenrirJson.dependencies && fenrirJson.dependencies[packageName]) {
            delete fenrirJson.dependencies[packageName];
            await fs.writeJSON(this.fenrirJsonPath, fenrirJson, { spaces: 2 });
        }
    }
}