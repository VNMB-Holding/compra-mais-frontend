# ADR 0001: Estrutura de Pastas e Padronização Arquitetural

## Status
Aprovado

## Contexto
O projeto `compra-mais-frontend` é uma aplicação corporativa crítica construída sobre Next.js (App Router), React 19, TypeScript e ecossistema moderno. Com o crescimento das funcionalidades (solicitações, RFQs, aprovações, fornecedores), a organização por camadas genéricas gerou arquivos com responsabilidade excessiva nas rotas (`app/`), acoplamento entre regras de negócio e fragmentação de componentes.

## Decisão
Adotar a **Feature-Driven Architecture (Vertical Slices)** combinada a um **Shared Kernel** e convenções estritas de nomenclatura:

1. **Nomenclatura**:
   - Diretórios de módulos, rotas e coleções em `kebab-case` e plural quando agruparem múltiplos elementos (`features/`, `components/`, `hooks/`, `types/`, `services/`).
   - Componentes React em `PascalCase.tsx` com seus respectivos CSS Modules em `PascalCase.module.css`.
   - Utilitários, hooks e schemas em `kebab-case.ts` (ex.: `use-debounce.ts`, `solicitacao.schema.ts`).
   - Arquivos reservados de rota do Next.js estritamente em minúsculas (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).

2. **Camada `src/features/`**:
   - Cada domínio de negócio (`solicitacoes/`, `rfqs/`, `aprovacoes/`, `fornecedores/`, `auth/`) encapsula seus próprios componentes, hooks, schemas de validação, types e services.
   - Cada feature expõe uma API pública através de um `index.ts`.

3. **Camada `src/app/` (Thin Routes)**:
   - Mantida exclusivamente para roteamento, metadados, layouts de alto nível e composição de páginas através dos componentes das features.

4. **Camada Compartilhada (`src/components/ui/`)**:
   - Design system e componentes atômicos agnósticos a regras de negócio, consumidos via alias `@/components/ui`.

## Consequências
- **Positivas**:
  - Isolamento de regras de negócio por domínio.
  - Facilidade de navegação e onboarding para novos desenvolvedores.
  - Eliminação de conflitos de merge entre times distintos.
  - Co-localização de testes e schemas junto à funcionalidade.
- **Trade-offs**:
  - Requer disciplina contínua para não vazar lógicas de domínio para a camada compartilhada.
