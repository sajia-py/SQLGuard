/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QueryPreset {
  id: string;
  category: 'VALID' | 'SYNTAX_ERROR' | 'SEMANTIC_ERROR' | 'SECURITY_ATTACK' | 'OPTIMIZATION';
  name: string;
  query: string;
  description: string;
  expectedOutcome: string;
}

export const QUERY_PRESETS: QueryPreset[] = [
  // 1. Valid Queries
  {
    id: 'valid-basic',
    category: 'VALID',
    name: 'Basic Projection & Filter',
    query: `SELECT name, cgpa\nFROM students\nWHERE cgpa > 3.0;`,
    description: 'Standard relational query projecting name and cgpa with a numeric filter.',
    expectedOutcome: 'Lexer & Parser pass, Semantic validation passes, returns students with CGPA > 3.0.',
  },
  {
    id: 'valid-and-or',
    category: 'VALID',
    name: 'Compound Boolean Condition (AND / OR)',
    query: `SELECT name, department, cgpa\nFROM students\nWHERE cgpa > 3.0 AND department = 'CS';`,
    description: 'Filter with logical AND combining numeric and textual equality predicates.',
    expectedOutcome: 'Both conditions parsed into binary AST node; filters CS students with high CGPA.',
  },
  {
    id: 'valid-order-limit',
    category: 'VALID',
    name: 'Top Students (ORDER BY & LIMIT)',
    query: `SELECT name, cgpa, department\nFROM students\nORDER BY cgpa DESC\nLIMIT 3;`,
    description: 'Ranking students by descending CGPA and taking top 3 tuples.',
    expectedOutcome: 'Generates Sort (τ) and Limit (λ) relational algebra operators.',
  },
  {
    id: 'valid-wildcard',
    category: 'VALID',
    name: 'Wildcard All Columns (SELECT *)',
    query: `SELECT *\nFROM courses\nWHERE credit_hours = 3;`,
    description: 'Selects all columns from the courses table for 3-credit courses.',
    expectedOutcome: 'Expands wildcard * to all schema attributes in execution phase.',
  },
  {
    id: 'valid-join',
    category: 'VALID',
    name: 'Relational INNER JOIN',
    query: `SELECT students.name, enrollments.semester, enrollments.grade\nFROM students\nJOIN enrollments ON students.id = enrollments.student_id;`,
    description: 'Combines students with their course enrollment records using qualified column identifiers.',
    expectedOutcome: 'Builds Join (⨝) node in AST and intermediate representation.',
  },

  // 2. Syntax Errors
  {
    id: 'syntax-missing-col',
    category: 'SYNTAX_ERROR',
    name: 'Missing Columns after SELECT',
    query: `SELECT\nFROM students;`,
    description: 'Syntax error: User skipped column specification and went straight to FROM.',
    expectedOutcome: 'Parser reports: Expected column list after SELECT, found FROM at line 2.',
  },
  {
    id: 'syntax-missing-from',
    category: 'SYNTAX_ERROR',
    name: 'Missing FROM Keyword',
    query: `SELECT name students;`,
    description: 'Syntax error: Missing FROM keyword between projected column and table name.',
    expectedOutcome: 'Parser detects unexpected identifier where FROM was expected.',
  },
  {
    id: 'syntax-unclosed-paren',
    category: 'SYNTAX_ERROR',
    name: 'Unclosed Parenthesis in WHERE',
    query: `SELECT name\nFROM students\nWHERE (cgpa > 3.0 AND age < 25;`,
    description: 'Syntax error: Opening parenthesis in expression is never closed.',
    expectedOutcome: 'Parser halts on unclosed parenthesis before semicolon.',
  },
  {
    id: 'syntax-illegal-char',
    category: 'SYNTAX_ERROR',
    name: 'Lexical Error (Illegal Symbol @)',
    query: `SELECT name, @cgpa\nFROM students;`,
    description: 'Lexer error: Encountered illegal character @ which does not conform to identifier grammar.',
    expectedOutcome: 'Lexer generates Lexical Error diagnostic at specific line/column.',
  },

  // 3. Semantic Errors
  {
    id: 'semantic-unknown-col',
    category: 'SEMANTIC_ERROR',
    name: 'Unknown Column (salary in students)',
    query: `SELECT salary\nFROM students;`,
    description: 'Semantic error: The column "salary" does not exist in the "students" schema.',
    expectedOutcome: 'Semantic analyzer checks Symbol Table and flags missing attribute with suggestions.',
  },
  {
    id: 'semantic-unknown-table',
    category: 'SEMANTIC_ERROR',
    name: 'Typo in Table Name (student)',
    query: `SELECT name\nFROM student;`,
    description: 'Semantic error: User referenced "student" instead of the registered table "students".',
    expectedOutcome: 'Symbol table lookup fails and suggests "Did you mean \'students\'?".',
  },
  {
    id: 'semantic-type-mismatch',
    category: 'SEMANTIC_ERROR',
    name: 'Type Mismatch Comparison',
    query: `SELECT name\nFROM students\nWHERE cgpa = 'A_GRADE';`,
    description: 'Type error: Comparing REAL numerical field (cgpa) with STRING literal.',
    expectedOutcome: 'Semantic analyzer flags type conflict and warns of invalid comparison coercion.',
  },
  {
    id: 'semantic-negative-limit',
    category: 'SEMANTIC_ERROR',
    name: 'Invalid Negative LIMIT',
    query: `SELECT name\nFROM students\nLIMIT -5;`,
    description: 'Semantic constraint: LIMIT tuple count cannot be negative.',
    expectedOutcome: 'Semantic analyzer catches constraint violation and advises positive integer.',
  },

  // 4. Security & SQL Injection Attacks
  {
    id: 'sec-tautology-quoted',
    category: 'SECURITY_ATTACK',
    name: "Classic Tautology: '1'='1' (Auth Bypass)",
    query: `SELECT * FROM users\nWHERE username = 'admin' OR '1'='1';`,
    description: 'Classic authentication bypass injection attempting to force WHERE clause to always evaluate true.',
    expectedOutcome: 'Flagged as CRITICAL threat (CWE-89); triggers Parameterized Query fix generator.',
  },
  {
    id: 'sec-tautology-numeric',
    category: 'SECURITY_ATTACK',
    name: 'Numeric Tautology: id = 1 OR 1=1',
    query: `SELECT * FROM users\nWHERE id = 1 OR 1=1;`,
    description: 'Numeric tautology injected into WHERE clause to dump entire database table without authorization.',
    expectedOutcome: 'Security Analyzer flags invariant truth and calculates high risk score penalty.',
  },
  {
    id: 'sec-union-attack',
    category: 'SECURITY_ATTACK',
    name: 'UNION-Based Data Exfiltration',
    query: `SELECT name, email FROM students\nUNION SELECT username, password_hash FROM users;`,
    description: 'UNION query injection attempting to siphon passwords and credentials from hidden auth tables.',
    expectedOutcome: 'Security Analyzer identifies UNION keyword and warns of cross-table credential leakage.',
  },
  {
    id: 'sec-stacked-drop',
    category: 'SECURITY_ATTACK',
    name: 'Stacked Query: Piggybacked DROP TABLE',
    query: `SELECT name FROM students;\nDROP TABLE students;`,
    description: 'Piggybacked query executing a destructive DROP TABLE command after the initial SELECT statement.',
    expectedOutcome: 'Flagged as CRITICAL: Multi-statement injection attempting schema destruction.',
  },
  {
    id: 'sec-comment-truncation',
    category: 'SECURITY_ATTACK',
    name: 'Comment Evasion & Tail Truncation',
    query: `SELECT * FROM users WHERE username = 'admin' -- AND password = 'xxx'`,
    description: 'SQL comment injection (--) used to eliminate remaining password authentication logic.',
    expectedOutcome: 'Security Analyzer highlights comment token used for query structure truncation.',
  },

  // 5. Query Optimization
  {
    id: 'opt-dead-predicate',
    category: 'OPTIMIZATION',
    name: 'Tautology Simplification (WHERE 1=1)',
    query: `SELECT name, cgpa\nFROM students\nWHERE 1 = 1 AND cgpa > 3.0;`,
    description: 'Optimizer eliminates the invariant (1=1) and produces a pruned condition: WHERE cgpa > 3.0.',
    expectedOutcome: 'Optimization pass: Constant folding simplifies AST and reduces filter cost.',
  },
  {
    id: 'opt-pure-tautology',
    category: 'OPTIMIZATION',
    name: 'Complete WHERE Removal (WHERE 1=1)',
    query: `SELECT name\nFROM students\nWHERE 1 = 1;`,
    description: 'Optimizer detects entire WHERE clause is a no-op tautology and strips the filter operator completely.',
    expectedOutcome: 'Transforms to direct Scan without filter, saving row-by-row boolean evaluations.',
  },
  {
    id: 'opt-pushdown-sort',
    category: 'OPTIMIZATION',
    name: 'Predicate Pushdown Before Sort',
    query: `SELECT name, cgpa\nFROM students\nWHERE cgpa > 3.5\nORDER BY cgpa DESC;`,
    description: 'Compiler demonstrates Predicate Pushdown (Filter σ placed ahead of Sort τ operator).',
    expectedOutcome: 'Intermediate Representation shows filter executing before expensive O(N log N) sorting.',
  },
];
