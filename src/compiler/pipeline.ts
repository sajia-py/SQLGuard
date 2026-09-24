/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UNIVERSITY_SCHEMA } from './database';
import { executeQuery } from './executor';
import { generateIntermediateRepresentation } from './ir';
import { tokenize } from './lexer';
import { optimizeQuery } from './optimizer';
import { parse } from './parser';
import { analyzeSecurity } from './security';
import { analyzeSemantics } from './semantic';
import { DatabaseSchema, Diagnostic, PipelineResult } from './types';

export function runCompilerPipeline(
  sql: string,
  schema: DatabaseSchema = UNIVERSITY_SCHEMA
): PipelineResult {
  const trimmed = sql.trim();
  const allDiagnostics: Diagnostic[] = [];

  // Stage 1: Lexical Analysis
  const lexerRes = tokenize(trimmed);
  allDiagnostics.push(...lexerRes.diagnostics);

  // If lexer had fatal errors, stop early but still run security check on raw tokens
  if (lexerRes.hasError) {
    const securityReport = analyzeSecurity(lexerRes.tokens, null, trimmed);
    return {
      sql: trimmed,
      tokens: lexerRes.tokens,
      ast: null,
      diagnostics: allDiagnostics,
      hasLexerError: true,
      hasParserError: false,
      hasSemanticError: false,
      securityReport,
      irTree: null,
      threeAddressCode: null,
      optimizedIRTree: null,
      optimizedTAC: null,
      optimizationSteps: [],
      executionResult: null,
    };
  }

  // Stage 2: Syntax Analysis & AST
  const parserRes = parse(lexerRes.tokens, trimmed);
  allDiagnostics.push(...parserRes.diagnostics);

  if (parserRes.hasError || !parserRes.ast) {
    const securityReport = analyzeSecurity(lexerRes.tokens, null, trimmed);
    return {
      sql: trimmed,
      tokens: lexerRes.tokens,
      ast: null,
      diagnostics: allDiagnostics,
      hasLexerError: false,
      hasParserError: true,
      hasSemanticError: false,
      securityReport,
      irTree: null,
      threeAddressCode: null,
      optimizedIRTree: null,
      optimizedTAC: null,
      optimizationSteps: [],
      executionResult: null,
    };
  }

  // Stage 3: Semantic Analysis & Symbol Table
  const semanticRes = analyzeSemantics(parserRes.ast, schema);
  allDiagnostics.push(...semanticRes.diagnostics);

  // Stage 4: Security Analysis
  const securityReport = analyzeSecurity(lexerRes.tokens, parserRes.ast, trimmed);

  if (semanticRes.hasError) {
    return {
      sql: trimmed,
      tokens: lexerRes.tokens,
      ast: parserRes.ast,
      diagnostics: allDiagnostics,
      hasLexerError: false,
      hasParserError: false,
      hasSemanticError: true,
      securityReport,
      irTree: null,
      threeAddressCode: null,
      optimizedIRTree: null,
      optimizedTAC: null,
      optimizationSteps: [],
      executionResult: null,
    };
  }

  // Stage 5: Intermediate Representation (IR & TAC)
  const { irTree, threeAddressCode } = generateIntermediateRepresentation(parserRes.ast);

  // Stage 6: Query Optimization
  const { optimizedIR, optimizedTAC, steps } = optimizeQuery(parserRes.ast, irTree);

  // Stage 7: Query Execution
  let executionResult = null;
  // If the security score is critical (e.g. destructive DDL or malicious injections), we can still simulate or block
  try {
    executionResult = executeQuery(parserRes.ast);
  } catch (e: any) {
    allDiagnostics.push({
      stage: 'SEMANTIC',
      severity: 'ERROR',
      message: `Execution Runtime Error: ${e.message}`,
      line: 1,
      column: 1,
    });
  }

  return {
    sql: trimmed,
    tokens: lexerRes.tokens,
    ast: parserRes.ast,
    diagnostics: allDiagnostics,
    hasLexerError: false,
    hasParserError: false,
    hasSemanticError: false,
    securityReport,
    irTree,
    threeAddressCode,
    optimizedIRTree: optimizedIR,
    optimizedTAC,
    optimizationSteps: steps,
    executionResult,
  };
}
