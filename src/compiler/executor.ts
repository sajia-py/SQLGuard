/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_DATABASE_DATA } from './database';
import {
  BinaryExprNode,
  ExecutionResult,
  ExpressionNode,
  SelectStatementNode,
} from './types';

export class QueryExecutor {
  private db: Record<string, Record<string, any>[]>;

  constructor(customData?: Record<string, Record<string, any>[]>) {
    this.db = customData ? JSON.parse(JSON.stringify(customData)) : JSON.parse(JSON.stringify(INITIAL_DATABASE_DATA));
  }

  public execute(ast: SelectStatementNode): ExecutionResult {
    const startTime = performance.now();
    const planNotes: string[] = [];

    if (!ast.fromTable) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0,
        planNotes: ['Execution skipped: No target table.'],
      };
    }

    const tableName = ast.fromTable.tableName.toLowerCase();
    const tableData = this.db[tableName] || [];
    planNotes.push(`Scanned ${tableData.length} records from persistent table '${tableName}'`);

    // Prepare working tuples with table namespace if needed
    let workingRows: Record<string, any>[] = tableData.map(row => {
      const flat: Record<string, any> = { ...row };
      for (const [k, v] of Object.entries(row)) {
        flat[`${tableName}.${k}`] = v;
        if (ast.fromTable?.alias) {
          flat[`${ast.fromTable.alias.toLowerCase()}.${k}`] = v;
        }
      }
      return flat;
    });

    // Handle Joins
    for (const join of ast.joins) {
      const joinTableName = join.table.tableName.toLowerCase();
      const rightData = this.db[joinTableName] || [];
      const joinedResult: Record<string, any>[] = [];

      for (const leftRow of workingRows) {
        let matched = false;
        for (const rightRow of rightData) {
          const combinedRow: Record<string, any> = { ...leftRow };
          for (const [k, v] of Object.entries(rightRow)) {
            combinedRow[`${joinTableName}.${k}`] = v;
            combinedRow[k] = v; // unqualified fallback
            if (join.table.alias) {
              combinedRow[`${join.table.alias.toLowerCase()}.${k}`] = v;
            }
          }

          if (this.evaluateCondition(join.onCondition, combinedRow)) {
            joinedResult.push(combinedRow);
            matched = true;
          }
        }

        if (!matched && join.joinType === 'LEFT') {
          const nullRow: Record<string, any> = { ...leftRow };
          joinedResult.push(nullRow);
        }
      }

      workingRows = joinedResult;
      planNotes.push(`Performed ${join.joinType} Join with '${joinTableName}': ${workingRows.length} combined tuples`);
    }

    // Handle WHERE filter
    if (ast.where) {
      const initialCount = workingRows.length;
      workingRows = workingRows.filter(row => this.evaluateCondition(ast.where!.condition, row));
      planNotes.push(`Filtered stream via selection predicate: ${workingRows.length} of ${initialCount} tuples retained`);
    }

    // Handle ORDER BY
    if (ast.orderBy) {
      const orderCol = ast.orderBy.sortColumn.columnName;
      const orderTable = ast.orderBy.sortColumn.tableName?.toLowerCase();
      const dirMultiplier = ast.orderBy.direction === 'DESC' ? -1 : 1;

      workingRows.sort((a, b) => {
        let valA = orderTable ? a[`${orderTable}.${orderCol}`] ?? a[orderCol] : a[orderCol];
        let valB = orderTable ? b[`${orderTable}.${orderCol}`] ?? b[orderCol] : b[orderCol];

        if (valA === undefined) valA = '';
        if (valB === undefined) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dirMultiplier;
        }
        return String(valA).localeCompare(String(valB)) * dirMultiplier;
      });
      planNotes.push(`Ordered tuples by '${orderCol}' ${ast.orderBy.direction}`);
    }

    // Handle OFFSET & LIMIT
    if (ast.limit) {
      const offset = ast.limit.offset || 0;
      workingRows = workingRows.slice(offset, offset + ast.limit.limit);
      planNotes.push(`Applied LIMIT ${ast.limit.limit}${offset ? ` with OFFSET ${offset}` : ''}`);
    }

    // Handle Projection
    const hasWildcard = ast.projections.some(p => p.isWildcard);
    let finalColumns: string[] = [];
    let finalRows: Record<string, any>[] = [];

    if (hasWildcard) {
      // Return the natural columns of the base table
      const sample = tableData[0] || {};
      finalColumns = Object.keys(sample);
      finalRows = workingRows.map(row => {
        const projected: Record<string, any> = {};
        for (const col of finalColumns) {
          projected[col] = row[col];
        }
        return projected;
      });
    } else {
      finalColumns = ast.projections.map(p => {
        if (p.alias) return p.alias;
        if (p.expression.type === 'ColumnRef') return p.expression.columnName;
        return 'expression';
      });

      finalRows = workingRows.map(row => {
        const projected: Record<string, any> = {};
        for (let i = 0; i < ast.projections.length; i++) {
          const p = ast.projections[i];
          const colName = finalColumns[i];
          projected[colName] = this.evaluateExpression(p.expression, row);
        }
        return projected;
      });
    }

    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
    planNotes.push(`Execution completed in ${elapsed}ms. Returning ${finalRows.length} rows.`);

    return {
      columns: finalColumns,
      rows: finalRows,
      rowCount: finalRows.length,
      executionTimeMs: elapsed,
      planNotes,
    };
  }

  private evaluateCondition(node: ExpressionNode, row: Record<string, any>): boolean {
    const val = this.evaluateExpression(node, row);
    return Boolean(val);
  }

  private evaluateExpression(node: ExpressionNode, row: Record<string, any>): any {
    if (node.type === 'Literal') {
      return node.value;
    }

    if (node.type === 'ColumnRef') {
      const col = node.columnName;
      if (node.tableName) {
        const key = `${node.tableName.toLowerCase()}.${col}`;
        return row[key] ?? row[col];
      }
      return row[col];
    }

    if (node.type === 'BinaryExpr') {
      const leftVal = this.evaluateExpression(node.left, row);
      const rightVal = this.evaluateExpression(node.right, row);

      switch (node.operator.toUpperCase()) {
        case '=':
          // loose equality for numbers & strings
          return leftVal == rightVal;
        case '!=':
        case '<>':
          return leftVal != rightVal;
        case '>':
          return Number(leftVal) > Number(rightVal);
        case '<':
          return Number(leftVal) < Number(rightVal);
        case '>=':
          return Number(leftVal) >= Number(rightVal);
        case '<=':
          return Number(leftVal) <= Number(rightVal);
        case 'AND':
          return Boolean(leftVal) && Boolean(rightVal);
        case 'OR':
          return Boolean(leftVal) || Boolean(rightVal);
        case 'LIKE': {
          if (typeof leftVal !== 'string' || typeof rightVal !== 'string') return false;
          // Simple SQL LIKE pattern matching (% -> .*)
          const pattern = '^' + rightVal.replace(/%/g, '.*').replace(/_/g, '.') + '$';
          const regex = new RegExp(pattern, 'i');
          return regex.test(leftVal);
        }
        case '+':
          return Number(leftVal) + Number(rightVal);
        case '-':
          return Number(leftVal) - Number(rightVal);
        case '*':
          return Number(leftVal) * Number(rightVal);
        case '/':
          return Number(leftVal) / Number(rightVal);
        default:
          return false;
      }
    }

    return null;
  }
}

export function executeQuery(ast: SelectStatementNode): ExecutionResult {
  const executor = new QueryExecutor();
  return executor.execute(ast);
}
