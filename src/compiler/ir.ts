/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExpressionNode,
  RelationalAlgebraNode,
  SelectStatementNode,
  TACInstruction,
  ThreeAddressCode,
} from './types';

export function generateIntermediateRepresentation(ast: SelectStatementNode): {
  irTree: RelationalAlgebraNode;
  threeAddressCode: ThreeAddressCode;
} {
  let nodeIdCounter = 1;
  const nextId = (prefix: string) => `${prefix}_${nodeIdCounter++}`;

  // 1. Build Base Scan Node
  const tableName = ast.fromTable ? ast.fromTable.tableName : 'UNKNOWN_RELATION';
  let currentNode: RelationalAlgebraNode = {
    id: nextId('scan'),
    op: 'SCAN',
    symbol: 'Scan',
    description: `Full Table Scan on relation '${tableName}'`,
    parameters: { table: tableName, alias: ast.fromTable?.alias },
    children: [],
    estimatedCost: 100,
    estimatedCardinality: 100,
  };

  // 2. Joins
  for (const join of ast.joins) {
    const rightScan: RelationalAlgebraNode = {
      id: nextId('scan'),
      op: 'SCAN',
      symbol: 'Scan',
      description: `Full Table Scan on relation '${join.table.tableName}'`,
      parameters: { table: join.table.tableName, alias: join.table.alias },
      children: [],
      estimatedCost: 80,
      estimatedCardinality: 80,
    };

    currentNode = {
      id: nextId('join'),
      op: 'JOIN',
      symbol: '⨝',
      description: `${join.joinType} Join on condition: ${exprToString(join.onCondition)}`,
      parameters: {
        joinType: join.joinType,
        condition: exprToString(join.onCondition),
      },
      children: [currentNode, rightScan],
      estimatedCost: currentNode.estimatedCost + rightScan.estimatedCost + 50,
      estimatedCardinality: Math.floor(currentNode.estimatedCardinality * 0.8),
    };
  }

  // 3. Selection / Filter (WHERE)
  if (ast.where) {
    const filterCond = exprToString(ast.where.condition);
    currentNode = {
      id: nextId('filter'),
      op: 'FILTER',
      symbol: 'σ',
      description: `Filter selection where (${filterCond})`,
      parameters: { condition: filterCond, astCondition: ast.where.condition },
      children: [currentNode],
      estimatedCost: currentNode.estimatedCost + 20,
      estimatedCardinality: Math.max(1, Math.floor(currentNode.estimatedCardinality * 0.3)),
    };
  }

  // 4. Sort (ORDER BY)
  if (ast.orderBy) {
    const orderCol = ast.orderBy.sortColumn.tableName
      ? `${ast.orderBy.sortColumn.tableName}.${ast.orderBy.sortColumn.columnName}`
      : ast.orderBy.sortColumn.columnName;

    currentNode = {
      id: nextId('sort'),
      op: 'SORT',
      symbol: 'τ',
      description: `Sort relation by '${orderCol}' in ${ast.orderBy.direction} order`,
      parameters: { column: orderCol, direction: ast.orderBy.direction },
      children: [currentNode],
      estimatedCost: currentNode.estimatedCost + 40,
      estimatedCardinality: currentNode.estimatedCardinality,
    };
  }

  // 5. Limit (LIMIT)
  if (ast.limit) {
    currentNode = {
      id: nextId('limit'),
      op: 'LIMIT',
      symbol: 'λ',
      description: `Limit result stream to ${ast.limit.limit} tuples${
        ast.limit.offset ? ` (offset: ${ast.limit.offset})` : ''
      }`,
      parameters: { limit: ast.limit.limit, offset: ast.limit.offset },
      children: [currentNode],
      estimatedCost: currentNode.estimatedCost + 5,
      estimatedCardinality: Math.min(currentNode.estimatedCardinality, ast.limit.limit),
    };
  }

  // 6. Projection (SELECT columns)
  const projCols = ast.projections.map(p => {
    if (p.isWildcard) return '*';
    const base = exprToString(p.expression);
    return p.alias ? `${base} AS ${p.alias}` : base;
  });

  currentNode = {
    id: nextId('project'),
    op: 'PROJECT',
    symbol: 'π',
    description: `Project attributes [${projCols.join(', ')}]`,
    parameters: { columns: projCols },
    children: [currentNode],
    estimatedCost: currentNode.estimatedCost + 10,
    estimatedCardinality: currentNode.estimatedCardinality,
  };

  // Generate Linear Three-Address Code (TAC) from tree
  const tac = generateThreeAddressCode(currentNode);

  return {
    irTree: currentNode,
    threeAddressCode: tac,
  };
}

