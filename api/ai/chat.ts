import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

function generateRuleBasedExplanation(message: string, context: any): string {
  const query = context?.sql || 'SELECT * FROM students';
  const tokens = context?.tokensCount || 0;
  const securityScore = context?.securityScore ?? 100;
  const threats = context?.threats || [];
  const optimizations = context?.optimizations || [];
  const rows = context?.rowCount ?? 0;
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('all steps') || lowerMsg.includes('every step') || lowerMsg.includes('what did each step do') || lowerMsg.includes('explain') || lowerMsg.includes('working')) {
    return `### 🎓 Detailed Step-by-Step Compiler Breakdown for Your Query

**Target Query:**
\`\`\`sql
${query}
\`\`\`

Here is exactly what every phase of the **SQLGuard** compiler pipeline did to your code in simple terms:

---

#### 1. 🔍 Lexical Analysis (Scanner / DFA)
* **What it did:** The scanner read your raw text character-by-character, stripped irrelevant whitespaces and comments, and transformed it into **${tokens} discrete compiler tokens**.
* **Categorization:** Keywords (e.g., \`SELECT\`, \`FROM\`, \`WHERE\`), Identifiers (table & column names), Operators (\`=\`, \`>\`, \`AND\`), and Literals.
* **Tracking:** Line and column numbers were attached to every token for precise error reporting.

#### 2. 🌲 Syntax Analysis (Recursive-Descent Parser & AST)
* **What it did:** Checked whether your sequence of tokens follows the official **Backus-Naur Form (BNF) Context-Free Grammar**.
* **Transformation:** Converted linear tokens into a structured **Abstract Syntax Tree (AST)** where the root is \`SelectStatement\`, branching into \`projections\`, \`fromTable\`, and optional \`where\` / \`orderBy\` / \`limit\` nodes.

#### 3. 📚 Semantic Analysis & Symbol Table
* **What it did:** Queried the database catalog to verify real-world validity:
  * Checked if referenced tables exist in the schema dictionary.
  * Verified that requested columns belong to those tables without ambiguity.
  * Checked **type compatibility** (e.g. comparing numerical CGPA with a numeric literal, not a text string).

#### 4. 🛡️ Security Analysis (SQL Injection Guard - CWE-89)
* **Security Score:** **${securityScore}/100**
* **Findings:** ${threats.length === 0 ? 'No malicious tautologies or SQLi signatures detected.' : `Flagged ${threats.length} potential security threat(s).`}
* **What it did:** Scanned the AST condition tree and raw patterns for:
  * **Tautologies:** Always-true statements like \`'1'='1'\` or \`1=1\` used to bypass auth.
  * **UNION & Stacked Injections:** Multi-statement or cross-table exfiltration.
  * **Mitigation:** Recommended parameterized query with \`?\` placeholders.

#### 5. ⚙️ Intermediate Representation (Relational Algebra & 3-Address Code)
* **What it did:** Decomposed the declarative query into machine-independent procedural steps:
  * **Relational Algebra:** $\\pi$ (Projection), $\\sigma$ (Selection/Filter), $\\bowtie$ (Join).
  * **Three-Address Code (TAC):** Linearized instructions with temporary registers (\`t1 = SCAN students\`, \`t2 = FILTER t1\`, \`t3 = PROJECT t2\`).

#### 6. ⚡ Query Optimization (Algebraic Rewriting)
* **What it did:** Applied rule-based query transformations:
  * **Predicate Pushdown:** Filters are moved before sort or join operations so fewer rows need to be processed.
  * **Constant Folding / Dead Predicates:** Eliminated redundant checks.
  * **Active passes applied:** ${optimizations.length > 0 ? optimizations.map((o: any) => o.ruleName).join(', ') : 'Direct canonical representation (no dead operations).'}.

#### 7. 🚀 Database Execution Engine
* **What it did:** Evaluated the optimized relational execution plan against the in-memory database.
* **Output:** Fetched and returned **${rows} record(s)** matching your conditions.`;
  }

  if (lowerMsg.includes('lexer') || lowerMsg.includes('token')) {
    return `### 🔍 Phase 1: Lexical Analysis Explained
The Lexer (Scanner) is the very first stage of any compiler.
1. It takes your raw SQL string: \`${query.replace(/\n/g, ' ')}\`
2. It breaks the text into individual meaningful words called **Tokens**.
3. It classifies them:
   * \`SELECT\`, \`FROM\`, \`WHERE\` $\\rightarrow$ **Keywords**
   * Column names & table names $\\rightarrow$ **Identifiers**
   * Values like \`3.0\` or \`'CS'\` $\\rightarrow$ **Literals**
4. It ignores extra spaces and tabs, but records the exact line and column coordinates so that if an error happens later, SQLGuard can point directly to it with a \`^\` marker!`;
  }

  if (lowerMsg.includes('parser') || lowerMsg.includes('ast') || lowerMsg.includes('syntax')) {
    return `### 🌲 Phase 2: Syntax Analysis & AST Explained
The Parser checks the **grammar** of your SQL query.
1. Just like human languages have grammar (Subject + Verb + Object), SQL has Context-Free Grammar (CFG) rules defined in Backus-Naur Form (BNF).
2. The Parser ensures that after \`SELECT\`, there is a list of columns, followed by \`FROM\`, followed by a table name.
3. It outputs a tree called an **Abstract Syntax Tree (AST)**. This tree captures the hierarchical meaning of your query without parentheses or commas, making it easy for the semantic analyzer and optimizer to process.`;
  }

  if (lowerMsg.includes('injection') || lowerMsg.includes('security') || lowerMsg.includes('threat')) {
    return `### 🛡️ Phase 4: SQL Injection Security Guard Explained
SQL Injection (CWE-89) occurs when untrusted user input is directly concatenated into a SQL string.
* **Tautologies (e.g. \`'1'='1'\` or \`1=1\`):** Because \`'1'='1'\` is always TRUE, an attacker can bypass a login check like \`WHERE username = 'admin' AND password = '...' OR '1'='1'\`. SQLGuard's AST analyzer checks the boolean expressions and flags this as high/critical severity!
* **Safe Mitigation:** Always use **Parameterized Prepared Statements** (\`WHERE cgpa > ?\`) so the database engine compiles the SQL command structure first and treats user inputs strictly as literal values, never as executable code.`;
  }

  return `### 🤖 SQLGuard AI Assistant
I analyzed your current query:
\`\`\`sql
${query}
\`\`\`

Here is a summary:
- **Tokens processed:** ${tokens} tokens
- **Security rating:** ${securityScore}/100 (${threats.length} threats)
- **Optimizations:** ${optimizations.length} passes applied
- **Execution rows:** ${rows} tuples returned

Feel free to ask me anything specific! For example:
- *"Explain what the Lexer did with my code"*
- *"Explain how the AST tree was constructed"*
- *"Why is SQL injection dangerous and how did SQLGuard detect it?"*
- *"Explain Three-Address Code and temporary variables"*
- *"Explain Predicate Pushdown in simple words"*`;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [], compilerContext = {} } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are SQLGuard AI Tutor, an expert Compiler Construction professor and Database Security researcher.
You are helping students understand the entire compiler pipeline of their SQL query in simple, engaging, crystal-clear language.

