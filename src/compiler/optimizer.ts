/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { exprToString } from './ir';
import {
  BinaryExprNode,
  ExpressionNode,
  OptimizationStep,
  RelationalAlgebraNode,
  SelectStatementNode,
  TACInstruction,
  ThreeAddressCode,
} from './types';

export function optimizeQuery(
  ast: SelectStatementNode,
  initialIR: RelationalAlgebraNode
): {
  optimizedAst: SelectStatementNode;
  optimizedIR: RelationalAlgebraNode;
  optimizedTAC: ThreeAddressCode;
  steps: OptimizationStep[];
} {
  const steps: OptimizationStep[] = [];
  const clonedAst: SelectStatementNode = JSON.parse(JSON.stringify(ast));

  // Optimization 1: Tautology Elimination & Constant Folding
  if (clonedAst.where) {
    const originalCondStr = exprToString(clonedAst.where.condition);
    const simplifiedCondition = simplifyCondition(clonedAst.where.condition);

    if (simplifiedCondition === null) {
      // Invariant true (e.g. WHERE 1=1) -> eliminate WHERE clause completely
      delete clonedAst.where;
      steps.push({
        ruleName: 'Tautology Elimination (Dead Predicate Pruning)',
        category: 'TAUTOLOGY_SIMPLIFICATION',
        description: 'Eliminated invariant true condition (1 = 1) from WHERE clause. Table can be scanned without row-by-row boolean evaluation.',
        before: `WHERE ${originalCondStr}`,
        after: '/* WHERE clause removed */',
        costImpact: '-20 Cost Units (Zero conditional evaluation overhead)',
      });
    } else if (exprToString(simplifiedCondition) !== originalCondStr) {
      clonedAst.where.condition = simplifiedCondition;
      steps.push({
        ruleName: 'Boolean Constant Folding & Simplification',
        category: 'CONSTANT_FOLDING',
        description: 'Folded redundant tautological conjunction (AND 1=1) into pure relational expression.',
        before: originalCondStr,
        after: exprToString(simplifiedCondition),
        costImpact: '-10 Cost Units (Fewer AST expression node visits per tuple)',
      });
    }
  }

  // Optimization 2: Predicate Pushdown (Filter Pushdown)
  // In relational algebra, push Filter (σ) directly above the Table Scan
  // before sorting (τ) or full-table projections (π)
  if (clonedAst.where && clonedAst.orderBy) {
    steps.push({
      ruleName: 'Predicate Pushdown (Filter Before Sort)',
      category: 'PREDICATE_PUSHDOWN',
      description: 'Pushed selection predicate σ ahead of sort operator τ. Sorter processes pre-filtered subset instead of full table volume.',
      before: 'Sort( FullTable ) -> Filter( SortedStream )',
      after: 'Filter( TableScan ) -> Sort( FilteredStream )',
      costImpact: '-35 Cost Units (Reduces sorting time complexity from O(N log N) to O(K log K) where K << N)',
    });
  }

  // Optimization 3: Projection Column Pruning
  const hasWildcard = clonedAst.projections.some(p => p.isWildcard);
  if (!hasWildcard && clonedAst.projections.length > 0) {
    const projectedNames = clonedAst.projections
      .map(p => (p.expression.type === 'ColumnRef' ? p.expression.columnName : 'expr'))
      .join(', ');

    steps.push({
      ruleName: 'Projection Pruning (Column Projection Pushdown)',
      category: 'PROJECTION_PRUNING',
      description: `Restricted row-scan memory buffer to only requested columns [${projectedNames}], avoiding loading unused attributes into cache.`,
      before: `Scan(All Columns) -> Project([${projectedNames}])`,
      after: `Scan([${projectedNames}]) -> Pipeline`,
      costImpact: '-15 Cost Units (Minimizes memory footprint and I/O bus saturation)',
    });
  }

  // Build the optimized Relational Algebra tree
  const optimizedIR = buildOptimizedIR(clonedAst, steps);
  const optimizedTAC = generateOptimizedTAC(optimizedIR);

  return {
    optimizedAst: clonedAst,
    optimizedIR,
    optimizedTAC,
    steps,
  };
}

function simplifyCondition(node: ExpressionNode): ExpressionNode | null {
  // If node is 1 = 1, return null (meaning always true)
  if (isTautology(node)) {
    return null;
  }

  if (node.type === 'BinaryExpr') {
    if (node.operator === 'AND') {
      const leftSimplified = simplifyCondition(node.left);
      const rightSimplified = simplifyCondition(node.right);

      if (leftSimplified === null && rightSimplified === null) {
        return null;
      }
      if (leftSimplified === null) {
        return rightSimplified;
      }
      if (rightSimplified === null) {
        return leftSimplified;
      }

      return {
        ...node,
        left: leftSimplified,
        right: rightSimplified,
      };
    }
  }

  return node;
}

function isTautology(node: ExpressionNode): boolean {
  if (node.type === 'BinaryExpr' && node.operator === '=') {
    if (node.left.type === 'Literal' && node.right.type === 'Literal') {
      return node.left.value === node.right.value;
    }
  }
  if (node.type === 'Literal' && node.literalType === 'BOOLEAN' && node.value === true) {
    return true;
  }
  return false;
}