function generateThreeAddressCode(root: RelationalAlgebraNode): ThreeAddressCode {
  const instructions: TACInstruction[] = [];
  let tempVarCounter = 1;

  function walk(node: RelationalAlgebraNode): string {
    const childTemps = node.children.map(c => walk(c));
    const currentVar = `t${tempVarCounter++}`;

    switch (node.op) {
      case 'SCAN': {
        instructions.push({
          id: `tac_${tempVarCounter}`,
          instruction: `${currentVar} = SCAN ${node.parameters.table}`,
          op: 'SCAN',
          arg1: node.parameters.table,
          result: currentVar,
          description: `Read all rows from persistent relation '${node.parameters.table}'`,
        });
        break;
      }
      case 'JOIN': {
        const left = childTemps[0];
        const right = childTemps[1];
        instructions.push({
          id: `tac_${tempVarCounter}`,
          instruction: `${currentVar} = JOIN ${left}, ${right} ON (${node.parameters.condition})`,
          op: 'JOIN',
          arg1: left,
          arg2: right,
          result: currentVar,
          description: `Combine tuples from ${left} and ${right} matching condition`,
        });
        break;
      }
      case 'FILTER': {
        const src = childTemps[0];
        instructions.push({
          id: `tac_${tempVarCounter}`,
          instruction: `${currentVar} = FILTER ${src} WHERE (${node.parameters.condition})`,
          op: 'FILTER',
          arg1: src,
          arg2: node.parameters.condition,
          result: currentVar,
          description: `Filter tuple set ${src} using boolean predicate`,
        });
        break;
      }
      case 'SORT': {
        const src = childTemps[0];
        instructions.push({
          id: `tac_${tempVarCounter}`,
          instruction: `${currentVar} = SORT ${src} BY ${node.parameters.column} ${node.parameters.direction}`,
          op: 'SORT',
          arg1: src,
          arg2: `${node.parameters.column} ${node.parameters.direction}`,
          result: currentVar,
          description: `Order tuple sequence ${src} along index key`,
        });
        break;
      }
      case 'LIMIT': {
        const src = childTemps[0];
        instructions.push({
          id: `tac_${tempVarCounter}`,
          instruction: `${currentVar} = LIMIT ${src} TO ${node.parameters.limit}`,
          op: 'LIMIT',
          arg1: src,
          arg2: String(node.parameters.limit),
          result: currentVar,
          description: `Truncate stream to top ${node.parameters.limit} rows`,
        });
        break;
      }
      case 'PROJECT': {
        const src = childTemps[0];
        const cols = (node.parameters.columns as string[]).join(', ');
        instructions.push({
          id: `tac_${tempVarCounter}`,
          instruction: `${currentVar} = PROJECT ${src} [${cols}]`,
          op: 'PROJECT',
          arg1: src,
          arg2: cols,
          result: currentVar,
          description: `Filter columns and retain only requested attributes`,
        });
        break;
      }
    }

    return currentVar;
  }

  const finalVar = walk(root);
  instructions.push({
    id: `tac_${tempVarCounter}`,
    instruction: `RETURN ${finalVar}`,
    op: 'RETURN',
    arg1: finalVar,
    result: 'OUTPUT',
    description: `Send final relation stream to client buffer`,
  });

  return { instructions };
}

export function exprToString(node: ExpressionNode): string {
  if (!node) return '';
  if (node.type === 'ColumnRef') {
    return node.tableName ? `${node.tableName}.${node.columnName}` : node.columnName;
  }
  if (node.type === 'Literal') {
    return typeof node.value === 'string' ? `'${node.value}'` : String(node.value);
  }
  if (node.type === 'BinaryExpr') {
    return `${exprToString(node.left)} ${node.operator} ${exprToString(node.right)}`;
  }
  if (node.type === 'UnaryExpr') {
    return `${node.operator} ${exprToString(node.operand)}`;
  }
  return '';
}
