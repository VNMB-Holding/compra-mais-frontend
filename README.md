# Compra Mais — Frontend

> Plataforma corporativa para gestão integrada de compras, cotações (RFQs), aprovações em alçada e homologação de fornecedores.

---

## Sumário
- [Stack Tecnológica](#stack-tecnol%C3%B3gica)
- [Arquitetura e Estrutura de Diretórios](#arquitetura-e-estrutura-de-diret%C3%B3rios)
- [Convenções de Nomenclatura](#conven%C3%A7%C3%B5es-de-nomenclatura)
- [Como Executar](#como-executar)
- [Qualidade e CI/CD](#qualidade-e-cicd)
- [Documentação Arquitetural](#documenta%C3%A7%C3%A3o-arquitetural)

---

## Stack Tecnológica

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
- **Linguagem**: [TypeScript 5](https://www.typescriptlang.org/)
- **Biblioteca de UI**: [React 19](https://react.dev/) + CSS Modules (`*.module.css`) + Tailwind CSS v4
- **Gerenciamento de Estado de Servidor**: [TanStack Query v5](https://tanstack.com/query)
- **Formulários e Validação**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Visualização de Dados**: [Recharts](https://recharts.org/)
- **Ícones**: [Remix Icon](https://remixicon.com/)

---

## Arquitetura e Estrutura de Diretórios

O projeto utiliza uma abordagem híbrida de **Feature-Driven Architecture (Vertical Slices)** e **Shared Kernel**:

```text
compra-mais-frontend/
├── .github/workflows/          # Pipelines de CI/CD (lint, type-check, build)
├── docs/                       # Documentação técnica e ADRs (Architecture Decision Records)
│   └── adr/
├── public/                     # Assets estáticos servidos diretamente
├── tests/                      # Setup de testes de integração e suítes E2E
│   └── e2e/
└── src/
    ├── app/                    # Camada de rotas (Next.js App Router - Thin Layer)
    ├── components/             # Camada de componentes compartilhados
    │   ├── layout/             # Componentes de estrutura e casca da aplicação
    │   ├── modals/             # Modais globais (kebab-case)
    │   └── ui/                 # Design System atômico agnóstico a regras de negócio
    ├── contexts/               # Contextos React globais (Auth, Toast)
    ├── features/               # Domínios de negócio isolados (Vertical Slices)
    │   ├── solicitacoes/       # Solicitações de compra (schemas, types, services)
    │   ├── rfqs/               # Cotações e RFQs
    │   ├── aprovacoes/         # Workflow de aprovação e limites de alçada
    │   ├── fornecedores/       # Gestão de fornecedores
    │   └── auth/               # Autenticação e sessão
    ├── hooks/                  # Hooks agnósticos e reutilizáveis
    ├── lib/                    # Clientes de infraestrutura e SDKs externos
    ├── types/                  # Tipos TypeScript transversais
    ├── utils/                  # Funções utilitárias puras
    └── proxy.ts                # Proxy (Next.js 16+) para proteção de rotas
```

---

## Convenções de Nomenclatura

| Escopo | Padrão | Exemplo |
| :--- | :--- | :--- |
| **Diretórios** | `kebab-case` | `nova-solicitacao/`, `quick-detail-drawer/` |
| **Pastas de Coleção** | Plural | `components/`, `features/`, `hooks/`, `types/` |
| **Componentes React** | `PascalCase.tsx` | `Button.tsx`, `ConfirmDialog.tsx` |
| **Estilos Scoped** | `PascalCase.module.css` | `Button.module.css` |
| **Hooks Utilitários** | `use-kebab-case.ts` | `use-auth.ts`, `use-debounce.ts` |
| **Schemas de Validação**| `kebab-case.schema.ts` | `solicitacao.schema.ts` |
| **App Router** | Minúsculas reservadas | `page.tsx`, `layout.tsx`, `loading.tsx` |

---

## Como Executar

### Pré-requisitos
- Node.js >= 20.x
- npm >= 10.x

### Instalação
```bash
npm install
```

### Ambiente de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).

### Build de Produção
```bash
npm run build
npm run start
```

---

## Qualidade e CI/CD

- **Type Check**: `npx tsc --noEmit`
- **Linting**: `npm run lint`
- **Pipeline Automatizado**: Executado a cada push/PR para os branches principais via GitHub Actions (`.github/workflows/ci.yml`).

---

## Documentação Arquitetural

Consulte os registros de decisões arquiteturais em [docs/adr/0001-estrutura-de-pastas-e-padronizacao.md](file:///c:/Users/brenosouza-nmb/Desktop/compra-mais-frontend/docs/adr/0001-estrutura-de-pastas-e-padronizacao.md).
