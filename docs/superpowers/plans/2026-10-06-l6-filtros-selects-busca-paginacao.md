# L6 Filtros, Selects, Busca e Paginação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use /long-haul-development.md to implement this plan task-by-task (disk-backed plan + journal, `/newtask` relay, review gates). For a plan small enough to finish in one session, /executing-plans.md is the simpler inline path. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Padronizar visualmente filtros, selects, campos de busca, controles de período e paginação sem alterar a lógica de filtragem, o estado ou as integrações de dados.

**Architecture:** Manter todos os componentes controlados e seus callbacks atuais. Alterar somente classes Tailwind, estrutura visual local e atributos semânticos/a11y que não mudem o contrato de cada controle. Os hooks, efeitos, query keys, parâmetros Supabase, debounce inexistente e regras de reset/paginação permanecem intocados.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Radix Select, TanStack Query, Supabase, Vite, Vitest, ESLint.

---

## Correção de nomenclatura do roadmap

- L0 ✅ Baseline
- L1 ✅ Fundação / Design System
- L2 ✅ Cards
- L3 ✅ Header / layout
- L4 ✅ Tabs
- L5 ✅ Tabelas
- L6 ✅ Filtros / selects / busca / PaginationControls
- L7 ✅ Modais/Formulários
- L8 ⏳ módulos/hardcodes restantes
- L9 ⏳ responsividade/polimento/regressão final

As alterações já aprovadas em `src/components/forms/ColaboradorForm.tsx` e `src/components/dashboard/EditColaboradorModal.tsx` pertencem ao L7 e não devem ser revertidas nem reabertas durante o L6 sem regressão concreta.

## Auditoria de contratos preservados

| Superfície | Call site / estado | Integrações e dependências preservadas |
| --- | --- | --- |
| `FilialSelector` | `Index.tsx`; `selectedFilial` / `setSelectedFilial` | `useFiliais` usa query key `["filiais"]`; `"all"` continua convertido em `undefined` para hooks e módulos. |
| `PaginationControls` | `ColaboradoresList.tsx`, `EventsTable.tsx`; props controladas | `onPageChange` e `onPageSizeChange` continuam recebendo exatamente os mesmos números. |
| Colaboradores | busca, subtipo, status, página | `useColaboradoresPaginados` mantém query key `["colaboradores-paginados", filters]`, filtros Supabase e efeito que volta à página 1. |
| Absenteísmo / Turnover | mês, setor, tipo | `useAbsenteismoAnalytics` e `useTurnoverAnalytics` mantêm query keys, parâmetros e aplicação de filtros. |
| Participações | eventos e treinamentos | Filtros locais em `useMemo`; hooks de dados e predicates não são alterados. |
| Timeline / comparação de setores | busca, setor, período | Filtros e ordenação locais em `useMemo`; eventos e linhas de entrada são preservados. |
| Eventos | busca, início/fim, tipo, setor, paginação | `filterInstitutionalEvents`, hidratação local/backend, `setTotalCount` e callbacks de paginação são preservados. |
| Visão geral | período, datas customizadas, alertas | `useOverviewAnalytics({ filialId, preset, customRange })` e filtro local de alertas não mudam. |
| Header | busca decorativa | Permanece `readOnly` e `disabled`; nenhuma busca funcional será criada. |

### Task 1: Padronizar controles compartilhados

