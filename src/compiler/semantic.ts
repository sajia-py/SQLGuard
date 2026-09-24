/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SymbolTable } from './symbolTable';
import {
  ColumnRefNode,
  DatabaseSchema,
  Diagnostic,
  ExpressionNode,
  SelectStatementNode,
} from './types';

export interface SemanticResult {
  symbolTable: SymbolTable;
  diagnostics: Diagnostic[];
  hasError: boolean;
}

export class SemanticAnalyzer {
  private schema: DatabaseSchema;
  private symbolTable: SymbolTable;
  private diagnostics: Diagnostic[] = [];

  constructor(schema: DatabaseSchema) {
    this.schema = schema;
    this.symbolTable = new SymbolTable(schema);
  }

  public analyze(ast: SelectStatementNode): SemanticResult {
    // 1. Table Resolution (FROM clause)
    if (!ast.fromTable) {
      this.diagnostics.push({
        stage: 'SEMANTIC',
        severity: 'ERROR',
        message: 'Semantic Error: Missing FROM clause. Target table must be specified.',
        line: ast.line || 1,
        column: ast.column || 1,
        rule: 'Relational Model: Source relation required',
        suggestion: 'Add FROM <table_name> (e.g., FROM students)',
      });
      return { symbolTable: this.symbolTable, diagnostics: this.diagnostics, hasError: true };
    }

    const mainTable = this.symbolTable.lookupTable(ast.fromTable.tableName);
    if (!mainTable) {
      const suggestion = this.symbolTable.suggestTable(ast.fromTable.tableName);
      this.diagnostics.push({
        stage: 'SEMANTIC',
        severity: 'ERROR',
        message: `Semantic Error: Table '${ast.fromTable.tableName}' does not exist in schema.`,
        line: ast.fromTable.line || 1,
        column: ast.fromTable.column || 1,
        suggestion: suggestion ? `Did you mean '${suggestion}'?` : undefined,
        rule: 'Symbol Table: Table existence check',
      });
    } else {
      this.symbolTable.registerTable(ast.fromTable.tableName, ast.fromTable.alias);
    }

    // 2. JOIN Tables Resolution
    for (const join of ast.joins) {
      const joinTable = this.symbolTable.lookupTable(join.table.tableName);
      if (!joinTable) {
        const suggestion = this.symbolTable.suggestTable(join.table.tableName);
        this.diagnostics.push({
          stage: 'SEMANTIC',
          severity: 'ERROR',
          message: `Semantic Error: JOIN target table '${join.table.tableName}' does not exist in schema.`,
          line: join.table.line || 1,
          column: join.table.column || 1,
          suggestion: suggestion ? `Did you mean '${suggestion}'?` : undefined,
          rule: 'Symbol Table: Join relation existence',
        });
      } else {
        this.symbolTable.registerTable(join.table.tableName, join.table.alias);
      }
    }

    // Stop if table registration failed
    if (this.diagnostics.some(d => d.severity === 'ERROR')) {
      return { symbolTable: this.symbolTable, diagnostics: this.diagnostics, hasError: true };
    }

    // 3. Check Projections (SELECT columns)
    for (const proj of ast.projections) {
      if (proj.isWildcard) continue;
      this.validateExpression(proj.expression);
    }

    // 4. Check WHERE clause conditions
    if (ast.where) {
      this.validateExpression(ast.where.condition);
      this.validateTypeComparisons(ast.where.condition);
    }

    // 5. Check ORDER BY clause
    if (ast.orderBy) {
      this.validateColumnRef(ast.orderBy.sortColumn);
    }

    // 6. Check LIMIT clause
    if (ast.limit) {
      if (ast.limit.limit < 0) {
        this.diagnostics.push({
          stage: 'SEMANTIC',
          severity: 'ERROR',
          message: `Semantic Error: LIMIT must be a non-negative integer (found ${ast.limit.limit}).`,
          line: ast.limit.line || 1,
          column: ast.limit.column || 1,
          suggestion: 'Provide a positive integer, e.g., LIMIT 10',
          rule: 'Semantic Constraints: Non-negative limit',
        });
      }
      if (ast.limit.offset !== undefined && ast.limit.offset < 0) {
        this.diagnostics.push({
          stage: 'SEMANTIC',
          severity: 'ERROR',
          message: `Semantic Error: OFFSET must be a non-negative integer (found ${ast.limit.offset}).`,
          line: ast.limit.line || 1,
          column: ast.limit.column || 1,
          suggestion: 'Provide a non-negative offset, e.g., OFFSET 0',
          rule: 'Semantic Constraints: Non-negative offset',
        });
      }
    }

    const hasError = this.diagnostics.some(d => d.severity === 'ERROR');
    return {
      symbolTable: this.symbolTable,
      diagnostics: this.diagnostics,
      hasError,
    };
  }

