/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic, Token, TokenType } from './types';

const KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'NOT',
  'ORDER',
  'BY',
  'LIMIT',
  'OFFSET',
  'ASC',
  'DESC',
  'AS',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'OUTER',
  'ON',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'DROP',
  'TABLE',
  'UNION',
  'ALL',
  'DISTINCT',
  'NULL',
  'TRUE',
  'FALSE',
  'LIKE',
  'IN',
  'BETWEEN',
  'IS',
  'CREATE',
  'ALTER',
  'TRUNCATE',
  'GROUP',
  'HAVING',
]);

export interface LexerResult {
  tokens: Token[];
  diagnostics: Diagnostic[];
  hasError: boolean;
}

export class Lexer {
  private input: string;
  private pos = 0;
  private line = 1;
  private column = 1;
  private tokens: Token[] = [];
  private diagnostics: Diagnostic[] = [];
  private tokenIdCounter = 1;

  constructor(input: string) {
    this.input = input;
  }

  public tokenize(): LexerResult {
    const len = this.input.length;

    while (this.pos < len) {
      const char = this.input[this.pos];

      // Whitespace handling
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
        continue;
      }

      if (char === '\n') {
        this.line++;
        this.pos++;
        this.column = 1;
        continue;
      }

      // Single-line comment (-- comment)
      if (char === '-' && this.peek() === '-') {
        const startLine = this.line;
        const startCol = this.column;
        let commentText = '';
        while (this.pos < len && this.input[this.pos] !== '\n') {
          commentText += this.input[this.pos];
          this.advance();
        }
        this.addToken('COMMENT', commentText, startLine, startCol, commentText.length);
        continue;
      }

      // Multi-line comment (/* comment */)
      if (char === '/' && this.peek() === '*') {
        const startLine = this.line;
        const startCol = this.column;
        let commentText = '/*';
        this.advance(); // consume /
        this.advance(); // consume *

        let terminated = false;
        while (this.pos < len) {
          if (this.input[this.pos] === '*' && this.peek() === '/') {
            commentText += '*/';
            this.advance(); // consume *
            this.advance(); // consume /
            terminated = true;
            break;
          }
          if (this.input[this.pos] === '\n') {
            this.line++;
            this.pos++;
            this.column = 1;
            commentText += '\n';
          } else {
            commentText += this.input[this.pos];
            this.advance();
          }
        }

        if (!terminated) {
          this.diagnostics.push({
            stage: 'LEXER',
            severity: 'ERROR',
            message: 'Unterminated multi-line comment. Expected */',
            line: startLine,
            column: startCol,
            length: commentText.length,
            rule: 'Lexical Grammar: Comment termination',
          });
        }
        this.addToken('COMMENT', commentText, startLine, startCol, commentText.length);
        continue;
      }

      // String literals: 'text' or "text"
      if (char === "'" || char === '"') {
        const quote = char;
        const startLine = this.line;
        const startCol = this.column;
        let strVal = '';
        this.advance(); // skip opening quote

        let isClosed = false;
        while (this.pos < len) {
          const c = this.input[this.pos];
          if (c === quote) {
            // Check for escaped quote ''
            if (this.peek() === quote) {
              strVal += quote;
              this.advance();
              this.advance();
              continue;
            }
            this.advance(); // skip closing quote
            isClosed = true;
            break;
          }
          if (c === '\n') {
            this.line++;
            this.pos++;
            this.column = 1;
            strVal += '\n';
          } else {
            strVal += c;
            this.advance();
          }
        }

        if (!isClosed) {
          this.diagnostics.push({
            stage: 'LEXER',
            severity: 'ERROR',
            message: `Unterminated string literal. Expected closing ${quote}`,
            line: startLine,
            column: startCol,
            length: strVal.length + 1,
            suggestion: `Add closing quote '${quote}'`,
            rule: 'Lexical Grammar: String literal',
          });
        }

        this.addToken('STRING', strVal, startLine, startCol, strVal.length + (isClosed ? 2 : 1), quote + strVal + (isClosed ? quote : ''));
        continue;
      }

      // Numeric literals: digits, floats (e.g. 3.0, 42)
      if (this.isDigit(char) || (char === '.' && this.isDigit(this.peek()))) {
        const startLine = this.line;
        const startCol = this.column;
        let numStr = '';
        let hasDot = false;

        while (this.pos < len) {
          const c = this.input[this.pos];
          if (this.isDigit(c)) {
            numStr += c;
            this.advance();
          } else if (c === '.' && !hasDot && this.isDigit(this.peek())) {
            hasDot = true;
            numStr += c;
            this.advance();
          } else {
            break;
          }
        }

        this.addToken('NUMBER', numStr, startLine, startCol, numStr.length);
        continue;
      }

      // Two-character operators
      const twoChar = char + (this.peek() || '');
      if (['!=', '<>', '>=', '<='].includes(twoChar)) {
        const startLine = this.line;
        const startCol = this.column;
        this.advance();
        this.advance();
        this.addToken('OPERATOR', twoChar, startLine, startCol, 2);
        continue;
      }

      // Single-character operators
      if (['=', '>', '<', '+', '-', '*', '/', '%'].includes(char)) {
        const startLine = this.line;
        const startCol = this.column;
        this.advance();
        this.addToken('OPERATOR', char, startLine, startCol, 1);
        continue;
      }

      // Punctuation characters: , ; ( ) .
      if ([',', ';', '(', ')', '.'].includes(char)) {
        const startLine = this.line;
        const startCol = this.column;
        this.advance();
        this.addToken('PUNCTUATION', char, startLine, startCol, 1);
        continue;
      }

      // Identifiers and Keywords
      if (this.isAlpha(char) || char === '_') {
        const startLine = this.line;
        const startCol = this.column;
        let identStr = '';

        while (this.pos < len && (this.isAlphaNumeric(this.input[this.pos]) || this.input[this.pos] === '_')) {
          identStr += this.input[this.pos];
          this.advance();
        }

        const upper = identStr.toUpperCase();
        if (KEYWORDS.has(upper)) {
          this.addToken('KEYWORD', upper, startLine, startCol, identStr.length, identStr);
        } else {
          this.addToken('IDENTIFIER', identStr, startLine, startCol, identStr.length);
        }
        continue;
      }

      // Unknown / illegal character (Lexical error)
      const startLine = this.line;
      const startCol = this.column;
      const illegalChar = char;
      this.advance();
      this.diagnostics.push({
        stage: 'LEXER',
        severity: 'ERROR',
        message: `Lexical Error: Invalid character '${illegalChar}' encountered`,
        line: startLine,
        column: startCol,
        length: 1,
        suggestion: `Remove or replace '${illegalChar}' with valid SQL token`,
        rule: 'Lexical Grammar: Disallowed character',
      });
      this.addToken('UNKNOWN', illegalChar, startLine, startCol, 1);
    }

    // Add EOF token
    this.addToken('EOF', '<EOF>', this.line, this.column, 0);

    const hasError = this.diagnostics.some(d => d.severity === 'ERROR');
    return {
      tokens: this.tokens,
      diagnostics: this.diagnostics,
      hasError,
    };
  }

  private advance(): void {
    this.pos++;
    this.column++;
  }

  private peek(): string | null {
    if (this.pos + 1 < this.input.length) {
      return this.input[this.pos + 1];
    }
    return null;
  }

  private isDigit(c: string | null): boolean {
    return c !== null && c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private addToken(type: TokenType, value: string, line: number, column: number, length: number, raw?: string): void {
    this.tokens.push({
      id: this.tokenIdCounter++,
      type,
      value,
      raw: raw ?? value,
      line,
      column,
      length,
    });
  }
}

export function tokenize(sql: string): LexerResult {
  const lexer = new Lexer(sql);
  return lexer.tokenize();
}
