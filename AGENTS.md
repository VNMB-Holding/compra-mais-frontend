<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Diretrizes do Projeto / Project Guidelines

## Componentes de UI e Reutilização / UI Components and Reusability
- **Utilize os Componentes Existentes**: Sempre priorize o uso dos componentes existentes em [ui](file:///c:/Users/brenosouza-nmb/Desktop/compra-mais-frontend/src/components/ui) (importados via `@/components/ui`). Não recrie botões, cards, tabelas, badges, modais ou gráficos do zero se já existirem na pasta de UI.
- **Evite Duplicação de Código**: Em vez de copiar e colar blocos de código ou criar lógica redundante, crie componentes novos, modulares e reutilizáveis caso uma funcionalidade ou elemento de UI precise ser compartilhado.
- **Padrão de Design**: Siga fielmente o padrão de design estabelecido no projeto. Para estilização, utilize CSS Modules (`.module.css`) mantendo a coerência visual e responsividade das páginas existentes.

---

- **Use Existing Components**: Always prioritize using the existing components in [ui](file:///c:/Users/brenosouza-nmb/Desktop/compra-mais-frontend/src/components/ui) (imported via `@/components/ui`). Do not recreate buttons, cards, tables, badges, modals, or charts from scratch if they already exist in the UI folder.
- **Avoid Code Duplication**: Instead of copy-pasting code blocks or creating redundant inline logic, build new, modular, and reusable components if a UI element or feature needs to be shared.
- **Design Pattern**: Strictly follow the established design pattern of the project. For styling, use CSS Modules (`.module.css`), maintaining the visual coherence and responsiveness of the existing pages.
