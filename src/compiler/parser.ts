/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BinaryExprNode,
  ColumnRefNode,
  Diagnostic,
  ExpressionNode,
  JoinClauseNode,
  LimitClauseNode,
  LiteralNode,
  OrderByClauseNode,
  ProjectionItemNode,
  SelectStatementNode,
  TableRefNode,
  Token,
  UnaryExprNode,
  WhereClauseNode,
} from './types';

export interface ParserResult {
  ast: SelectStatementNode | null;
  diagnostics: Diagnostic[];
  hasError: boolean;
}

export class Parser {
  private tokens: Token[];
  private current = 0;
  private diagnostics: Diagnostic[] = [];
  private rawSql: string;

  constructor(tokens: Token[], rawSql: string) {
    // Filter out comments from syntactic processing, while keeping them tracked
    this.tokens = tokens.filter(t => t.type !== 'COMMENT');
    this.rawSql = rawSql;
  }

  public parse(): ParserResult {
    try {
      if (this.isAtEnd()) {
        this.addError('Unexpected empty query. Expected SQL statement.', this.peek());
        return { ast: null, diagnostics: this.diagnostics, hasError: true };
      }

      const ast = this.query();

      // Check for trailing unexpected tokens (excluding optional trailing semicolon or EOF)
      if (!this.isAtEnd()) {
        if (this.peek().value === ';') {
          this.advance(); // consume trailing semicolon
        }
        if (!this.isAtEnd()) {
          const extraToken = this.peek();
          this.addError(
            `Syntax Error: Unexpected extra token '${extraToken.value}' after query end`,
            extraToken,
            'Remove trailing tokens or separate statements with valid syntax'
          );
        }
      }

      const hasError = this.diagnostics.some(d => d.severity === 'ERROR');
      return {
        ast: hasError ? null : ast,
        diagnostics: this.diagnostics,
        hasError,
      };
    } catch (e: any) {
      const hasError = this.diagnostics.some(d => d.severity === 'ERROR');
      if (!hasError) {
        this.addError(`Fatal Syntax Error: ${e.message || 'Malformed syntax'}`, this.peek());
      }
      return {
        ast: null,
        diagnostics: this.diagnostics,
        hasError: true,
      };
    }
  }

