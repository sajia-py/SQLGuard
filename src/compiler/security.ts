/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BinaryExprNode,
  ExpressionNode,
  SecurityReport,
  SecurityVulnerability,
  SelectStatementNode,
  Token,
} from './types';

export class SecurityAnalyzer {
  private tokens: Token[];
  private ast: SelectStatementNode | null;
  private rawSql: string;
  private vulnerabilities: SecurityVulnerability[] = [];

  constructor(tokens: Token[], ast: SelectStatementNode | null, rawSql: string) {
    this.tokens = tokens;
    this.ast = ast;
    this.rawSql = rawSql;
  }

  public analyze(): SecurityReport {
    // 1. Tautology Detection (AST & Pattern-based)
    this.checkTautology();

    // 2. UNION-based SQL Injection
    this.checkUnionInjection();

    // 3. Piggybacked / Stacked Queries
    this.checkStackedQueries();

    // 4. Destructive DDL / DML keywords in query
    this.checkDestructiveStatements();

    // 5. Comment Evasion Detection (-- or /* */ at tail)
    this.checkCommentTruncation();

    // 6. Sensitive Data Wildcard Exfiltration
    this.checkWildcardSensitiveExfiltration();

    // Calculate Risk Score (100 = safe, 0 = critical risk)
    let score = 100;
    for (const vuln of this.vulnerabilities) {
      if (vuln.severity === 'CRITICAL') score -= 40;
      else if (vuln.severity === 'HIGH') score -= 25;
      else if (vuln.severity === 'MEDIUM') score -= 15;
      else if (vuln.severity === 'LOW') score -= 5;
    }
    score = Math.max(0, Math.min(100, score));

    const status: 'SAFE' | 'WARNING' | 'CRITICAL' =
      score < 50 ? 'CRITICAL' : score < 85 ? 'WARNING' : 'SAFE';

    const safeAlternativeQuery = this.generateSafeAlternative();

    let explanation = 'No critical security vulnerabilities detected. Query adheres to standard read semantics.';
    if (this.vulnerabilities.length > 0) {
      explanation = `Detected ${this.vulnerabilities.length} potential security threat(s). The query shows signatures commonly associated with SQL injection attempts or insecure data retrieval patterns.`;
    }

    return {
      status,
      score,
      issues: this.vulnerabilities,
      safeAlternativeQuery,
      explanation,
    };
  }

