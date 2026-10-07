# Integração de colaboradores com Systea

## Arquitetura

O navegador chama somente a Edge Function autenticada `systea-employee-sync`. A função valida o JWT do usuário e verifica sua presença ativa em `systea_sync_admins`; somente então lê `SYSTEA_BASE_URL` e `SYSTEA_BEARER_TOKEN` dos secrets do ambiente, consulta o Systea, normaliza dados permitidos e grava em lote no Supabase.

## Fluxo seguro

1. Carregar `/api/system/rh/sectors` uma vez.
2. Buscar manualmente todas as páginas de `/api/system/rh/admin?page=N`, sem seguir URLs retornadas pela API.
3. Validar paginação, resposta JSON e registros; falhas parciais impedem qualquer upsert.
4. Normalizar somente campos necessários ao RH Insights.
5. Comparar por `systea_admin_id` e classificar em criar, atualizar, inalterado, ignorado ou erro.
6. Para cada registro elegível, buscar `GET /api/system/user/{admin.user_id}` e validar `user.clinics` antes de qualquer escrita.
7. Em `dry-run`, retornar o resumo sem escrever no banco. Em `sync`, fazer upsert em lote, sincronizar filiais e registrar auditoria resumida em `systea_sync_runs`.

## Classificação de vínculo

- regime PJ reconhecido: `PJ`;
- regime CLT e `area.type = attendance`: `CLT Corpo Clínico`;
- regime CLT e `area.type = general`: `CLT Administrativo`;
- regime de estágio explicitamente reconhecido: `Estagiário`;
- outro caso: `requires_manual_classification`; o registro é ignorado, sem categoria inventada.

Em colaboradores existentes, `tipo_colaborador` local é preservado. Só é preenchido automaticamente se estiver ausente ou inválido e houver classificação determinística.

## Dados sincronizados

São sincronizados identificadores Systea, nome social/nome, e-mail, cargo contratado, setor resolvido, área, regime original, datas de admissão/primeiro dia, local de trabalho, cargas horárias, status, indicadores de desligamento e timestamps Systea.

Não são armazenados ou expostos tokens, documentos, credenciais, permissões, anexos, dados familiares, CPF/RG/PIS/CTPS, JSON bruto ou URLs sensíveis.

## Filiais de atuação e filial principal

- `colaboradores.filial_id` é a **filial principal administrativa** do colaborador.
- `colaborador_filiais` contém todas as filiais onde ele está autorizado a atuar conforme `user.clinics` no Systea.
- `systea_clinic_filiais` mantém o mapeamento auditável entre clínicas Systea e filiais locais:
  - `1` → Matriz;
  - `2` → Parquelândia;
  - `3` → Life (registro local: `Unidade Life`);
  - `4` → Sul (registro local: `Unidade Sul`).
- Quando o Systea retornar apenas uma clínica, ela será a filial principal automaticamente.
- Para duas ou mais clínicas, a `filial_id` administrativa já escolhida é preservada e não é inferida pelo Systea. Quando essa filial também estiver na lista sincronizada, seu vínculo recebe `is_primary = true`; caso contrário, os vínculos Systea permanecem sem principal, sem apagar a definição administrativa local.
- A alteração local de `colaboradores.filial_id` para uma filial já vinculada também atualiza `is_primary`, de forma que a próxima sincronização não reverta a escolha manual.
- Se o Systea remover uma clínica — ou retornar nenhuma — somente os vínculos correspondentes em `colaborador_filiais` são removidos; não há exclusão do colaborador nem limpeza automática da filial administrativa local.

## Secrets necessários

- `SYSTEA_BASE_URL` (por padrão operacional: `https://npc.systea.com.br`)
- `SYSTEA_BEARER_TOKEN`
- secrets padrão do Supabase usados pela Edge Function (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- `RH_INSIGHTS_ALLOWED_ORIGIN` para CORS restrito

Os secrets devem ser configurados no ambiente Supabase; nunca em arquivos rastreados, migrations, banco de dados ou frontend.

## Operação

No painel de colaboradores, um administrador autorizado executa primeiro o dry-run e, após revisar o resumo, confirma a sincronização real. A função aceita `mode: "dry-run"` ou `mode: "sync"`; chamadas diretas exigem JWT de um usuário incluído em `systea_sync_admins`.

## Limitações

A integração não deleta colaboradores locais ausentes no Systea e não adivinha vínculos desconhecidos. A conta de integração usa bearer token temporário, isolado em secret, até que exista autenticação Systea oficialmente documentada para substituí-lo.