  // query -> SELECT column_list [FROM table] [JOIN ...] [WHERE ...] [ORDER BY ...] [LIMIT ...]
  private query(): SelectStatementNode {
    const selectToken = this.peek();
    if (!this.matchKeyword('SELECT')) {
      throw this.syntaxError(
        `Syntax Error: Expected 'SELECT' keyword at beginning of query, got '${selectToken.value}'`,
        selectToken,
        "Start query with 'SELECT <columns> FROM <table>'"
      );
    }

    // Optional DISTINCT
    if (this.matchKeyword('DISTINCT')) {
      // acknowledged
    }

    // column_list
    const projections = this.projectionList();

    // FROM clause
    let fromTable: TableRefNode | undefined;
    if (this.matchKeyword('FROM')) {
      fromTable = this.tableRef();
    } else {
      // If query does not have FROM, check if next token is valid or missing
      if (!this.isAtEnd() && this.peek().value !== ';') {
        const next = this.peek();
        this.addError(
          `Syntax Error: Expected 'FROM' clause after column list, encountered '${next.value}'`,
          next,
          "Specify the source table using 'FROM <table_name>'"
        );
      }
    }

    // Optional JOIN clauses
    const joins: JoinClauseNode[] = [];
    while (this.matchAnyKeywords(['JOIN', 'INNER', 'LEFT', 'RIGHT'])) {
      const joinTypeToken = this.previous();
      let joinType: 'INNER' | 'LEFT' | 'RIGHT' = 'INNER';

      if (joinTypeToken.value === 'LEFT') {
        this.matchKeyword('JOIN');
        joinType = 'LEFT';
      } else if (joinTypeToken.value === 'RIGHT') {
        this.matchKeyword('JOIN');
        joinType = 'RIGHT';
      } else if (joinTypeToken.value === 'INNER') {
        this.matchKeyword('JOIN');
        joinType = 'INNER';
      }

      const joinTable = this.tableRef();

      if (!this.matchKeyword('ON')) {
        throw this.syntaxError(
          `Syntax Error: Expected 'ON' condition after JOIN table '${joinTable.tableName}'`,
          this.peek(),
          "Add ON condition, e.g., 'ON table1.id = table2.foreign_id'"
        );
      }

      const onCondition = this.expression();
      if (onCondition.type !== 'BinaryExpr') {
        this.addError(
          `Syntax Error: JOIN ON condition must be a binary comparison (e.g. t1.id = t2.student_id)`,
          this.previous()
        );
      }

      joins.push({
        type: 'JoinClause',
        joinType,
        table: joinTable,
        onCondition: onCondition as BinaryExprNode,
        line: joinTypeToken.line,
        column: joinTypeToken.column,
      });
    }

    // Optional WHERE clause
    let where: WhereClauseNode | undefined;
    if (this.matchKeyword('WHERE')) {
      const whereToken = this.previous();
      const condition = this.expression();
      where = {
        type: 'WhereClause',
        condition,
        line: whereToken.line,
        column: whereToken.column,
      };
    }

    // Optional ORDER BY clause
    let orderBy: OrderByClauseNode | undefined;
    if (this.matchKeyword('ORDER')) {
      const orderToken = this.previous();
      if (!this.matchKeyword('BY')) {
        throw this.syntaxError(
          "Syntax Error: Expected 'BY' after 'ORDER'",
          this.peek(),
          "Write 'ORDER BY <column> [ASC|DESC]'"
        );
      }

      const orderColExpr = this.columnRef();
      let direction: 'ASC' | 'DESC' = 'ASC';
      if (this.matchKeyword('DESC')) {
        direction = 'DESC';
      } else if (this.matchKeyword('ASC')) {
        direction = 'ASC';
      }

      orderBy = {
        type: 'OrderByClause',
        sortColumn: orderColExpr,
        direction,
        line: orderToken.line,
        column: orderToken.column,
      };
    }

    // Optional LIMIT clause
    let limit: LimitClauseNode | undefined;
    if (this.matchKeyword('LIMIT')) {
      const limitToken = this.previous();
      if (this.peek().type !== 'NUMBER') {
        throw this.syntaxError(
          `Syntax Error: Expected integer number after LIMIT, got '${this.peek().value}'`,
          this.peek(),
          'LIMIT expects an integer, e.g., LIMIT 10'
        );
      }
      const limitNum = parseInt(this.advance().value, 10);

      let offset: number | undefined;
      if (this.matchKeyword('OFFSET')) {
        if (this.peek().type === 'NUMBER') {
          offset = parseInt(this.advance().value, 10);
        }
      }

      limit = {
        type: 'LimitClause',
        limit: limitNum,
        offset,
        line: limitToken.line,
        column: limitToken.column,
      };
    }

    return {
      type: 'SelectStatement',
      projections,
      fromTable,
      joins,
      where,
      orderBy,
      limit,
      rawSql: this.rawSql,
      line: selectToken.line,
      column: selectToken.column,
    };
  }

  // projectionList -> projectionItem (, projectionItem)*
  private projectionList(): ProjectionItemNode[] {
    const list: ProjectionItemNode[] = [];

    // Check for empty column list: e.g. "SELECT FROM ..."
    if (this.checkKeyword('FROM') || this.checkPunctuation(';')) {
      throw this.syntaxError(
        "Syntax Error: Expected column list after SELECT, found 'FROM'",
        this.peek(),
        "Specify columns or wildcard '*', e.g., 'SELECT name, cgpa FROM ...'"
      );
    }

    do {
      list.push(this.projectionItem());
    } while (this.matchPunctuation(','));

    return list;
  }