  private checkTautology(): void {
    // AST Walk for Tautological conditions (e.g. OR 1=1, OR 'a'='a')
    if (this.ast && this.ast.where) {
      this.inspectConditionForTautology(this.ast.where.condition);
    }

    // Regex fallback for text patterns like '1'='1' or 1=1 or 'x'='x'
    const tautologyRegexes = [
      /\bOR\s+['"]?([a-zA-Z0-9_-]+)['"]?\s*=\s*['"]?\1['"]?/i,
      /\bOR\s+1\s*=\s*1\b/i,
      /\bOR\s+0\s*=\s*0\b/i,
      /\bOR\s+true\b/i,
      /\bWHERE\s+['"]?([a-zA-Z0-9_-]+)['"]?\s*=\s*['"]?\1['"]?/i,
    ];

    for (const regex of tautologyRegexes) {
      const match = this.rawSql.match(regex);
      if (match) {
        // avoid duplicate if already caught by AST
        if (!this.vulnerabilities.some(v => v.id === 'SQLI_TAUTOLOGY')) {
          this.vulnerabilities.push({
            id: 'SQLI_TAUTOLOGY',
            severity: 'CRITICAL',
            title: 'Tautology-Based SQL Injection (Always-True Condition)',
            description: `Query contains an always-true boolean tautology pattern ('${match[0]}') that forces conditional evaluations to evaluate as TRUE across all rows.`,
            patternFound: match[0],
            cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
            riskExplanation: 'Attackers commonly append tautologies (e.g., OR 1=1 or OR \'1\'=\'1\') to bypass authentication checks, dump confidential database tables, or bypass permission boundaries.',
            remediation: 'Use parameterized queries (Prepared Statements) with bind parameters instead of string concatenation. Example: WHERE id = ? or WHERE username = ?',
          });
        }
      }
    }
  }

  private inspectConditionForTautology(node: ExpressionNode): void {
    if (node.type === 'BinaryExpr') {
      if (node.operator === 'OR') {
        if (this.isConstantTautology(node.right) || this.isConstantTautology(node.left)) {
          if (!this.vulnerabilities.some(v => v.id === 'SQLI_TAUTOLOGY')) {
            this.vulnerabilities.push({
              id: 'SQLI_TAUTOLOGY',
              severity: 'CRITICAL',
              title: 'Tautology Expression in AST Condition',
              description: 'An OR condition evaluates to an invariant constant truth (e.g., 1 = 1 or identical literals).',
              patternFound: `${this.exprToString(node.left)} ${node.operator} ${this.exprToString(node.right)}`,
              cwe: 'CWE-89',
              riskExplanation: 'Forces the entire WHERE clause to evaluate to true for every single row in the database, negating authorization filters.',
              remediation: 'Remove invariant literal comparisons. Always bind dynamic user inputs as query parameters.',
            });
          }
        }
      }
      this.inspectConditionForTautology(node.left);
      this.inspectConditionForTautology(node.right);
    }
  }

  private isConstantTautology(node: ExpressionNode): boolean {
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

  private checkUnionInjection(): void {
    const unionRegex = /\bUNION\s+(ALL\s+)?SELECT\b/i;
    const match = this.rawSql.match(unionRegex);
    if (match) {
      this.vulnerabilities.push({
        id: 'SQLI_UNION',
        severity: 'CRITICAL',
        title: 'UNION-Based SQL Injection Attempt',
        description: `Encountered '${match[0]}'. UNION queries allow attackers to append the results of an arbitrary SELECT statement to the original query.`,
        patternFound: match[0],
        cwe: 'CWE-89: SQL Injection (UNION query)',
        riskExplanation: 'Allows unauthorized extraction of records from arbitrary tables (such as passwords, credit cards, or administrative accounts).',
        remediation: 'Do not concatenate unsanitized user inputs into SQL strings. Use prepared statements or an Object-Relational Mapper (ORM).',
      });
    }
  }

  private checkStackedQueries(): void {
    // Semicolon followed by additional command tokens
    const stackedRegex = /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|CREATE)\b/i;
    const match = this.rawSql.match(stackedRegex);
    if (match) {
      this.vulnerabilities.push({
        id: 'SQLI_STACKED_QUERIES',
        severity: 'CRITICAL',
        title: 'Stacked / Piggybacked Query Injection',
        description: `Encountered statement delimiter followed by secondary command '${match[1]}'.`,
        patternFound: match[0],
        cwe: 'CWE-89: Stacked Queries Execution',
        riskExplanation: 'Allows attackers to terminate the legitimate query and execute malicious secondary queries, such as modifying schema or deleting records.',
        remediation: 'Disable multi-statement execution in database connection settings and enforce parameterized parameter binding.',
      });
    }
  }

  private checkDestructiveStatements(): void {
    const destructiveRegex = /\b(DROP\s+TABLE|TRUNCATE\s+TABLE|ALTER\s+TABLE)\b/i;
    const match = this.rawSql.match(destructiveRegex);
    if (match) {
      this.vulnerabilities.push({
        id: 'DESTRUCTIVE_DDL',
        severity: 'CRITICAL',
        title: 'Destructive DDL Command in Query',
        description: `Found destructive DDL statement '${match[0]}'.`,
        patternFound: match[0],
        cwe: 'CWE-284: Improper Access Control / Privilege Escalation',
        riskExplanation: 'Direct execution of table drops or modifications destroys database integrity and deletes schema definitions.',
        remediation: 'Restrict database user permissions using Principle of Least Privilege (GRANT SELECT ONLY).',
      });
    }
  }

  private checkCommentTruncation(): void {
    const comments = this.tokens.filter(t => t.type === 'COMMENT');
    for (const comment of comments) {
      if (comment.value.startsWith('--') || comment.value.startsWith('/*')) {
        this.vulnerabilities.push({
          id: 'SQLI_COMMENT_TRUNCATION',
          severity: 'HIGH',
          title: 'SQL Comment Injected (Tail Truncation)',
          description: `Detected inline SQL comment '${comment.value.trim()}'.`,
          patternFound: comment.value,
          cwe: 'CWE-89: Comment-based Query Neutralization',
          riskExplanation: 'Attackers inject comments (-- or /* */) to terminate and ignore the remaining syntax of the developer-crafted query.',
          remediation: 'Strip or encode comment markers from input and use bound parameters.',
          line: comment.line,
          column: comment.column,
        });
      }
    }
  }

  private checkWildcardSensitiveExfiltration(): void {
    if (this.ast && this.ast.fromTable) {
      const tableName = this.ast.fromTable.tableName.toLowerCase();
      const hasWildcard = this.ast.projections.some(p => p.isWildcard);

      if (tableName === 'users' && hasWildcard && !this.ast.limit) {
        this.vulnerabilities.push({
          id: 'WILDCARD_SENSITIVE_LEAK',
          severity: 'MEDIUM',
          title: 'Sensitive Table Wildcard Exfiltration (SELECT *)',
          description: "Using 'SELECT *' on sensitive authentication table 'users' without a LIMIT clause.",
          patternFound: 'SELECT * FROM users',
          cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
          riskExplanation: 'Dumps all user credential hashes and metadata across the entire database table.',
          remediation: 'Explicitly project only public non-sensitive columns (e.g. id, username) and enforce pagination with LIMIT.',
        });
      }
    }
  }

  private generateSafeAlternative(): string {
    if (!this.ast || !this.ast.fromTable) {
      return '-- Ensure parameterized execution via Prepared Statements:\n-- SELECT * FROM table WHERE column = ?';
    }

    const projStr = this.ast.projections
      .map(p => {
        if (p.isWildcard) return '*';
        return p.alias ? `${this.exprToString(p.expression)} AS ${p.alias}` : this.exprToString(p.expression);
      })
      .join(', ');

    let safe = `SELECT ${projStr}\nFROM ${this.ast.fromTable.tableName}`;

    if (this.ast.where) {
      const sanitizedWhere = this.parameterizeCondition(this.ast.where.condition);
      safe += `\nWHERE ${sanitizedWhere.sqlCondition};\n\n-- Parameter Bindings (Prepared Statement):\n-- Parameters: ${JSON.stringify(sanitizedWhere.params)}`;
    } else {
      safe += ';';
    }

    return safe;
  }

  private parameterizeCondition(node: ExpressionNode): { sqlCondition: string; params: any[] } {
    const params: any[] = [];

    const walk = (n: ExpressionNode): string => {
      if (n.type === 'BinaryExpr') {
        // If right side is tautological or literal, bind it as ?
        if (n.right.type === 'Literal') {
          params.push(n.right.value);
          return `${walk(n.left)} ${n.operator} ?`;
        }
        return `${walk(n.left)} ${n.operator} ${walk(n.right)}`;
      }
      if (n.type === 'ColumnRef') {
        return n.tableName ? `${n.tableName}.${n.columnName}` : n.columnName;
      }
      if (n.type === 'Literal') {
        params.push(n.value);
        return '?';
      }
      return '';
    };

    const sqlCondition = walk(node);
    return { sqlCondition, params };
  }

  private exprToString(node: ExpressionNode): string {
    if (node.type === 'ColumnRef') {
      return node.tableName ? `${node.tableName}.${node.columnName}` : node.columnName;
    }
    if (node.type === 'Literal') {
      return typeof node.value === 'string' ? `'${node.value}'` : String(node.value);
    }
    if (node.type === 'BinaryExpr') {
      return `${this.exprToString(node.left)} ${node.operator} ${this.exprToString(node.right)}`;
    }
    if (node.type === 'UnaryExpr') {
      return `${node.operator} ${this.exprToString(node.operand)}`;
    }
    return '';
  }
}

export function analyzeSecurity(tokens: Token[], ast: SelectStatementNode | null, sql: string): SecurityReport {
  const analyzer = new SecurityAnalyzer(tokens, ast, sql);
  return analyzer.analyze();
}