  private validateExpression(node: ExpressionNode): void {
    if (node.type === 'ColumnRef') {
      this.validateColumnRef(node);
    } else if (node.type === 'BinaryExpr') {
      this.validateExpression(node.left);
      this.validateExpression(node.right);
    } else if (node.type === 'UnaryExpr') {
      this.validateExpression(node.operand);
    }
  }

  private validateColumnRef(colRef: ColumnRefNode): void {
    if (colRef.columnName === '*') return;

    if (colRef.tableName) {
      // Qualified reference: table.col
      const activeTable = this.symbolTable.getActiveTable(colRef.tableName);
      if (!activeTable) {
        this.diagnostics.push({
          stage: 'SEMANTIC',
          severity: 'ERROR',
          message: `Semantic Error: Table or alias '${colRef.tableName}' is not declared in FROM / JOIN clauses.`,
          line: colRef.line || 1,
          column: colRef.column || 1,
          rule: 'Scope Resolution: Unbound table qualifier',
        });
        return;
      }

      const col = this.symbolTable.lookupColumn(colRef.tableName, colRef.columnName);
      if (!col) {
        const suggestion = this.symbolTable.suggestColumn(activeTable.tableName, colRef.columnName);
        this.diagnostics.push({
          stage: 'SEMANTIC',
          severity: 'ERROR',
          message: `Semantic Error: Column '${colRef.columnName}' does not exist in table '${activeTable.tableName}'.`,
          line: colRef.line || 1,
          column: colRef.column || 1,
          suggestion: suggestion ? `Did you mean '${activeTable.tableName}.${suggestion}'?` : undefined,
          rule: 'Symbol Table: Column resolution',
        });
      }
    } else {
      // Unqualified reference: col
      const res = this.symbolTable.resolveUnqualifiedColumn(colRef.columnName);
      if (res === null) {
        const activeTables = this.symbolTable.getAllActiveTables();
        const primaryTable = activeTables[0]?.tableName || 'table';
        const suggestion = this.symbolTable.suggestColumn(primaryTable, colRef.columnName);
        this.diagnostics.push({
          stage: 'SEMANTIC',
          severity: 'ERROR',
          message: `Semantic Error: Unknown column '${colRef.columnName}' in available schema tables.`,
          line: colRef.line || 1,
          column: colRef.column || 1,
          suggestion: suggestion ? `Did you mean '${suggestion}'?` : undefined,
          rule: 'Symbol Table: Unqualified column resolution',
        });
      } else if (res === 'AMBIGUOUS') {
        this.diagnostics.push({
          stage: 'SEMANTIC',
          severity: 'ERROR',
          message: `Semantic Error: Column reference '${colRef.columnName}' is ambiguous (present in multiple joined tables).`,
          line: colRef.line || 1,
          column: colRef.column || 1,
          suggestion: `Prefix with table name, e.g., table_name.${colRef.columnName}`,
          rule: 'Scope Resolution: Ambiguous column disambiguation',
        });
      }
    }
  }

  private validateTypeComparisons(node: ExpressionNode): void {
    if (node.type !== 'BinaryExpr') return;

    this.validateTypeComparisons(node.left);
    this.validateTypeComparisons(node.right);

    // Check if operator is comparison (=, >, <, >=, <=, !=)
    const compOps = ['=', '>', '<', '>=', '<=', '!=', '<>'];
    if (!compOps.includes(node.operator)) return;

    let colNode: ColumnRefNode | null = null;
    let litNode: any = null;

    if (node.left.type === 'ColumnRef' && node.right.type === 'Literal') {
      colNode = node.left;
      litNode = node.right;
    } else if (node.right.type === 'ColumnRef' && node.left.type === 'Literal') {
      colNode = node.right;
      litNode = node.left;
    }

    if (colNode && litNode) {
      let resolvedColType: string | undefined;
      if (colNode.tableName) {
        const col = this.symbolTable.lookupColumn(colNode.tableName, colNode.columnName);
        resolvedColType = col?.type;
      } else {
        const res = this.symbolTable.resolveUnqualifiedColumn(colNode.columnName);
        if (typeof res === 'object' && res !== null) {
          resolvedColType = res.column.type;
        }
      }

      if (resolvedColType && litNode.literalType !== 'NULL') {
        const isCompatible = this.symbolTable.isTypeCompatible(resolvedColType, litNode.literalType, node.operator);
        if (!isCompatible) {
          this.diagnostics.push({
            stage: 'SEMANTIC',
            severity: 'WARNING',
            message: `Semantic Type Warning: Comparison between ${resolvedColType} column '${colNode.columnName}' and ${litNode.literalType} literal ('${litNode.value}') may cause unexpected type coercion.`,
            line: node.line || 1,
            column: node.column || 1,
            suggestion: `Ensure operand types match: cast literal or compare with ${resolvedColType}`,
            rule: 'Type System: Coercion & domain verification',
          });
        }
      }
    }
  }
}

export function analyzeSemantics(ast: SelectStatementNode, schema: DatabaseSchema): SemanticResult {
  const analyzer = new SemanticAnalyzer(schema);
  return analyzer.analyze(ast);
}
