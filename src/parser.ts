import { log } from "./utils";

function tokenize(fenrirCode: string): string[] {
    const lines = fenrirCode.split("\n");
    const tokens: string[] = [];

    for (const line of lines) {
        const words = line.split(/\s+/);
        tokens.push(...words.filter((word) => word.trim() !== ""));
    }

    return tokens;
}

function parseTokens(tokens: string[]): string {
    let tsCode = "";
    let i = 0;

    while (i < tokens.length) {
        const token = tokens[i];

        if (token === "fn") {
            tsCode += "function ";
            i++;
        }
        else if (token === "->") {
            tsCode += ":";
            i++;
        }
        else if (token === ":=") {
            tsCode += "=";
            i++;
        }
        else if (token === "num") {
            tsCode += "number";
            i++;
        }
        else if (token === "str") {
            tsCode += "string";
            i++;
        }
        else if (token === "let") {
            tsCode += "let ";
            i++;
        }
        else if (token === "as" && tokens[i + 1] === "str") {
            tsCode += "as string";
            i += 2;
        }
        else if (token === "use") {
            const importTokens = [];
            i++;

            while (i < tokens.length && tokens[i] !== "from") {
                importTokens.push(tokens[i]);
                i++;
            }

            if (tokens[i] === "from") {
                i++;
                const modulePath = tokens[i].replace(/["']/g, "");
                tsCode += `import { ${importTokens.join(" ")} } from '${modulePath}';\n`;
                i++;
            }
        }
        else {
            tsCode += token + " ";
            i++;
        }
    }

    return tsCode;
}

export function parse(fenrirCode: string): string {
    const tokens = tokenize(fenrirCode);
    const tsCode = parseTokens(tokens);

    if (!tsCode.includes("main();")) {
        return tsCode + "\nmain();";
    }

    return tsCode;
}