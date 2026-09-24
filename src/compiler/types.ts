/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'OPERATOR'
  | 'PUNCTUATION'
  | 'COMMENT'
  | 'EOF'
  | 'UNKNOWN';

export interface Token {
  id: number;
  type: TokenType;
  value: string;
  raw: string;
  line: number;
  column: number;
  length: number;
}

export type ASTNodeType =
  | 'SelectStatement'
  | 'ProjectionItem'
  | 'TableRef'
  | 'JoinClause'
  | 'WhereClause'
  | 'BinaryExpr'
  | 'UnaryExpr'
  | 'ColumnRef'
  | 'Literal'
  | 'OrderByClause'
  | 'LimitClause';

export interface BaseASTNode {
  type: ASTNodeType;
  line?: number;
  column?: number;
}

export interface LiteralNode extends BaseASTNode {
  type: 'Literal';
  value: string | number | boolean | null;
  literalType: 'NUMBER' | 'STRING' | 'BOOLEAN' | 'NULL';
}

export interface ColumnRefNode extends BaseASTNode {
  type: 'ColumnRef';
  columnName: string;
  tableName?: string;
}

export interface UnaryExprNode extends BaseASTNode {
  type: 'UnaryExpr';
  operator: string;
  operand: ExpressionNode;
}

export interface BinaryExprNode extends BaseASTNode {
  type: 'BinaryExpr';
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

export type ExpressionNode = BinaryExprNode | UnaryExprNode | ColumnRefNode | LiteralNode;

export interface ProjectionItemNode extends BaseASTNode {
  type: 'ProjectionItem';
  expression: ExpressionNode;
  alias?: string;
  isWildcard?: boolean;
}

export interface TableRefNode extends BaseASTNode {
  type: 'TableRef';
  tableName: string;
  alias?: string;
}

export interface JoinClauseNode extends BaseASTNode {
  type: 'JoinClause';
  joinType: 'INNER' | 'LEFT' | 'RIGHT';
  table: TableRefNode;
  onCondition: BinaryExprNode;
}

export interface WhereClauseNode extends BaseASTNode {
  type: 'WhereClause';
  condition: ExpressionNode;
}

export interface OrderByClauseNode extends BaseASTNode {
  type: 'OrderByClause';
  sortColumn: ColumnRefNode;
  direction: 'ASC' | 'DESC';
}

export interface LimitClauseNode extends BaseASTNode {
  type: 'LimitClause';
  limit: number;
  offset?: number;
}

export interface SelectStatementNode extends BaseASTNode {
  type: 'SelectStatement';
  projections: ProjectionItemNode[];
  fromTable?: TableRefNode;
  joins: JoinClauseNode[];
  where?: WhereClauseNode;
  orderBy?: OrderByClauseNode;
  limit?: LimitClauseNode;
  rawSql: string;
}

export type ASTNode =
  | SelectStatementNode
  | ProjectionItemNode
  | TableRefNode
  | JoinClauseNode
  | WhereClauseNode
  | ExpressionNode
  | OrderByClauseNode
  | LimitClauseNode;

export interface ColumnSchema {
  name: string;
  type: 'INTEGER' | 'REAL' | 'TEXT' | 'BOOLEAN' | 'DATE';
  primaryKey?: boolean;
  nullable?: boolean;
  description?: string;
}

export interface TableSchema {
  name: string;
  description: string;
  columns: ColumnSchema[];
}

export interface DatabaseSchema {
  tables: Record<string, TableSchema>;
}

export interface Diagnostic {
  stage: 'LEXER' | 'PARSER' | 'SEMANTIC' | 'SECURITY';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  line: number;
  column: number;
  length?: number;
  suggestion?: string;
  rule?: string;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  patternFound: string;
  cwe: string;
  riskExplanation: string;
  remediation: string;
  line?: number;
  column?: number;
}

export interface SecurityReport {
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  score: number; // 0 to 100
  issues: SecurityVulnerability[];
  safeAlternativeQuery?: string;
  explanation: string;
}

export type RelationalOpType = 'PROJECT' | 'FILTER' | 'SCAN' | 'JOIN' | 'SORT' | 'LIMIT';

export interface RelationalAlgebraNode {
  id: string;
  op: RelationalOpType;
  symbol: string; // e.g. π, σ, ⨝, τ, λ
  description: string;
  parameters: Record<string, any>;
  children: RelationalAlgebraNode[];
  estimatedCost: number;
  estimatedCardinality: number;
}

export interface TACInstruction {
  id: string;
  instruction: string;
  op: string;
  arg1?: string;
  arg2?: string;
  result: string;
  description: string;
}

export interface ThreeAddressCode {
  instructions: TACInstruction[];
}

export interface OptimizationStep {
  ruleName: string;
  category: 'PREDICATE_PUSHDOWN' | 'CONSTANT_FOLDING' | 'PROJECTION_PRUNING' | 'TAUTOLOGY_SIMPLIFICATION' | 'CONTRADICTION_ELIMINATION';
  description: string;
  before: string;
  after: string;
  costImpact: string;
}

export interface ExecutionResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  planNotes: string[];
}

export interface PipelineResult {
  sql: string;
  tokens: Token[];
  ast: SelectStatementNode | null;
  diagnostics: Diagnostic[];
  hasLexerError: boolean;
  hasParserError: boolean;
  hasSemanticError: boolean;
  securityReport: SecurityReport;
  irTree: RelationalAlgebraNode | null;
  threeAddressCode: ThreeAddressCode | null;
  optimizedIRTree: RelationalAlgebraNode | null;
  optimizedTAC: ThreeAddressCode | null;
  optimizationSteps: OptimizationStep[];
  executionResult: ExecutionResult | null;
}
