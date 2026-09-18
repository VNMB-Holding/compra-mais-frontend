import fs from "fs";
import path from "path";

/**
 * Script para remover todos os comentários de código (TypeScript, TSX, JavaScript, JSX e CSS)
 * sem afetar strings, diretivas ("use client") ou regexes.
 */

const TARGET_DIR = path.resolve(process.cwd(), "src");

// Extensões de arquivos para processar
const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css", ".scss"];

import stripComments from "strip-comments";

/**
 * Remove comentários em arquivos JS/TS/TSX/JSX mantendo o código intacto.
 */
function removeJsComments(code: string): string {
  try {
    return stripComments(code, { keepProtected: false });
  } catch {
    return code;
  }
}

/**
 * Remove comentários em arquivos CSS (`/* ... *\/`).
 */
function removeCssComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter(l => l.trim().length > 0 || l === "").join("\n");
}

/**
 * Percorre recursivamente o diretório `src`
 */
function processDirectory(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Ignora pasta de testes se quiser ou processa tudo em src
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      processDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        let cleaned = content;

        if (ext === ".css" || ext === ".scss") {
          cleaned = removeCssComments(content);
        } else {
          cleaned = removeJsComments(content);
        }

        if (cleaned !== content) {
          fs.writeFileSync(fullPath, cleaned, "utf-8");
          console.log(`🧹 Comentários removidos: ${path.relative(process.cwd(), fullPath)}`);
        }
      }
    }
  }
}

console.log("🚀 Iniciando remoção de comentários na pasta src...");
processDirectory(TARGET_DIR);
console.log("✅ Concluído! Todos os comentários de código em src/ foram removidos com sucesso.");
