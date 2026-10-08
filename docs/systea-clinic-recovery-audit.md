# Auditoria e recuperação de filiais — 08/10/2026

## Estado encontrado

O HEAD `8114b18` (Fixed unit lookup read error) contém as alterações do Lovable nos dois arquivos informados. O parser já lê o usuário diretamente, além do formato legado `{ user: { clinics } }`. Essa correção foi preservada.

O frontend já formatava todas as unidades, mas `useSysteaSync` não invalidava `colaborador-filiais`. As políticas de leitura existiam somente em `drizzle/migrations/0000_systea_clinic_read_policies.sql`; a migration Supabase que criava as tabelas habilitava RLS sem políticas SELECT. Isso pode ocultar vínculos existentes, dependendo das migrations realmente aplicadas. Não foi possível confirmar o banco publicado.

O identificador persistido vinha de `employee.id`, enquanto a consulta de clínicas usava `admin.user_id`. Agora ambos usam `admin.user_id`, com fallback validado para `employee.id`. Respostas que fornecem um ID diferente do solicitado são rejeitadas.

Só existem variáveis públicas VITE no `.env`. Não foram encontrados secrets Systea, credenciais administrativas de banco, Supabase CLI/Deno globais ou conector Supabase. Deno foi posteriormente executado por `npx` para validar tipos da função. Docker está instalado, mas seu daemon está desligado. Não houve deploy, escrita em produção, comparação com a função publicada nem consulta autenticada ao Systea.

Os tipos gerados também mencionam campos e RPCs de execução retomável (`next_page`, `lock_token`, `resumable`) sem implementação correspondente nesta Edge Function/migrations locais. Esse indício de divergência reforça a necessidade de comparar com o publicado antes do deploy; nenhuma funcionalidade remota foi presumida ou substituída.

## Alterações

- `supabase/functions/_shared/systea-sync.ts`: preservação da resposta direta, validação de ID e paginação, identidade consistente e rejeição de payloads inválidos.
- `supabase/functions/systea-employee-sync/index.ts`: recuperação em lotes de cinco, ordem estável por UUID, validação do offset, RPC aditiva, contagem de colaboradores com novos vínculos e logs sem mensagens brutas.
- `supabase/migrations/20261008140000_reconcile_systea_clinics.sql`: exige inscrição ativa em `rh_data_readers`, separada dos administradores de sincronização, além da visibilidade do colaborador e filial. Políticas restritivas impedem que políticas públicas antigas liberem colaboradores a usuários não autorizados. RPC exclusiva de service_role, com lock no colaborador, sem exclusões ou sobrescrita de filial administrativa válida.
- `src/features/systea-sync/useSysteaSync.ts`: recuperação paginada, atualização dos caches inclusive após falha parcial.
- `src/components/dashboard/SysteaSyncCard.tsx`: botão Recuperar filiais, progresso e pendências por identificador Systea.
- `src/components/dashboard/ColaboradoresList.tsx`: consulta em andamento e falhas deixam de aparecer como ausência de unidade.
- `src/hooks/useColaboradores.ts`: operações locais atualizam página e vínculos.
- `src/integrations/supabase/types.ts`: assinatura da nova RPC de recuperação.
- Testes novos e `supabase/diagnostics/systea-clinic-audit.sql`.

A recuperação adiciona apenas vínculos fornecidos pelo Systea. Lista vazia é identificada como `no_clinics_in_systea` e preserva vínculos locais. Payload ausente/inválido, clínica não mapeada e falha de persistência são pendências distintas. Não se deve interpretar todos os registros sem vínculo como sem clínicas no Systea.

## Validação local

`scripts/test-systea-clinic-persistence.mjs` executou as migrations reais em PostgreSQL isolado (PGlite), com fixtures sintéticas. Passaram persistência, idempotência, múltiplas unidades, preservação administrativa, rejeição de mapeamento inválido sem escrita parcial, SELECT autenticado com RLS, respeito à RLS do colaborador, bloqueio anônimo e bloqueio de RPC pelo cliente.

Para reproduzir sem adicionar dependências ao projeto:

```powershell
$testDirectory = Join-Path $env:TEMP 'rh-systea-persistence-test'
npm.cmd install --prefix $testDirectory --no-audit --no-fund @electric-sql/pglite
$env:PGLITE_MODULE = ([uri](Join-Path $testDirectory 'node_modules/@electric-sql/pglite/dist/index.js')).AbsoluteUri
node scripts/test-systea-clinic-persistence.mjs
```

Resultados executados:

- `npm.cmd test`: **54 testes passaram em 13 arquivos**, incluindo a renderização real da listagem, múltiplas unidades, fallback, erro de consulta, paginação da recuperação, invalidação de cache, resposta direta e IDs inválidos.
- `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` e `-p tsconfig.node.json --noEmit`: passaram.
- `npx.cmd --yes deno check --no-lock supabase/functions/systea-employee-sync/index.ts`: passou.
- `npm.cmd run build`: passou; aviso de bundle maior que 500 kB.
- ESLint dos dez arquivos TypeScript/TSX alterados ou adicionados: passou.
- `npm.cmd run lint`: falhou com **96 erros e 16 warnings em arquivos fora desta alteração**, principalmente `any`, `prefer-const` e interfaces vazias. Não foram modificados para manter o escopo.
- `git diff --check`: passou.

