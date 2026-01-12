/**
 * Syntax highlighting utilities for Airtable formulas
 */

export interface HighlightedToken {
  text: string;
  type: 'function' | 'field' | 'string' | 'number' | 'operator' | 'punctuation' | 'text';
}

/**
 * Highlights Airtable formula syntax
 */
export function highlightAirtableFormula(formula: string): HighlightedToken[] {
  const tokens: HighlightedToken[] = [];
  let i = 0;
  const len = formula.length;

  while (i < len) {
    const char = formula[i];

    // Field references: {Field Name}
    if (char === '{') {
      let text = char;
      i++;
      while (i < len && formula[i] !== '}') {
        text += formula[i];
        i++;
      }
      if (i < len) {
        text += formula[i]; // include the closing }
        i++;
      }
      tokens.push({ text, type: 'field' });
      continue;
    }

    // String literals: "text" or 'text'
    if (char === '"' || char === "'") {
      const quote = char;
      let text = char;
      i++;
      let escaped = false;
      while (i < len) {
        if (escaped) {
          text += formula[i];
          i++;
          escaped = false;
        } else if (formula[i] === '\\') {
          text += formula[i];
          i++;
          escaped = true;
        } else if (formula[i] === quote) {
          text += formula[i];
          i++;
          break;
        } else {
          text += formula[i];
          i++;
        }
      }
      tokens.push({ text, type: 'string' });
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let text = char;
      i++;
      while (i < len && (/\d/.test(formula[i]) || formula[i] === '.')) {
        text += formula[i];
        i++;
      }
      tokens.push({ text, type: 'number' });
      continue;
    }

    // Operators
    if (/[+\-*/&]/.test(char)) {
      tokens.push({ text: char, type: 'operator' });
      i++;
      continue;
    }

    // Comparison operators
    if (char === '=' || char === '!' || char === '>' || char === '<') {
      let text = char;
      i++;
      if (i < len && formula[i] === '=') {
        text += formula[i];
        i++;
      }
      tokens.push({ text, type: 'operator' });
      continue;
    }

    // Parentheses and commas
    if (char === '(' || char === ')' || char === ',') {
      tokens.push({ text: char, type: 'punctuation' });
      i++;
      continue;
    }

    // Functions (identifiers followed by opening paren)
    if (/[a-zA-Z_]/.test(char)) {
      let text = char;
      i++;
      while (i < len && /[a-zA-Z0-9_]/.test(formula[i])) {
        text += formula[i];
        i++;
      }
      // Check if it's a function (followed by opening paren or whitespace then paren)
      let j = i;
      while (j < len && /\s/.test(formula[j])) j++;
      if (j < len && formula[j] === '(') {
        tokens.push({ text: text.toUpperCase(), type: 'function' });
      } else {
        // Boolean or other identifier
        const upper = text.toUpperCase();
        if (upper === 'TRUE' || upper === 'FALSE') {
          tokens.push({ text: upper, type: 'number' });
        } else {
          tokens.push({ text, type: 'text' });
        }
        i = j; // Skip whitespace
      }
      continue;
    }

    // Whitespace
    if (/\s/.test(char)) {
      let text = char;
      i++;
      while (i < len && /\s/.test(formula[i])) {
        text += formula[i];
        i++;
      }
      tokens.push({ text, type: 'text' });
      continue;
    }

    // Unknown character
    tokens.push({ text: char, type: 'text' });
    i++;
  }

  return tokens;
}
