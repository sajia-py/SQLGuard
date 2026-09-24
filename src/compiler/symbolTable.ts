/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColumnSchema, DatabaseSchema, TableSchema } from './types';

export interface SymbolTableEntry {
  tableName: string;
  alias?: string;
  schema: TableSchema;
}

export class SymbolTable {
  private schema: DatabaseSchema;
  private activeTables: Map<string, SymbolTableEntry> = new Map();

  constructor(schema: DatabaseSchema) {
    this.schema = schema;
  }

  public registerTable(tableName: string, alias?: string): boolean {
    const canonicalName = tableName.toLowerCase();
    const tableSchema = Object.values(this.schema.tables).find(
      t => t.name.toLowerCase() === canonicalName
    );

    if (!tableSchema) {
      return false;
    }

    const entry: SymbolTableEntry = {
      tableName: tableSchema.name,
      alias: alias ? alias.toLowerCase() : undefined,
      schema: tableSchema,
    };

    this.activeTables.set(tableSchema.name.toLowerCase(), entry);
    if (alias) {
      this.activeTables.set(alias.toLowerCase(), entry);
    }

    return true;
  }

  public lookupTable(name: string): TableSchema | null {
    const lower = name.toLowerCase();
    const matched = Object.values(this.schema.tables).find(t => t.name.toLowerCase() === lower);
    return matched || null;
  }

  public getActiveTable(nameOrAlias: string): SymbolTableEntry | null {
    return this.activeTables.get(nameOrAlias.toLowerCase()) || null;
  }

  public getAllActiveTables(): SymbolTableEntry[] {
    // Return unique by tableName
    const unique = new Map<string, SymbolTableEntry>();
    for (const entry of this.activeTables.values()) {
      unique.set(entry.tableName, entry);
    }
    return Array.from(unique.values());
  }

  public lookupColumn(tableNameOrAlias: string, colName: string): ColumnSchema | null {
    const entry = this.getActiveTable(tableNameOrAlias);
    if (!entry) return null;

    const lowerCol = colName.toLowerCase();
    return entry.schema.columns.find(c => c.name.toLowerCase() === lowerCol) || null;
  }

  public resolveUnqualifiedColumn(colName: string): { column: ColumnSchema; tableName: string } | 'AMBIGUOUS' | null {
    const lowerCol = colName.toLowerCase();
    const matches: { column: ColumnSchema; tableName: string }[] = [];

    const activeUnique = this.getAllActiveTables();
    for (const entry of activeUnique) {
      const col = entry.schema.columns.find(c => c.name.toLowerCase() === lowerCol);
      if (col) {
        matches.push({ column: col, tableName: entry.tableName });
      }
    }

    if (matches.length === 0) return null;
    if (matches.length > 1) return 'AMBIGUOUS';
    return matches[0];
  }

  public suggestTable(name: string): string | null {
    const lower = name.toLowerCase();
    let bestMatch: string | null = null;
    let minDistance = 4;

    for (const key of Object.keys(this.schema.tables)) {
      const dist = levenshtein(lower, key.toLowerCase());
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = key;
      }
    }
    return bestMatch;
  }

  public suggestColumn(tableName: string, colName: string): string | null {
    const entry = this.getActiveTable(tableName) || { schema: this.lookupTable(tableName)! };
    if (!entry.schema) return null;

    const lower = colName.toLowerCase();
    let bestMatch: string | null = null;
    let minDistance = 4;

    for (const col of entry.schema.columns) {
      const dist = levenshtein(lower, col.name.toLowerCase());
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = col.name;
      }
    }
    return bestMatch;
  }

  public isTypeCompatible(colType: string, litType: string, op: string): boolean {
    if (litType === 'NULL') return true;

    if (colType === 'INTEGER' || colType === 'REAL') {
      return litType === 'NUMBER';
    }

    if (colType === 'TEXT') {
      return litType === 'STRING';
    }

    if (colType === 'BOOLEAN') {
      return litType === 'BOOLEAN';
    }

    return true;
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}