The 7 compiler pipeline stages implemented in SQLGuard are:
1. Lexical Analysis (Scanner, DFA, Tokens, Keywords vs Identifiers, Position tracking)
2. Syntax Analysis (BNF Context-Free Grammar, Recursive-Descent Parser, Abstract Syntax Tree AST)
3. Semantic Analysis (Symbol Table, Scope bindings, Table/Column existence catalog checks, Type checking)
4. Security Analysis (SQL Injection CWE-89 detection, Tautologies like '1'='1', UNION attacks, Prepared statement parameterization)
5. Intermediate Representation (Relational Algebra operators π, σ, ⨝, τ, λ, and Three-Address Code TAC with t1, t2 registers)
6. Query Optimization (Predicate Pushdown, Dead Predicate Pruning, Constant Folding, Cost reduction)
7. Query Execution (In-memory Relational Database execution, Tuples, Millisecond latency)

CURRENT USER QUERY CONTEXT:
SQL: ${compilerContext.sql || 'SELECT * FROM students'}
Tokens Count: ${compilerContext.tokensCount || 0}
AST Type: ${compilerContext.astSummary || 'SelectStatement'}
Semantic Status: ${compilerContext.semanticStatus || 'PASSED'}
Security Score: ${compilerContext.securityScore ?? 100}/100
Security Findings: ${JSON.stringify(compilerContext.threats || [])}
Intermediate Code (TAC): ${JSON.stringify(compilerContext.tacInstructions || [])}
Optimizations Applied: ${JSON.stringify(compilerContext.optimizations || [])}
Execution Result: ${compilerContext.rowCount ?? 0} rows returned

GUIDELINES:
- Explain what the compiler did to their EXACT code.
- Use clear bullet points, code blocks, and simple student-friendly explanations.
- If they ask about a specific step, give a thorough, easy-to-understand explanation with examples.`;

      const contents: any[] = [];
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.status(200).json({ reply: response.text || '' });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to rule-based explainer:', err.message);
    }
  }

  const fallbackReply = generateRuleBasedExplanation(message, compilerContext);
  return res.status(200).json({ reply: fallbackReply });
}
