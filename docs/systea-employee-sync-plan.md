# Plano técnico — sincronização de colaboradores Systea

## Objetivo

Sincronizar colaboradores do Systea para `public.colaboradores` por uma Edge Function autenticada e autorizada, com dry-run, auditoria resumida, paginação defensiva e preservação de dados locais.

## Escopo de arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `supabase/migrations/20261006120000_add_systea_employee_sync.sql` | Schema, constraints, índices, auditoria e allowlist administrativa. |
| `supabase/functions/_shared/systea-sync.ts` | Tipos, normalização, classificação, paginação e comparação puras. |
| `supabase/functions/systea-employee-sync/index.ts` | Handler HTTP, JWT, autorização, secrets, acesso Supabase, upsert e CORS. |
| `src/features/systea-sync/systeaSync.test.ts` | Testes de domínio e paginação com fixtures sanitizadas. |
| `src/features/systea-sync/useSysteaSync.ts` | Mutations TanStack Query para dry-run, sync e última execução. |
| `src/components/dashboard/SysteaSyncCard.tsx` | Resumo, dry-run, confirmação da sincronização real e última auditoria. |
| `src/components/dashboard/ColaboradoresList.tsx` | Inserção não intrusiva do card no fluxo atual. |
| `src/types/database.ts` | Campos Systea da entidade manual de colaborador. |
| `src/integrations/supabase/types.ts` | Tipos Supabase atualizados manualmente para schema novo. |
| `docs/systea-employee-sync.md` | Arquitetura, secrets, operação e limitações. |

## Sequência TDD

1. Criar testes que definem status, vínculo determinístico, descarte de dados sensíveis, setor, preservação do vínculo local e paginação.
2. Executar o teste e confirmar falha por módulo inexistente.
3. Criar a implementação pura mínima em `_shared/systea-sync.ts`.
4. Executar o teste e confirmar aprovação.
5. Criar migration que adiciona somente colunas de integração e tabelas administrativas.
6. Criar Edge Function que reutiliza o módulo puro e mantém autenticação, secrets e persistência isoladas.
7. Criar hook/componente, confirmar a ação real e invalidar queries após sucesso.
8. Executar testes completos, lint, build e inspeções de segurança/diff.

## Regras de persistência

- A chave externa é `systea_admin_id`; `id` UUID interno nunca é substituído.
- Todos os registros são buscados e normalizados antes do primeiro upsert.
- Uma página inválida, repetida, fora da sequência ou com falha HTTP aborta a operação antes de escrita.
- Novos registros sem classificação determinística são `skipped` com `requires_manual_classification`.
- Em registros existentes, valores Systea nulos/vazios não substituem valores locais; `tipo_colaborador` local válido sempre prevalece.
- Não há exclusão por ausência no Systea.
- As operações em banco são em lote e a auditoria não retém payloads, tokens ou PII detalhada.

## Segurança

- `SYSTEA_BEARER_TOKEN` só é lido por `Deno.env.get` na Edge Function.
- O React nunca recebe a URL autenticada, token ou payload completo.
- A função requer token Supabase válido e allowlist ativa em `systea_sync_admins`.
- CORS permite apenas `RH_INSIGHTS_ALLOWED_ORIGIN`; não usa wildcard.
- Respostas de erro são sanitizadas e logs não incluem headers, token ou colaboradores.