  private projectionItem(): ProjectionItemNode {
    const token = this.peek();

    // Wildcard *
    if (this.matchOperator('*')) {
      return {
        type: 'ProjectionItem',
        isWildcard: true,
        expression: {
          type: 'ColumnRef',
          columnName: '*',
          line: token.line,
          column: token.column,
        },
        line: token.line,
        column: token.column,
      };
    }

    // Normal column expression
    const expr = this.expression();

    // Optional alias: AS alias_name or identifier
    let alias: string | undefined;
    if (this.matchKeyword('AS')) {
      const aliasToken = this.advance();
      if (aliasToken.type !== 'IDENTIFIER' && aliasToken.type !== 'STRING') {
        this.addError(`Expected alias identifier after 'AS', got '${aliasToken.value}'`, aliasToken);
      }
      alias = aliasToken.value;
    } else if (this.peek().type === 'IDENTIFIER' && !this.checkKeyword('FROM')) {
      alias = this.advance().value;
    }

    return {
      type: 'ProjectionItem',
      expression: expr,
      alias,
      isWildcard: false,
      line: expr.line,
      column: expr.column,
    };
  }

  // tableRef -> identifier [AS alias]
  private tableRef(): TableRefNode {
    const token = this.peek();
    if (token.type !== 'IDENTIFIER' && token.type !== 'KEYWORD') {
      throw this.syntaxError(
        `Syntax Error: Expected table name, encountered '${token.value}'`,
        token,
        'Provide a valid table name from the schema (e.g. students, courses)'
      );
    }

    this.advance();
    const tableName = token.value;

    let alias: string | undefined;
    if (this.matchKeyword('AS')) {
      alias = this.advance().value;
    } else if (
      this.peek().type === 'IDENTIFIER' &&
      !this.checkAnyKeywords(['WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ORDER', 'LIMIT', 'GROUP'])
    ) {
      alias = this.advance().value;
    }

    return {
      type: 'TableRef',
      tableName,
      alias,
      line: token.line,
      column: token.column,
    };
  }

  // expression -> logicalOr
  private expression(): ExpressionNode {
    return this.logicalOr();
  }

