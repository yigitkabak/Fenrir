import path from 'path';
import fs from 'fs';

export const transformFenrirCode = async (fenrirCode: string, filePath: string, aperiumImports: { [key: string]: string }): Promise<string> => {
    
    if (fenrirCode.includes('import ')) {
        throw new Error("Fenrir Error: The keyword 'import' cannot be used. Use 'declare' to identify modules.");
    }

    const lines = fenrirCode.split('\n');
    let jsOutput = '';
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
            jsOutput += line + '\n';
            i++;
            continue;
        }

        let transformedLine = trimmedLine;
        let isMultiLineStatement = false;

        if (trimmedLine.startsWith('fn ')) {
            transformedLine = transformedLine.replace(/^fn\s+/, 'function ');
        }
        else if (trimmedLine.startsWith('declare ')) {
            const importMatch = trimmedLine.match(/declare\s+(.*?)\s+from\s+['"](.*?)['"]/);
            if (importMatch) {
                const importName = importMatch[1];
                const modulePath = importMatch[2];
                
                if (isNpmModule(modulePath)) {
                    transformedLine = `import ${importName} from "${modulePath}";`;
                } else {
                    const resolvedPath = path.resolve(path.dirname(filePath), modulePath);
                    transformedLine = `import ${importName} from "file://${resolvedPath}";`;
                }
            }
        }

        transformedLine = transformedLine.replace(/\blog\(/g, 'console.log(');

        if (transformedLine.includes('(') && !transformedLine.includes(')')) {
            isMultiLineStatement = true;
            let fullStatement = transformedLine;
            let j = i + 1;
            let openParens = (transformedLine.match(/\(/g) || []).length;
            let closeParens = (transformedLine.match(/\)/g) || []).length;

            while (j < lines.length && openParens > closeParens) {
                const nextLine = lines[j];
                fullStatement += '\n' + nextLine;
                openParens += (nextLine.match(/\(/g) || []).length;
                closeParens += (nextLine.match(/\)/g) || []).length;
                j++;
            }

            const processedStatement = fullStatement.replace(/\blog\(/g, 'console.log(');
            
            if (shouldAddSemicolon(processedStatement.trim())) {
                jsOutput += processedStatement + ';\n';
            } else {
                jsOutput += processedStatement + '\n';
            }
            
            i = j;
            continue;
        }

        if (shouldAddSemicolon(transformedLine)) {
            transformedLine += ';';
        }
        
        jsOutput += transformedLine + '\n';
        i++;
    }

    return jsOutput;
};

function isNpmModule(modulePath: string): boolean {
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
        return false;
    }
    
    if (modulePath.startsWith('/')) {
        return false;
    }
    
    if (modulePath.match(/\.(js|mjs|ts|json)$/)) {
        return false;
    }
    
    return true;
}

function shouldAddSemicolon(line: string): boolean {
    const trimmed = line.trim();
    
    if (trimmed.endsWith(';')) return false;
    
    if (trimmed.endsWith('{') || 
        trimmed.endsWith('}') || 
        (trimmed.endsWith(')') && !hasAssignmentOrCall(trimmed))) {
        return false;
    }
    
    if (trimmed.startsWith('function ') ||
        trimmed.startsWith('if ') ||
        trimmed.startsWith('else') ||
        trimmed.startsWith('for ') ||
        trimmed.startsWith('while ') ||
        trimmed.startsWith('switch ') ||
        trimmed.startsWith('try') ||
        trimmed.startsWith('catch') ||
        trimmed.startsWith('finally') ||
        trimmed.startsWith('import ') ||
        trimmed.startsWith('export ') ||
        trimmed.match(/^}\s*else/)) {
        return false;
    }

    return (
        trimmed.includes('=') || 
        trimmed.includes('console.log') ||
        trimmed.includes('return ') ||
        trimmed.startsWith('const ') ||
        trimmed.startsWith('let ') ||
        trimmed.startsWith('var ') ||
        /^[a-zA-Z_$][a-zA-Z0-9_$.]*\s*\(/.test(trimmed) ||
        Boolean(trimmed.match(/^\w+\s*\+\+/)) ||
        Boolean(trimmed.match(/^\w+\s*--/)) ||
        Boolean(trimmed.match(/^\w+\s*[+\-*/]=/))
    );
}

function hasAssignmentOrCall(line: string): boolean {
    const trimmedLine = line.trim();
    return trimmedLine.includes('=') || 
           trimmedLine.includes('console.log') || 
           trimmedLine.includes('return ') ||
           /^[a-zA-Z_$][a-zA-Z0-9_$.]*\s*\(/.test(trimmedLine);
}