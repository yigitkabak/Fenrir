import { compile } from "./compiler";
import { execSync } from "child_process";
import { unlinkSync, writeFileSync } from "fs";
import { log } from "./utils";
import { join } from "path";

export function run(inputPath: string): void {
    let tempTsPath;
    try {
        const tsCode = compile(inputPath);
        tempTsPath = join(__dirname, "../examples/main.temp.ts");
        writeFileSync(tempTsPath, tsCode);

        const output = execSync(`ts-node ${tempTsPath}`, { encoding: 'utf-8' });
        console.log(output);
    } catch (error) {
        log("Execution failed.");
        console.error(error);
        throw error;
    } finally {
        try {
            if (tempTsPath) {
                unlinkSync(tempTsPath);
            }
        } catch (cleanupError) {
            console.error("Failed to delete temporary file:", cleanupError);
        }
    }
}