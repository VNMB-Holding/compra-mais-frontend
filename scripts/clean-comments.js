/**
 * Script de Limpeza de Comentários Desnecessários e Redundantes
 * Compra+ Frontend & Backend
 * 
 * Regras aplicadas:
 * - Remove comentários JSX vazios `{}` deixados durante refatorações.
 * - Remove comentários redundantes que apenas repetem o nome da variável ou componente adjacente.
 * - PRESERVA estritamente JSDocs (`/** ... *\/`), regras de negócio corporativas,
 *   integrações ERP, diretivas de framework (ex: `use client`), Swagger annotations e warnings de arquitetura.
 */

const fs = require('fs');
const path = require('path');

const targets = [
  path.resolve('c:/Users/brenosouza-nmb/Desktop/compra-mais-backend/src'),
  path.resolve('c:/Users/brenosouza-nmb/Desktop/compra-mais-frontend/src'),
];

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

// Padrões de comentários puramente redundantes/ruídos que não agregam regra de negócio
const redundantLinePatterns = [
  /^\s*\{\}\s*$/, // Comentário JSX vazio {}
  /^\s*\/\/\s*(Filtros de alçada|Simulador de alçada|Company Modal State|Range Modal State.*|Step \/ Rule Modal State.*|Confirmações|Dirty State.*|Regras da empresa selecionada.*|Agrupamento por faixa de valor|Simulação dinâmica|Ações)\s*$/i,
  /^\s*\{\/\*\s*(Page Header|KPI Stats Bar|Navegação por Abas|Ações|Header da Faixa|Barra de Filtros e Seleção|Opção de Cancelar Demanda)\s*\*\}\s*$/i,
];

let modifiedFiles = [];
let totalRemoved = 0;

targets.forEach(targetDir => {
  if (!fs.existsSync(targetDir)) return;
  const files = getFiles(targetDir);

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let fileChanged = false;
    let newLines = [];

    lines.forEach((line) => {
      const isRedundant = redundantLinePatterns.some(pattern => pattern.test(line));

      if (isRedundant) {
        fileChanged = true;
        totalRemoved++;
      } else {
        newLines.push(line);
      }
    });

    if (fileChanged) {
      fs.writeFileSync(file, newLines.join('\n'), 'utf8');
      modifiedFiles.push({
        file: path.relative(path.resolve(targetDir, '..'), file),
        fullPath: file,
      });
    }
  });
});

console.log(`\nLimpeza concluída com sucesso!`);
console.log(`Total de comentários redundantes/vazios removidos: ${totalRemoved}`);
console.log(`Arquivos atualizados (${modifiedFiles.length}):`);
modifiedFiles.forEach(f => console.log(` - ${f.file}`));
