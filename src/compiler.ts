import { readFileSync } from "fs";

export function compile(inputPath: string): string {
    const fenrirCode = readFileSync(inputPath, "utf-8");

    let tsCode = fenrirCode
        .replace(/fn\s+/g, "function ")
        .replace(/->/g, ":")
        .replace(/:=/g, "=")
        .replace(/num/g, "number")
        .replace(/str/g, "string")
        .replace(/use\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']/g, "import { $1 } from '$2';");

    if (!tsCode.includes("main();")) {
        tsCode += "\nmain();";
    }

    return tsCode;
}