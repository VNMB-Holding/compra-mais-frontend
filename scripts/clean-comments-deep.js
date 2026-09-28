/**
 * Limpeza aprofundada de comentários redundantes e de desenvolvimento
 * Compra+ Frontend & Backend
 * 
 * Regras:
 * - Remove comentários óbvios, marcadores de template/seção JSX repetitivos ({/* Header da Faixa *\/}, etc.)
 * - Remove comentários narrativos de linha que apenas repetem o código que está logo abaixo.
 * - Remove anotações temporárias e comentários informativos desnecessários.
 * - PRESERVA estritamente:
 *   - JSDocs formais (/** ... *\/)
 *   - Diretivas do Next.js ("use client", etc.)
 *   - Warnings de arquitetura e notas de integração externa indispensáveis
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

const linesToRemovePatterns = [
  // Marcadores de seção JSX óbvios
  /^\s*\{\/\*\s*TAB \d+:.*\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Modal:.*\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Confirmação de.*\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Banner de.*\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Canvas Visual.*\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Header da Faixa\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Sequência Resumida em Pills\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Corpo Visual com Conectores\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Barra Fixa de Persistência em Lote\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Alternância Solicitação \/ Pedido\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Simulador Interativo\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Visualização de Conteúdo\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Banner de Verificação de Autenticação.*\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Itens da Demanda\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Justificativa\s*\*\}\s*$/i,
  /^\s*\{\/\*\s*Opção de Cancelar Demanda\s*\*\}\s*$/i,

  // Comentários de código no Backend óbvios/redundantes
  /^\s*\/\/\s*Busca distinct das empresas cadastradas nas solicitações reais\s*$/i,
  /^\s*\/\/\s*Busca aprovadores reais registrados no histórico de aprovações.*\s*$/i,
  /^\s*\/\/\s*Ao cancelar o pedido de compra, cancela a proposta vencedora.*\s*$/i,
  /^\s*\/\/\s*Se a solicitação já nasce aguardando aprovação.*\s*$/i,
  /^\s*\/\/\s*Se status mudou para Approved ou Rejected e temos approverId.*\s*$/i,
  /^\s*\/\/\s*Cancela em cascata todas as RFQs vinculadas.*\s*$/i,
  /^\s*\/\/\s*Cancela propostas vinculadas.*\s*$/i,
  /^\s*\/\/\s*Cancela Pedidos de Compra gerados a partir desta RFQ.*\s*$/i,
  /^\s*\/\/\s*Se temos um aprovador designado no histórico, valida se o usuário autenticado tem permissão\s*$/i,
  /^\s*\/\/\s*Dispara próximo e-mail da cadeia ou finaliza aprovação\s*$/i,
  /^\s*\/\/\s*Se não há regras configuradas, aprova direto\s*$/i,
  /^\s*\/\/\s*Históricos já aprovados\s*$/i,
  /^\s*\/\/\s*Se todas as etapas foram aprovadas\s*$/i,
  /^\s*\/\/\s*Identifica o próximo aprovador da fila\s*$/i,
  /^\s*\/\/\s*Verifica se já existe um histórico pendente criado para essa etapa\s*$/i,
  /^\s*\/\/\s*Resolve e-mail do aprovador desta etapa\s*$/i,
  /^\s*\/\/\s*Ao cancelar a cotação, a solicitação de compra de origem também é cancelada\s*$/i,
  /^\s*\/\/\s*Se o fornecedor for não cadastrado e possui anexo bancário.*\s*$/i,
  /^\s*\/\/\s*Atualiza status do fornecedor para ativo agora que foi formalizado\s*$/i,

  // Comentários inline no Frontend óbvios/redundantes
  /^\s*\/\/\s*Regras da empresa selecionada e tipo de fluxo\s*$/i,
  /^\s*\/\/\s*Agrupamento por faixa de valor\s*$/i,
  /^\s*\/\/\s*Diagnóstico visual e identificação inteligente de conflitos\s*$/i,
  /^\s*\/\/\s*Simulação dinâmica\s*$/i,
  /^\s*\/\/\s*1\. Verificação por Role ou Identificador de Perfil\s*$/i,
  /^\s*\/\/\s*2\. Verificação por ID de Usuário\s*$/i,
  /^\s*\/\/\s*3\. Verificação por Nome ou Primeiro Nome\s*$/i,
  /^\s*\/\/\s*Se não houver actionUrl definida, deriva com base no tipo da notificação\s*$/i,
  /^\s*\/\/\s*Se a URL for apenas um identificador\/UUID\/código sem barra inicial\s*$/i,
  /^\s*\/\/\s*Se regras customizadas foram passadas ou se as regras do adminApi estão em cache\s*$/i,
  /^\s*\/\/\s*Consulta direta ao serviço de Tenants se o endpoint intermediário falhar\s*$/i,
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
      const isRedundant = linesToRemovePatterns.some(pattern => pattern.test(line));

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

console.log(`\nLimpeza profunda concluída com sucesso!`);
console.log(`Total de comentários adicionais removidos: ${totalRemoved}`);
console.log(`Arquivos atualizados (${modifiedFiles.length}):`);
modifiedFiles.forEach(f => console.log(` - ${f.file}`));