function buildOptimizedIR(ast: SelectStatementNode, steps: OptimizationStep[]): RelationalAlgebraNode {
  let counter = 1;
  const nextId = (p: string) => `opt_${p}_${counter++}`;

  const tableName = ast.fromTable ? ast.fromTable.tableName : 'UNKNOWN';
  let current: RelationalAlgebraNode = {
    id: nextId('scan'),
    op: 'SCAN',
    symbol: 'Scan',
    description: `Optimized Table Scan on '${tableName}'`,
    parameters: { table: tableName },
    children: [],
    estimatedCost: 60,
    estimatedCardinality: 100,
  };

  // Filter pushed directly onto scan
  if (ast.where) {
    const condStr = exprToString(ast.where.condition);
    current = {
      id: nextId('filter'),
      op: 'FILTER',
      symbol: 'σ',
      description: `Early Selection Filter (${condStr})`,
      parameters: { condition: condStr },
      children: [current],
      estimatedCost: current.estimatedCost + 10,
      estimatedCardinality: 25,
    };
  }

  // Sort happens on the already filtered subset
  if (ast.orderBy) {
    const colStr = ast.orderBy.sortColumn.tableName
      ? `${ast.orderBy.sortColumn.tableName}.${ast.orderBy.sortColumn.columnName}`
      : ast.orderBy.sortColumn.columnName;
    current = {
      id: nextId('sort'),
      op: 'SORT',
      symbol: 'τ',
      description: `Sort filtered tuples by '${colStr}' ${ast.orderBy.direction}`,
      parameters: { column: colStr, direction: ast.orderBy.direction },
      children: [current],
      estimatedCost: current.estimatedCost + 15,
      estimatedCardinality: current.estimatedCardinality,
    };
  }

  if (ast.limit) {
    current = {
      id: nextId('limit'),
      op: 'LIMIT',
      symbol: 'λ',
      description: `Limit stream to top ${ast.limit.limit}`,
      parameters: { limit: ast.limit.limit },
      children: [current],
      estimatedCost: current.estimatedCost + 2,
      estimatedCardinality: Math.min(current.estimatedCardinality, ast.limit.limit),
    };
  }

  const projCols = ast.projections.map(p => {
    if (p.isWildcard) return '*';
    const base = exprToString(p.expression);
    return p.alias ? `${base} AS ${p.alias}` : base;
  });

  current = {
    id: nextId('project'),
    op: 'PROJECT',
    symbol: 'π',
    description: `Project attributes [${projCols.join(', ')}]`,
    parameters: { columns: projCols },
    children: [current],
    estimatedCost: current.estimatedCost + 5,
    estimatedCardinality: current.estimatedCardinality,
  };

  return current;
}

function generateOptimizedTAC(root: RelationalAlgebraNode): ThreeAddressCode {
  const instructions: TACInstruction[] = [];
  let tempCounter = 1;

  function walk(node: RelationalAlgebraNode): string {
    const childrenTemps = node.children.map(c => walk(c));
    const resultVar = `t${tempCounter++}`;

    switch (node.op) {
      case 'SCAN': {
        instructions.push({
          id: `opt_tac_${tempCounter}`,
          instruction: `${resultVar} = OPTIMIZED_SCAN ${node.parameters.table}`,
          op: 'SCAN',
          arg1: node.parameters.table,
          result: resultVar,
          description: `Direct pruned scan on relation '${node.parameters.table}'`,
        });
        break;
      }
      case 'FILTER': {
        const src = childrenTemps[0];
        instructions.push({
          id: `opt_tac_${tempCounter}`,
          instruction: `${resultVar} = PUSHDOWN_FILTER ${src} WHERE (${node.parameters.condition})`,
          op: 'FILTER',
          arg1: src,
          arg2: node.parameters.condition,
          result: resultVar,
          description: `Evaluate predicate early on scan buffer`,
        });
        break;
      }
      case 'SORT': {
        const src = childrenTemps[0];
        instructions.push({
          id: `opt_tac_${tempCounter}`,
          instruction: `${resultVar} = SORT ${src} BY ${node.parameters.column} ${node.parameters.direction}`,
          op: 'SORT',
          arg1: src,
          arg2: `${node.parameters.column} ${node.parameters.direction}`,
          result: resultVar,
          description: `Fast sort on small filtered buffer`,
        });
        break;
      }
      case 'LIMIT': {
        const src = childrenTemps[0];
        instructions.push({
          id: `opt_tac_${tempCounter}`,
          instruction: `${resultVar} = LIMIT ${src} TO ${node.parameters.limit}`,
          op: 'LIMIT',
          arg1: src,
          arg2: String(node.parameters.limit),
          result: resultVar,
          description: `Early stream truncation`,
        });
        break;
      }
      case 'PROJECT': {
        const src = childrenTemps[0];
        const cols = (node.parameters.columns as string[]).join(', ');
        instructions.push({
          id: `opt_tac_${tempCounter}`,
          instruction: `${resultVar} = PROJECT ${src} [${cols}]`,
          op: 'PROJECT',
          arg1: src,
          arg2: cols,
          result: resultVar,
          description: `Extract requested columns for final pipeline result`,
        });
        break;
      }
    }
    return resultVar;
  }

  const finalVar = walk(root);
  instructions.push({
    id: `opt_tac_${tempCounter}`,
    instruction: `RETURN ${finalVar}`,
    op: 'RETURN',
    arg1: finalVar,
    result: 'CLIENT_OUTPUT',
    description: `Emit stream to client`,
  });

  return { instructions };
}
