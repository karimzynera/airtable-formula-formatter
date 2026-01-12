/**
 * Airtable Formula Formatter
 * Formats Airtable formulas with proper indentation and line breaks
 */

type TokenType = 
  | 'function'
  | 'field'
  | 'string'
  | 'number'
  | 'operator'
  | 'comma'
  | 'paren-open'
  | 'paren-close'
  | 'whitespace'
  | 'unknown';

interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

/**
 * Tokenizes an Airtable formula string
 */
function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = formula.length;

  while (i < len) {
    const start = i;
    const char = formula[i];

    // Skip whitespace (we'll handle it separately if needed)
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Field references: {Field Name}
    if (char === '{') {
      let value = char;
      i++;
      while (i < len && formula[i] !== '}') {
        value += formula[i];
        i++;
      }
      if (i < len) {
        value += formula[i]; // include the closing }
        i++;
      }
      tokens.push({ type: 'field', value, start, end: i });
      continue;
    }

    // String literals: "text" or 'text'
    if (char === '"' || char === "'") {
      const quote = char;
      let value = char;
      i++;
      let escaped = false;
      while (i < len) {
        if (escaped) {
          value += formula[i];
          i++;
          escaped = false;
        } else if (formula[i] === '\\') {
          value += formula[i];
          i++;
          escaped = true;
        } else if (formula[i] === quote) {
          value += formula[i];
          i++;
          break;
        } else {
          value += formula[i];
          i++;
        }
      }
      tokens.push({ type: 'string', value, start, end: i });
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let value = char;
      i++;
      while (i < len && (/\d/.test(formula[i]) || formula[i] === '.')) {
        value += formula[i];
        i++;
      }
      tokens.push({ type: 'number', value, start, end: i });
      continue;
    }

    // Operators
    if (/[+\-*/&]/.test(char)) {
      tokens.push({ type: 'operator', value: char, start, end: i + 1 });
      i++;
      continue;
    }

    // Comparison operators: =, !=, >, <, >=, <=
    if (char === '=' || char === '!' || char === '>' || char === '<') {
      let value = char;
      i++;
      if (i < len && formula[i] === '=') {
        value += formula[i];
        i++;
      }
      tokens.push({ type: 'operator', value, start, end: i });
      continue;
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'paren-open', value: char, start, end: i + 1 });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'paren-close', value: char, start, end: i + 1 });
      i++;
      continue;
    }

    // Commas
    if (char === ',') {
      tokens.push({ type: 'comma', value: char, start, end: i + 1 });
      i++;
      continue;
    }

    // Identifiers (functions, boolean values, etc.)
    if (/[a-zA-Z_]/.test(char)) {
      let value = char;
      i++;
      while (i < len && /[a-zA-Z0-9_]/.test(formula[i])) {
        value += formula[i];
        i++;
      }
      // Check if it's a function (followed by opening paren)
      if (i < len && formula[i] === '(') {
        tokens.push({ type: 'function', value: value.toUpperCase(), start, end: i });
      } else {
        // Boolean or other identifier
        const upper = value.toUpperCase();
        if (upper === 'TRUE' || upper === 'FALSE') {
          tokens.push({ type: 'number', value: upper, start, end: i });
        } else {
          tokens.push({ type: 'unknown', value, start, end: i });
        }
      }
      continue;
    }

    // Unknown character
    tokens.push({ type: 'unknown', value: char, start, end: i + 1 });
    i++;
  }

  return tokens;
}

/**
 * Formats an Airtable formula with proper indentation and line breaks
 */
export function formatAirtableFormula(formula: string): string {
  if (!formula.trim()) {
    return '';
  }

  const tokens = tokenize(formula);
  if (tokens.length === 0) {
    return formula;
  }

  let result = '';
  let indentLevel = 0;
  const indentChar = '\t'; // Use tabs as requested
  let i = 0;
  let isMultiLine = false; // Track if we're in multi-line formatting mode

  function addIndent() {
    return indentChar.repeat(indentLevel);
  }

  function countParameters(startIndex: number): number {
    let depth = 1;
    let j = startIndex + 1;
    let paramCount = 0;
    while (j < tokens.length && depth > 0) {
      if (tokens[j].type === 'paren-open') depth++;
      if (tokens[j].type === 'paren-close') depth--;
      if (depth === 1 && tokens[j].type === 'comma') paramCount++;
      j++;
    }
    return paramCount;
  }

  function shouldBreakAfterParenOpen(index: number): boolean {
    return countParameters(index) > 0;
  }

  while (i < tokens.length) {
    const token = tokens[i];
    const nextToken = i + 1 < tokens.length ? tokens[i + 1] : undefined;
    const prevToken = i > 0 ? tokens[i - 1] : undefined;

    switch (token.type) {
      case 'paren-open':
        result += token.value;
        if (shouldBreakAfterParenOpen(i)) {
          indentLevel++;
          isMultiLine = true;
          result += '\n' + addIndent();
        }
        break;

      case 'paren-close':
        // Always put closing paren on its own line when in multi-line mode
        if (indentLevel > 0) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        // Add newline if in multi-line mode and not an empty paren
        if (isMultiLine && prevToken?.type !== 'paren-open') {
          result += '\n' + addIndent();
        }
        // Reset multi-line flag if we're back to root level
        if (indentLevel === 0) {
          isMultiLine = false;
        }
        result += token.value;
        break;

      case 'comma':
        result += token.value;
        if (nextToken && nextToken.type !== 'paren-close') {
          // Always break line after comma for multi-line formatting
          result += '\n' + addIndent();
        }
        break;

      case 'operator':
        // Always add spaces around operators
        // Add space before if not after opening paren, comma, or another operator
        if (prevToken && 
            prevToken.type !== 'paren-open' && 
            prevToken.type !== 'comma' &&
            prevToken.type !== 'operator') {
          // Only add space if we don't already have one (check last char)
          const lastChar = result[result.length - 1];
          if (lastChar !== ' ' && lastChar !== '\n' && lastChar !== '\t') {
            result += ' ';
          }
        }
        result += token.value;
        // Add space after if not before closing paren, comma, or another operator
        if (nextToken && 
            nextToken.type !== 'paren-close' && 
            nextToken.type !== 'comma' &&
            nextToken.type !== 'operator') {
          result += ' ';
        }
        break;

      case 'function':
        result += token.value;
        break;

      case 'field':
      case 'string':
      case 'number':
      case 'unknown':
        result += token.value;
        break;
    }

    i++;
  }

  // Clean up extra whitespace and normalize line breaks
  // But preserve spaces around operators and indentation
  // Split into lines, clean each line, then rejoin
  const lines = result.split('\n');
  const cleanedLines = lines.map(line => {
    // Remove trailing spaces (but keep tabs - they're indentation)
    let cleaned = line.replace(/[ ]+$/, '');
    // Collapse multiple spaces into single space (but preserve tabs and newlines)
    cleaned = cleaned.replace(/([^ \t])\s{2,}([^ \t])/g, '$1 $2');
    return cleaned;
  });
  const cleaned = cleanedLines
    .join('\n')
    .replace(/\n\s*\n+/g, '\n') // Remove multiple blank lines
    .replace(/^\s+|\s+$/g, ''); // Trim start/end of entire result
  
  return cleaned;
}