**Files:**
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/dashboard/FilialSelector.tsx`
- Modify: `src/components/ui/PaginationControls.tsx`

- [x] Usar foco `focus-visible` no trigger compartilhado, sem mudar sua API ou comportamento Radix.
- [x] Ajustar largura mobile do seletor de filial, preservando `value || "all"`, `onValueChange` e o estado de carregamento de `useFiliais`.
- [x] Integrar visualmente paginação com borda, fundo, espaçamento, estado de carregamento e controles responsivos, mantendo cálculos, callbacks, opções e disabled existentes.
- [x] Verificar o diff focado e executar `npx.cmd tsc --noEmit` (`TSC_EXIT:0`).

### Task 2: Padronizar filtros de módulos e listas

**Files:**
- Modify: `src/components/dashboard/ColaboradoresList.tsx`
- Modify: `src/components/dashboard/AbsenteismoModule.tsx`
- Modify: `src/components/dashboard/TurnoverModule.tsx`
- Modify: `src/components/dashboard/EventosParticipacaoTable.tsx`
- Modify: `src/components/dashboard/TreinamentosParticipacaoTable.tsx`

- [x] Melhorar gaps, largura mobile e alinhamento dos grupos de filtros somente por classes.
- [x] Preservar todos os valores, `onChange`, `onValueChange`, efeitos de reset, queries, requests e predicates combinados.
- [x] Verificar o diff focado e executar `npx.cmd tsc --noEmit` (`TSC_EXIT:0`).

### Task 3: Padronizar busca e filtros de período restantes

**Files:**
- Modify: `src/components/dashboard/EmployeeTimeline.tsx`
- Modify: `src/components/dashboard/SectorComparisonTable.tsx`
- Modify: `src/features/events/EventsPage.tsx`
- Modify: `src/features/overview/OverviewDashboard.tsx`
- Modify: `src/components/dashboard/Header.tsx`

- [x] Aplicar composição consistente a busca, ícones, datas e selects, incluindo rótulos acessíveis para intervalos de data.
- [x] Manter Header decorativo, desabilitado e sem handler.
- [x] Não alterar `useMemo`, `useEffect`, setters, `filterInstitutionalEvents`, analytics ou persistência.
- [x] Verificar o diff focado e executar `npx.cmd tsc --noEmit` (`TSC_EXIT:0`).

### Task 4: Validação final e transição para L7 restante

**Files:**
- Modify: `docs/superpowers/plans/2026-10-06-l6-filtros-selects-busca-paginacao.md`
- Verify: arquivos das Tasks 1–3

- [x] Executar build, TypeScript, Vitest, `git diff --check` e ESLint direto, registrando o exit code real sem wrapper: `TSC_EXIT:0`, `BUILD_REAL_EXIT:0`, `VITEST_EXIT:0`, `DIFF_CHECK_EXIT:0`, `LINT_REAL_EXIT:1`.
- [x] Confirmar que lint preserva o baseline de 96 errors, 16 warnings e 112 problems; o exit code real do ESLint é não zero enquanto esse baseline existir.
- [x] Fazer revisão desktop/mobile por inspeção dos breakpoints e inventariar exclusivamente os modais/formulários L7 ainda fora do padrão.
- [x] Marcar L6 como concluído somente após as verificações frescas.

## Resultado

**L6 ✅ concluído em 6 de outubro de 2026.** Foram padronizados os controles compartilhados, seletor de filial, paginação, buscas, filtros de listas/módulos, período e datas. Os contratos de filtros, query keys, requests Supabase, efeitos, paginação e Header decorativo foram preservados.

## Auditoria L7 posterior ao L6

**L7 ✅ concluído em 6 de outubro de 2026.** A auditoria foi limitada a modais e formulários de dados ainda fora do padrão e excluiu explicitamente `src/components/forms/ColaboradorForm.tsx` e `src/components/dashboard/EditColaboradorModal.tsx`, já validados anteriormente.

- Padronizados com largura segura em mobile, `max-h`/scroll, borda/sombra e grids responsivos: `AfastamentoForm.tsx`, `EditAfastamentoModal.tsx`, `DesligamentoForm.tsx`, `EditDesligamentoModal.tsx`, `FilialForm.tsx`, `EventoForm.tsx`, `LiderForm.tsx`, `TreinamentoForm.tsx`, `EventFormModal.tsx` e `AddEmployeeModal.tsx`.
- Foram preservados schemas, `useForm`, mutations, `value`, `defaultValue`, `onChange`, `onValueChange`, resets, handlers de submissão, tabs e anexos.
- O preview de anexo em `src/components/dashboard/AfastamentosList.tsx` foi excluído por ser diálogo de visualização, não formulário de dados.