# Modernizacao visual do RH Insights — Design Spec

Data: 2026-10-05
Status: aprovado por decisao autonoma (Opcao A confirmada pelo usuario)

## 1. Objetivo

Modernizar a interface visual, UX e organizacao do frontend do sistema de RH,
SEM alterar, remover ou quebrar nenhuma funcionalidade existente.

Prioridade: FUNCIONALIDADE > ESTABILIDADE > UX > VISUAL > REFATORACAO.

## 2. Restricoes absolutas (nao negociaveis)

- Nenhuma regra de negocio, query Supabase, mutation, validacao ou hook alterado.
- Nenhuma rota, parametro de URL ou valor de `?tab=` alterado.
  Valores validos: colaboradores, estagiarios, pj, participacao, geral,
  treinamentos, eventos, turnover, absenteismo, timeline.
- Nenhuma prop publica de componente removida ou renomeada.
- Nenhuma alteracao de banco, migration ou credencial.
- Nenhuma lib nova.
- Nenhuma acao destrutiva em dados.

## 3. Direcao visual escolhida

Referencia de qualidade: Linear, Vercel, Stripe Dashboard, shadcn/ui.
Nao copiar literalmente. Paleta: clean, minimal, premium, corporativo.

### StatCards — Opcao A (aprovada)

- Card branco, borda sutil, raio 10px, sombra minima.
- Label em uppercase 11px, tracking 0.06em, cor muted.
- Numero em 34px, peso 600, `tabular-nums`, cor foreground.
- Cor identificada por: icone (fundo tintado + glifo colorido) e barra fina
  de 3px no topo do card.
- Subtitle 12px em muted.
- Mesma API: `variant: "default" | "primary" | "success" | "warning" | "info"`.

Cores por categoria (mesmo significado atual):
primary=azul, success=verde, warning=ambar, info=ciano.

## 4. Problemas encontrados na auditoria

### Bugs / defeitos reais (pre-existentes, corrigidos por ser bug de UI)

1. `StatCard` usa `text-current/80`. Sintaxe invalida no Tailwind para
   `currentColor`: nao computa opacidade. Hierarquia tipografica quebrada.
2. `StatCard` usa `text-current/70` com o mesmo problema.
3. `MetricCard` usa `bg-white` hardcoded — quebra em dark mode.
4. `@import` da fonte Inter vem DEPOIS de `@tailwind` em index.css.
   CSS exige `@import` antes de outras regras.
5. `DialogContent` close button tem `sr-only` "Close" (ingles).
6. `SelectTrigger` usa `focus:` em vez de `focus-visible:`.

### Problemas de design

7. Cores hardcoded espalhadas: `bg-white`, `text-slate-*`, `bg-slate-*`,
   `bg-emerald-100/text-emerald-800`, `bg-red-100`, `bg-blue-100`, hex em
   recharts (`#0f766e`, `#2563eb`, `#dc2626`, `#d97706`, `#e2e8f0`).
8. Gradientes saturados em tela cheia no topo da pagina.
9. Texto branco sobre gradiente ambar: abaixo de WCAG AA.
10. Tabs com `flex-wrap` e 10 abas: quebra em 2-3 linhas em 1366px.
11. Tabelas: shadcn padrao (h-12 header, p-4), sem sticky header.
12. Botoes de acao em tabela (editar/excluir) sem `aria-label` nem tooltip.
13. Header: busca global decorativa sem handler; botao de usuario sem acao;
    ambos sem `aria-label`.
14. Loading textual "Carregando..." em vez de Skeleton (Skeleton existe).
15. Filtros: `focus:ring` generico, classes `bg-background`/`bg-popover z-50`
    repetidas literalmente em dezenas de pontos.
16. Tabelas de 9 colunas sem `min-w`, risking truncamento ao reduzir densidade.
17. Textos de UI sem acentos. NOTA: valores de estado/URL nao mudam.


### Fora de escopo (decisao explicita)

- Busca global decorativa do Header: NAO implementar logica nova.
  Apenas tornar acessivel e coerente visualmente.
- Botao de usuario sem acao: idem.
- Ausencia de guarda de rota em `/`: comportamento atual e intencional
  (acesso via preview auth). NAO mexer em auth.
- TODOs de produto (localStorage vs backend): sao avisos de produto.
- Zebra em tabelas: rejeitada, conflita com badges coloridos.
- Tokens CSS em recharts: rejeitada pelo revisor. Risco de tela quebrada
  maior que o ganho. Cores de grafico hardcoded serao ajustadas para uma
  paleta coesa de constantes, sem acoplar a CSS vars.

## 5. Design System — tokens

Todos os tokens existentes sao PRESERVADOS (nomes identicos) para nao quebrar
nenhum uso. Acrescimos:

