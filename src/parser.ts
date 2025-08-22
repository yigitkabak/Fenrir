interface Token {
  type: string;
  value: string;
}

interface ASTNode {
  type: string;
  value?: any;
  children?: ASTNode[];
}

export const parse = (code: string): ASTNode => {
  const tokens: Token[] = [];
  const lines = code.split('\n');

  for (const line of lines) {
    if (line.trim().startsWith('fn')) {
      tokens.push({ type: 'FN_DECL', value: line.trim() });
    } else if (line.trim().startsWith('import')) {
      tokens.push({ type: 'IMPORT_DECL', value: line.trim() });
    } else {
      tokens.push({ type: 'EXPRESSION', value: line.trim() });
    }
  }

  const ast: ASTNode = {
    type: 'Program',
    children: tokens.map(token => ({
      type: token.type,
      value: token.value
    }))
  };

  return ast;
};