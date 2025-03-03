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
        // Meme word replacements
        else if (token === "yeet") {
            tsCode += "throw ";
            i++;
        }
        else if (token === "sus") {
            tsCode += "console.log('⟁_⟁');\nif (";
            i++;
        }
        else if (token === "notsus") {
            tsCode += ") {\nconsole.log('✓');\n";
            i++;
        }
        else if (token === "doggo") {
            tsCode += "fetch";
            i++;
        }
        else if (token === "stonks") {
            tsCode += "Math.max";
            i++;
        }
        else if (token === "notStonks") {
            tsCode += "Math.min";
            i++;
        }
        else if (token === "smol") {
            tsCode += "toLowerCase";
            i++;
        }
        else if (token === "chonky") {
            tsCode += "toUpperCase";
            i++;
        }
        else if (token === "bamboozle") {
            tsCode += "Math.random";
            i++;
        }
        else if (token === "yolo") {
            tsCode += "try {\n";
            i++;
        }
        else if (token === "fail") {
            tsCode += "} catch (error) {\n";
            i++;
        }
        else if (token === "bonk") {
            tsCode += "Array.prototype.push.apply";
            i++;
        }
        else if (token === "karen") {
            tsCode += "new Error";
            i++;
        }
        else if (token === "poggers") {
            tsCode += "Promise.resolve";
            i++;
        }
        else if (token === "bruh") {
            tsCode += "Promise.reject";
            i++;
        }
        else if (token === "oof") {
            tsCode += "break";
            i++;
        }
        else if (token === "holup") {
            tsCode += "await ";
            i++;
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