O build do plugin Lovable gera automaticamente `supabase/functions/mcp/index.ts` com caminho Windows inválido; o artefato foi restaurado ao conteúdo original após o build para não introduzir alteração alheia à correção.

## Concluir no ambiente real

1. Confirmar se `liqvudyxgceqpqkykgmp`, encontrado em `supabase/config.toml`, é o projeto correto e se representa produção ou homologação. Não executar os comandos de deploy sem essa confirmação e revisão do diff.
2. Configurar Supabase CLI autenticado (`npx.cmd supabase login`) e acesso autorizado ao banco; configurar Deno para verificar a Edge Function. Nunca colocar secrets no frontend ou enviar tokens pelo chat.
3. Baixar a versão publicada **em outro diretório**, para evitar sobrescrever a correção local:

```powershell
$publishedDirectory = Join-Path $env:TEMP ('rh-systea-published-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $publishedDirectory
Push-Location $publishedDirectory
npx.cmd supabase functions download systea-employee-sync --project-ref liqvudyxgceqpqkykgmp
Pop-Location
```

Comparar os dois arquivos baixados com os locais usando `git diff --no-index <arquivo-publicado> <arquivo-local>` e incorporar qualquer correção publicada mais recente antes de prosseguir. Consultar também a lista de migrations remotas e executar o SQL de diagnóstico antes de migrar.

4. Revisar RLS real de `colaboradores` e `filiais`. As migrations antigas contêm políticas públicas FOR ALL. A migration preparada passou a exigir a lista explícita `rh_data_readers`, conforme pedido de preparação da publicação, e bloqueia acesso anônimo aos colaboradores mesmo diante da política antiga. A autorização não vem automaticamente de `systea_sync_admins`. Revisar também views/RPCs SECURITY DEFINER e tabelas relacionadas antes de declarar confidencialidade global. Veja o [plano de publicação](systea-publication-plan.md).
5. Confirmar secrets no projeto: `SYSTEA_BASE_URL`, `SYSTEA_BEARER_TOKEN`, `RH_INSIGHTS_ALLOWED_ORIGIN` (origem exata do frontend), e configuração Supabase padrão `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. O usuário operador deve estar ativo em `systea_sync_admins`.
6. **Somente após confirmar destino e alterações**, revisar/aplicar migrations e publicar a função:

```powershell
npx.cmd supabase link --project-ref liqvudyxgceqpqkykgmp
npx.cmd supabase migration list --linked
npx.cmd supabase db push --linked --dry-run
deno check supabase/functions/systea-employee-sync/index.ts
# Após revisar TODAS as migrations pendentes:
npx.cmd supabase db push --linked
npx.cmd supabase functions deploy systea-employee-sync --project-ref liqvudyxgceqpqkykgmp
```

Publicar também o frontend pelo fluxo habitual do projeto. Não há alteração de configuração JWT nem desativação de RLS.

7. No frontend autenticado, executar **Recuperar filiais**. A rotina percorre os lotes via `mode: "reconcile-clinics", offset: N`, utilizando `nextOffset` até `done`. Registrar quantidade `corrected` e pendências exibidas. Lotes interrompidos podem ser reprocessados desde zero com segurança; evite importações/criações/exclusões simultâneas durante a recuperação por offset.
8. Rodar o diagnóstico novamente e comparar vínculos por colaborador. Conferir as duas Adrianas mencionadas, navegar entre páginas e confirmar todas as filiais na coluna, com fallback administrativo onde cabível. Testar com JWT de usuário autorizado, verificando a consulta de vínculos e filiais, além do relatório administrativo.

## Pendências e limites

Quantidade de colaboradores reais corrigidos: **não verificada**. Os testes usaram apenas fixtures locais. Estrutura efetiva do endpoint em produção, políticas publicadas, versão publicada da função, quatro mapeamentos locais e exibição no ambiente real ainda precisam da validação autenticada acima.

A sincronização completa ainda consulta todos os detalhes de forma sequencial numa única execução; grandes volumes podem exceder o tempo da Edge Function. A recuperação usa lotes pequenos para evitar esse gargalo. A gravação dos dados profissionais e dos vínculos na sincronização completa usa duas RPCs distintas; se a segunda falhar, os dados profissionais podem já estar persistidos. Os caches agora são atualizados também nesse caso e a recuperação permite completar vínculos sem apagar dados.

O `package-lock.json` já estava fora de sincronia com `package.json` (Drizzle/Postgres ausentes); `npm ci` falha. A instalação de validação usa `npm.cmd install --package-lock=false`, preservando os arquivos de dependências existentes.

Alterações pré-existentes em `src/features/overview/useOverviewAnalytics.ts` e arquivos não rastreados do usuário foram preservadas.