- Escala de neutros mais sofisticada (slate refinado) em `--background`,
  `--card`, `--muted`, `--border`, `--input`.
- Tokens semanticos de status, cada um em tres partes:
  `--success-fg` (texto), `--success-soft` (fundo), `--success-border`.
  Idem warning, info, danger(=destructive preservado), neutral.
- `--radius: 0.625rem` (10px), com derivados lg/md/sm.
- Sombras suaves: `--shadow-card`, `--shadow-pop`.
- `--transition-base: 180ms` (dentro da faixa 150-250ms pedida).
- `font-variant-numeric: tabular-nums` em numeros de tabela e KPI.
- `focus-visible` global com anel consistente e offset.

### Badge — variantes retrocompative

Adiciona `success`, `warning`, `info`, `neutral`.
As existentes (`default`, `secondary`, `destructive`, `outline`) permanecem
com o mesmo significado. Nenhum call site existente quebra.

## 6. Lotes de implementacao

Cada lote: implementar, rodar build/tsc/lint/test, verificar, so entao avancar.

- L0  Baseline: npm ci, build, tsc, lint, vitest. Registrar estado.
- L1  Fundacao: index.css (tokens, import order, focus-visible, tabular-nums),
       tailwind.config.ts, componentes base shadcn (button, badge, card, input,
       select, table, tabs, dialog, alert-dialog, tooltip, skeleton, popover,
       dropdown-menu, sheet, chart). APIs preservadas.

## 7. Estrategia de verificacao

Sem Playwright no projeto. Verificacao por:

1. `npm run build` (vite build) — erros de compilacao e de classe.
2. `npx tsc --noEmit` — tipos.
3. `npm run lint` — eslint.
4. `npm run test` — vitest.
5. Grep de regressao: padroes de cor hardcoded remanescentes,
   `text-current/`, `bg-white` em componentes de dashboard.
6. Diff review por lote contra o mapa funcional.

### Mapa funcional — checklist de regressao

Rotas: `/`, `/employee/:id`, `/login`, `/.lovable/oauth/consent`, `*`.

Abas do Index: CLT, Estagiarios, PJ, Participacao, Visao Geral, Treinamentos,
Eventos, Turnover, Absenteismo, Timeline.

Fluxos a preservar integralmente:

- Header: NotificationPanel (filtro all/unread/high, marcar lida, marcar todas
  como lidas, limpar lidas, "Ver detalhes" navega para `/?tab=`), persistencia
  via `persistSmartNotifications`.
- Dashboard: 7 StatCards alimentados por useColaboradoresStats,
  useTurnoverStats, useAbsenteismoStats, useContratacaoStats,
  useTreinamentosStats. Filtro de filial (useFiliais) com "Todas as filiais".
- `FilialForm` e `ColaboradorForm` (modais de criacao).
- `ColaboradoresList`: busca por nome, filtro sub-tipo CLT (Administrativo /
  Corpo Clinico), filtro status (Ativo/Inativo), paginacao (10/25/50),
  badge "Nova contratacao" (<=30 dias), badge de vinculo, badge de status,
  afastamentos ativos por colaborador, navegar para /employee/:id,
  EditColaboradorModal, delete com AlertDialog.
- Aba Treinamentos: TreinamentoChart, TreinamentosParticipacaoTable,
  TreinamentosInsightsCard, TreinamentosList.
- Aba Eventos: EventsPage com filtros tipo/setor/periodo, busca, resumo por
  tipo, EventsTable, EventFormModal, ConfirmDialog.
- Aba Turnover: TurnoverModule com filtros mes/setor/motivo, RankingList
  editavel, InsightsPanel, tabela de desligamentos (desktop) e cards (mobile),
  DesligamentoForm, EditDesligamentoModal.
- Aba Absenteismo: AbsenteismoModule com filtros mes/setor/tipo, ranking
  editavel, AfastamentosList com filtro por tipo, EditAfastamentoModal.
- Aba Visao Geral: OverviewDashboard (useOverviewAnalytics).
- Aba Timeline: TimelinePanel (colaboradores + afastamentos + desligamentos).
- Aba Participacao: ParticipacaoColaboradorChart.
- EmployeeDetails: pagina de detalhe do colaborador.

## 8. Pendencias conhecidas (nao serao feitas)

- Busca global funcional (exige decisao de produto).
- Menu de usuario / perfil / logout (exige auth).
- Guarda de rota (exige auth).
- Migracao de anexos para Storage (exige backend).
- Persistencia de rankings editados (exige backend).
- Testes visuais automatizados (exige Playwright, nova dep).
- Dark mode: tokens serao mantidos consistentes, mas nao ha toggle de tema
  no produto atual (next-themes instalado, sem uso). Nao criar toggle.