  // logicalOr -> logicalAnd (OR logicalAnd)*
  private logicalOr(): ExpressionNode {
    let expr = this.logicalAnd();

    while (this.matchKeyword('OR')) {
      const opToken = this.previous();
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpr',
        operator: 'OR',
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  // logicalAnd -> equality (AND equality)*
  private logicalAnd(): ExpressionNode {
    let expr = this.equality();

    while (this.matchKeyword('AND')) {
      const opToken = this.previous();
      const right = this.equality();
      expr = {
        type: 'BinaryExpr',
        operator: 'AND',
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  // equality -> comparison ((= | != | <> | LIKE) comparison)*
  private equality(): ExpressionNode {
    let expr = this.comparison();

    while (
      this.matchOperator('=') ||
      this.matchOperator('!=') ||
      this.matchOperator('<>') ||
      this.matchKeyword('LIKE')
    ) {
      const opToken = this.previous();
      const right = this.comparison();
      expr = {
        type: 'BinaryExpr',
        operator: opToken.value.toUpperCase(),
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  // comparison -> primary ((> | < | >= | <=) primary)*
  private comparison(): ExpressionNode {
    let expr = this.primary();

    while (
      this.matchOperator('>') ||
      this.matchOperator('<') ||
      this.matchOperator('>=') ||
      this.matchOperator('<=')
    ) {
      const opToken = this.previous();
      const right = this.primary();
      expr = {
        type: 'BinaryExpr',
        operator: opToken.value,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  // primary -> ColumnRef | Literal | ( expression )
  private primary(): ExpressionNode {
    const token = this.peek();

    // Grouping / Parentheses
    if (this.matchPunctuation('(')) {
      const expr = this.expression();
      if (!this.matchPunctuation(')')) {
        throw this.syntaxError(
          "Syntax Error: Unclosed parenthesis. Expected ')'",
          this.peek(),
          "Close the expression with ')'"
        );
      }
      return expr;
    }

    // Number literal
    if (token.type === 'NUMBER') {
      this.advance();
      const numVal = token.value.includes('.') ? parseFloat(token.value) : parseInt(token.value, 10);
      return {
        type: 'Literal',
        value: numVal,
        literalType: 'NUMBER',
        line: token.line,
        column: token.column,
      };
    }

    // String literal
    if (token.type === 'STRING') {
      this.advance();
      return {
        type: 'Literal',
        value: token.value,
        literalType: 'STRING',
        line: token.line,
        column: token.column,
      };
    }

    // Boolean or NULL keywords
    if (token.type === 'KEYWORD' && ['TRUE', 'FALSE', 'NULL'].includes(token.value)) {
      this.advance();
      const val = token.value === 'TRUE' ? true : token.value === 'FALSE' ? false : null;
      return {
        type: 'Literal',
        value: val,
        literalType: token.value === 'NULL' ? 'NULL' : 'BOOLEAN',
        line: token.line,
        column: token.column,
      };
    }

    // Column reference: column or table.column
    if (token.type === 'IDENTIFIER' || (token.type === 'OPERATOR' && token.value === '*')) {
      return this.columnRef();
    }

    // Unexpected primary token
    throw this.syntaxError(
      `Syntax Error: Unexpected token '${token.value}' in expression`,
      token,
      'Expected column name, literal value, or sub-expression'
    );
  }

  private columnRef(): ColumnRefNode {
    const firstToken = this.advance();
    let tableName: string | undefined;
    let columnName = firstToken.value;

    // Check for dot notation: table.column
    if (this.matchPunctuation('.')) {
      tableName = columnName;
      const nextToken = this.peek();
      if (nextToken.type === 'IDENTIFIER' || (nextToken.type === 'OPERATOR' && nextToken.value === '*')) {
        columnName = this.advance().value;
      } else {
        throw this.syntaxError(
          `Syntax Error: Expected column name after '${tableName}.', got '${nextToken.value}'`,
          nextToken
        );
      }
    }

    return {
      type: 'ColumnRef',
      columnName,
      tableName,
      line: firstToken.line,
      column: firstToken.column,
    };
  }

  // Helper matching functions
  private matchKeyword(keyword: string): boolean {
    if (this.checkKeyword(keyword)) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchAnyKeywords(keywords: string[]): boolean {
    for (const kw of keywords) {
      if (this.checkKeyword(kw)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private checkKeyword(keyword: string): boolean {
    if (this.isAtEnd()) return false;
    const t = this.peek();
    return t.type === 'KEYWORD' && t.value.toUpperCase() === keyword.toUpperCase();
  }

  private checkAnyKeywords(keywords: string[]): boolean {
    if (this.isAtEnd()) return false;
    const val = this.peek().value.toUpperCase();
    return keywords.some(k => k.toUpperCase() === val);
  }

  private matchOperator(op: string): boolean {
    if (this.checkOperator(op)) {
      this.advance();
      return true;
    }
    return false;
  }

  private checkOperator(op: string): boolean {
    if (this.isAtEnd()) return false;
    const t = this.peek();
    return t.type === 'OPERATOR' && t.value === op;
  }

  private matchPunctuation(p: string): boolean {
    if (this.checkPunctuation(p)) {
      this.advance();
      return true;
    }
    return false;
  }

  private checkPunctuation(p: string): boolean {
    if (this.isAtEnd()) return false;
    const t = this.peek();
    return t.type === 'PUNCTUATION' && t.value === p;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current] || { id: -1, type: 'EOF', value: '<EOF>', raw: '', line: 1, column: 1, length: 0 };
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private syntaxError(message: string, token: Token, suggestion?: string): Error {
    this.addError(message, token, suggestion);
    return new Error(message);
  }

  private addError(message: string, token: Token, suggestion?: string): void {
    this.diagnostics.push({
      stage: 'PARSER',
      severity: 'ERROR',
      message,
      line: token.line,
      column: token.column,
      length: token.length || 1,
      suggestion,
      rule: 'Syntax Analysis / CFG Grammar Rule',
    });
  }
}

export function parse(tokens: Token[], sql: string): ParserResult {
  const parser = new Parser(tokens, sql);
  return parser.parse();
}
