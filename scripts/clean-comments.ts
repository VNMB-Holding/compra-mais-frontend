import fs from "fs";
import path from "path";
import ts from "typescript";

const TARGET_DIRS = [
  path.resolve(process.cwd(), "src"),
  path.resolve(process.cwd(), "tests"),
];

const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css", ".scss"];

/**
 * Remove comentários de código JS/TS/TSX/JSX usando a AST do TypeScript.
 * Preserva strings, literais de template, regexes e diretivas ("use client", etc.).
 */
function removeCodeComments(code: string, filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const isJsx = ext === ".tsx" || ext === ".jsx";
  const isTs = ext === ".ts" || ext === ".tsx";

  let sf: ts.SourceFile;
  try {
    sf = ts.createSourceFile(
      filePath,
      code,
      ts.ScriptTarget.Latest,
      true,
      isJsx ? ts.ScriptKind.TSX : isTs ? ts.ScriptKind.TS : ts.ScriptKind.JS
    );
  } catch {
    return code;
  }

  const ranges: { pos: number; end: number }[] = [];
  const fullText = sf.getFullText();

  function walk(node: ts.Node) {
    const leading = ts.getLeadingCommentRanges(fullText, node.getFullStart());
    if (leading) ranges.push(...leading);

    const trailing = ts.getTrailingCommentRanges(fullText, node.getEnd());
    if (trailing) ranges.push(...trailing);

    if (node.kind === ts.SyntaxKind.JsxExpression && !(node as ts.JsxExpression).expression) {
      ranges.push({ pos: node.getStart(sf), end: node.getEnd() });
    }

    node.getChildren(sf).forEach(walk);
  }

  walk(sf);

  if (ranges.length === 0) return code;

  const seen = new Set<string>();
  const sorted: { pos: number; end: number }[] = [];
  for (const r of ranges) {
    const k = `${r.pos}:${r.end}`;
    if (!seen.has(k)) {
      seen.add(k);
      sorted.push({ pos: r.pos, end: r.end });
    }
  }
  sorted.sort((a, b) => a.pos - b.pos || b.end - a.end);

  const merged: { pos: number; end: number }[] = [];
  for (const r of sorted) {
    if (merged.length === 0) {
      merged.push(r);
    } else {
      const prev = merged[merged.length - 1];
      if (r.pos <= prev.end) {
        prev.end = Math.max(prev.end, r.end);
      } else {
        merged.push(r);
      }
    }
  }

  let result = code;
  for (let i = merged.length - 1; i >= 0; i--) {
    const { pos, end } = merged[i];

    const lineStart = code.lastIndexOf("\n", pos - 1) + 1;
    const lineEnd = code.indexOf("\n", end);
    const before = code.slice(lineStart, pos);
    const after = lineEnd === -1 ? code.slice(end) : code.slice(end, lineEnd);

    if (/^\s*$/.test(before) && /^\s*$/.test(after)) {
      const deleteEnd = lineEnd === -1 ? code.length : lineEnd + 1;
      result = result.slice(0, lineStart) + result.slice(deleteEnd);
    } else {
      let trimPos = pos;
      while (trimPos > lineStart && (code[trimPos - 1] === " " || code[trimPos - 1] === "\t")) {
        trimPos--;
      }
      result = result.slice(0, trimPos) + result.slice(end);
    }
  }

  return result;
}

/**
 * Remove comentários CSS / SCSS mantendo estilos intactos.
 */
function removeCssComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, (match, offset) => {
    const lineStart = code.lastIndexOf("\n", offset - 1) + 1;
    const lineEnd = code.indexOf("\n", offset + match.length);
    const before = code.slice(lineStart, offset);
    const after = lineEnd === -1 ? code.slice(offset + match.length) : code.slice(offset + match.length, lineEnd);
    if (/^\s*$/.test(before) && /^\s*$/.test(after)) {
      return "";
    }
    return "";
  });
}

function processDirectory(dirPath: string, stats: { totalFiles: number; cleanedFiles: number }) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      processDirectory(fullPath, stats);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        stats.totalFiles++;
        const content = fs.readFileSync(fullPath, "utf-8");
        let cleaned = content;

        if (ext === ".css" || ext === ".scss") {
          cleaned = removeCssComments(content);
        } else {
          cleaned = removeCodeComments(content, fullPath);
        }

        if (cleaned !== content) {
          fs.writeFileSync(fullPath, cleaned, "utf-8");
          stats.cleanedFiles++;
          console.log(`🧹 Comentários removidos: ${path.relative(process.cwd(), fullPath)}`);
        }
      }
    }
  }
}

console.log("🚀 Iniciando remoção de comentários em src/ e tests/...");
const stats = { totalFiles: 0, cleanedFiles: 0 };
for (const dir of TARGET_DIRS) {
  if (fs.existsSync(dir)) {
    processDirectory(dir, stats);
  }
}
console.log(`✅ Concluído! Processados ${stats.totalFiles} arquivos. Comentários limpos em ${stats.cleanedFiles} arquivo(s).`);
