# Preparação da publicação — 08/10/2026

Atualização: o usuário confirmou que o backend é **Lovable Cloud**, com 381 colaboradores informados. A quantidade não foi consultada no banco nesta auditoria. O repositório configurado é `https://github.com/samuelalbuquerque01/rhindicadores-49d694be`, e as correções serão enviadas à `main`, conectada ao Lovable conforme informado pelo usuário.

Os comandos Supabase abaixo só se aplicam se a conta tiver acesso administrativo direto ao projeto gerenciado; esse acesso ainda não foi demonstrado. A publicação do código no GitHub não substitui a comparação com o backend publicado nem autoriza executar a recuperação real. No Lovable Cloud, validar migrations, secrets e provisionamento da lista RH pelo acesso administrativo disponível no próprio ambiente. Não presumir que as credenciais da CLI existam ou que o push confirme a aplicação de migrations/Edge Functions.

Antes de ativar a migration RLS no ambiente real, provisionar a lista aprovada de usuários RH na janela planejada: como a lista nasce vazia, a consulta de colaboradores pelos clientes fica bloqueada até esse provisionamento. Não foram cadastrados UUIDs nem acessados colaboradores reais.

## Resultado da inspeção executada

| Verificação | Resultado |
| --- | --- |
| Project ID no `supabase/config.toml` | `liqvudyxgceqpqkykgmp` |
| Project ID e host no `.env` do frontend | mesmo ID; `liqvudyxgceqpqkykgmp.supabase.co` |
| CLI | `2.120.0`, executada por `npx.cmd` |
| `supabase projects list --output json` | falhou: Access token not provided |
| Vínculo local (`supabase/.temp/project-ref`) | ausente |
| `supabase migration list --linked` | falhou: ProjectRefNotLinkedError |
| `supabase db push --linked --dry-run` | executado, mas bloqueado antes de consultar o banco: ProjectRefNotLinkedError |
| `supabase secrets list --project-ref ... --output json` | falhou: Access token not provided; nenhum valor/digest exibido |
| Download da função em diretório separado com `--use-api` | falhou: AccessTokenRequiredError; arquivos locais preservados |
| Banco remoto / função publicada / secrets existentes | ainda não verificados |
| Deploy, migrations reais, recuperação real | não executados |

O ID do projeto configurado está confirmado. O nome remoto, propriedade, classificação produção/homologação e acesso ao projeto exigem a autenticação abaixo. Os tipos gerados mencionam execução retomável ausente da função local: comparar o publicado é obrigatório antes de publicar.

## RLS revisada

Conforme confirmação do usuário, a fonte de autorização é uma **lista específica de usuários do RH**, separada dos administradores de sincronização. A migration local ainda não publicada `20261008140000_reconcile_systea_clinics.sql` agora cria `rh_data_readers` com inscrição administrativa de UUIDs de `auth.users`. A lista começa vazia, sem inscrição automática por login, cadastro ou presença em `systea_sync_admins`.

`is_rh_data_reader()` verifica o `auth.uid()` atual e a inscrição ativa, com `SECURITY DEFINER` e `search_path` vazio. O frontend pode verificar apenas sua própria condição; não pode consultar, alterar ou autoinscrever-se na tabela de autorização.

- `colaboradores`: gate RESTRICTIVE para usuários autenticados exige inscrição RH ativa; gate para `anon` bloqueia todas as operações. As políticas existentes continuam sujeitas a essas condições. Não são concedidas novas permissões de escrita a clientes.
- `colaborador_filiais` e `systea_clinic_filiais`: somente SELECT autenticado com inscrição RH ativa, sujeito também à visibilidade dos registros relacionados. Escritas de cliente são revogadas. `service_role` mantém a operação do backend.
- RLS permanece habilitada. A RPC de recuperação continua exclusiva de `service_role`.

Políticas permissivas se combinam com OR; uma nova política permissiva de RH sozinha não corrigiria a antiga política pública. As restritivas se combinam com AND, conforme [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html).

O teste `scripts/test-systea-clinic-persistence.mjs` passou novamente com as migrations reais em PostgreSQL isolado. Confirmou RH ativo autorizado, usuário autenticado fora da lista bloqueado, RH inativo bloqueado, anônimo bloqueado mesmo com política pública antiga, autoinscrição negada e RPC negada ao cliente, além da persistência/idempotência/preservação já verificadas.

Antes da publicação, revisar as views, RPCs SECURITY DEFINER e tabelas relacionadas (`afastamentos`, `contratacoes`, `desligamentos`) no diagnóstico. A migration protege diretamente os colaboradores e seus vínculos; não comprova ausência de exposição por outras rotas remotas. A tela atual permite cadastro de contas, portanto autenticação não deve equivaler a autorização.

## 1. Autenticar e conferir destino — sem deploy

Executar no workspace, com login interativo. Não passar token ou senha na linha de comando nem colar valores no chat. Comandos fixam a versão de CLI utilizada nesta auditoria.

```powershell
$projectRef = 'liqvudyxgceqpqkykgmp'
$workspaceDirectory = (Get-Location).Path
npx.cmd --yes supabase@2.120.0 login
npx.cmd --yes supabase@2.120.0 projects list
# Conferir nome, organização e ID na lista antes de vincular.
npx.cmd --yes supabase@2.120.0 link --project-ref $projectRef
if ($LASTEXITCODE -ne 0) { throw 'Falha ao vincular; não prosseguir.' }
$linkedProject = (Get-Content -LiteralPath 'supabase/.temp/project-ref' -Raw).Trim()
if ($linkedProject -ne $projectRef) { throw 'Projeto vinculado incorreto; não prosseguir.' }
npx.cmd --yes supabase@2.120.0 migration list --linked
npx.cmd --yes supabase@2.120.0 db push --linked --dry-run
```

O `link` altera somente configuração local e pode pedir senha de banco. Não usar `db reset`, `migration repair`, `--include-all` ou confirmação automática para contornar divergências. `migration list` compara versões, não prova igualdade do SQL de migrations antigas. Se houver versões remotas ausentes localmente, trazer e revisar o histórico em diretório separado antes de prosseguir. Se a nova migration já tiver sido aplicada por outro operador, preservar esse arquivo e transformar a alteração de RLS em uma nova migration com versão inédita.

Se necessário, verificar versões/SQL no SQL Editor, somente leitura:

```sql
SELECT version, name, statements
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

Guardar o resultado em arquivo privado; o histórico pode conter dados de provisionamento. Comparar os statements com o SQL local e o schema dump remoto, pois o histórico pode não armazenar todos os statements. Executar também `supabase/diagnostics/systea-clinic-audit.sql` no SQL Editor autorizado.

## 2. Copiar o publicado e comparar — sem deploy

```powershell
$backupDirectory = Join-Path $env:USERPROFILE ('RH-Indicadores-backups/' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $backupDirectory | Out-Null
$publishedDirectory = Join-Path $backupDirectory 'published-function'
New-Item -ItemType Directory -Path $publishedDirectory | Out-Null
npx.cmd --yes supabase@2.120.0 functions list --project-ref $projectRef --output json |
  Set-Content -LiteralPath (Join-Path $backupDirectory 'function-metadata.json') -Encoding utf8
if ($LASTEXITCODE -ne 0) { throw 'Falha ao ler metadados da função.' }
Push-Location $publishedDirectory
try {
  npx.cmd --yes supabase@2.120.0 init
  npx.cmd --yes supabase@2.120.0 functions download systea-employee-sync --project-ref $projectRef --use-api
  if ($LASTEXITCODE -ne 0) { throw 'Download falhou; não há backup de função válido.' }
} finally { Pop-Location }
git diff --no-index -- (Join-Path $publishedDirectory 'supabase/functions/systea-employee-sync/index.ts') (Join-Path $workspaceDirectory 'supabase/functions/systea-employee-sync/index.ts')
git diff --no-index -- (Join-Path $publishedDirectory 'supabase/functions/_shared/systea-sync.ts') (Join-Path $workspaceDirectory 'supabase/functions/_shared/systea-sync.ts')
```

`git diff --no-index` retorna 1 quando há diferenças, sem significar falha de leitura. O download pode reconstruir layout diferente, gerar bundle ou mudar o caminho do módulo compartilhado; localizar o código equivalente e comparar parser, identificação, paginação, autorização e persistência. Se necessário, exportar o fonte pelo Dashboard autorizado. Não ignorar diferenças estruturais nem publicar até integrar correções remotas mais recentes. Preservar também config/import map e o modo JWT publicado; não alterar JWT por suposição.

## 3. Conferir secrets — somente nomes

```powershell
$secretMetadata = & npx.cmd --yes supabase@2.120.0 secrets list --project-ref $projectRef --output json
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível verificar os secrets.' }
$secretNames = @($secretMetadata | ConvertFrom-Json | ForEach-Object { $_.name })
$requiredNames = @('SYSTEA_BASE_URL', 'SYSTEA_BEARER_TOKEN', 'RH_INSIGHTS_ALLOWED_ORIGIN', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY')
$requiredNames | ForEach-Object {
  [pscustomobject]@{ Name = $_; Listed = ($secretNames -contains $_) }
}
Remove-Variable secretMetadata -ErrorAction SilentlyContinue
```

Os secrets padrão Supabase são injetados pelo ambiente e podem não aparecer na mesma lista de secrets customizados. Confirmar esses nomes no Dashboard/ambiente da função sem imprimir os valores. A lista de nomes não prova validade do token nem correspondência da origem. Conferir privadamente que a origem configurada é a origem exata do frontend, incluindo esquema e porta. Configurar valores ausentes pelo Dashboard ou arquivo privado fora do repositório (`secrets set --env-file <arquivo-privado>`), somente com autorização para alterar secrets. Guardar versões anteriores no gerenciador de segredos para rollback.

## 4. Backup e ensaio — antes de qualquer publicação

Verificar disponibilidade de backup/PITR e anotar ponto de restauração no Dashboard. Há diferenças por plano e backup do banco não inclui os próprios objetos de Storage, conforme [documentação de backups do Supabase](https://supabase.com/docs/guides/platform/backups).

Os dumps abaixo são complementares ao backup da plataforma. Exigem Docker em execução e acesso ao banco; guardar em diretório privado, fora do repositório. Não exibir conteúdo no chat.

```powershell
npx.cmd --yes supabase@2.120.0 db dump --linked --schema public --file (Join-Path $backupDirectory 'public-schema-before.sql')
if ($LASTEXITCODE -ne 0) { throw 'Backup de schema falhou.' }
npx.cmd --yes supabase@2.120.0 db dump --linked --schema public --data-only --use-copy --file (Join-Path $backupDirectory 'public-data-before.sql')
if ($LASTEXITCODE -ne 0) { throw 'Backup de dados falhou.' }
npx.cmd --yes supabase@2.120.0 db dump --linked --schema supabase_migrations --data-only --file (Join-Path $backupDirectory 'migration-history-before.sql')
if ($LASTEXITCODE -ne 0) { throw 'Backup do histórico falhou.' }
Copy-Item -LiteralPath 'supabase/config.toml' -Destination (Join-Path $backupDirectory 'local-config-before.toml')
```

Preservar também o artefato/versão do frontend publicado. Validar que os dumps possuem conteúdo e fazer ensaio de restauração em instância isolada; apenas existência de arquivo não garante backup utilizável. Esses dumps de `public` não são backup completo de Auth/Storage/secrets/Edge Functions. Preservar Auth por backup/PITR da plataforma e a função pelo download. Não restaurar o dump inteiro sobre produção ativa.

## 5. Plano de publicação — comandos preparados, NÃO executados

Pré-requisitos: destino e diff aprovados, comparação com Lovable concluída, dry-run revisado, backup validado, lista de usuários RH aprovada com UUIDs conferidos e janela operacional definida. Ensaiar em homologação a mesma sequência abaixo antes de produção.

**Provisionamento da lista:** a migration começa com acesso negado a todos os clientes. Publicar em janela controlada e cadastrar imediatamente os UUIDs aprovados no SQL Editor administrativo; sem lista provisionada, telas de colaboradores ficam sem dados. Não cadastrar todos os usuários de `auth.users`, não copiar automaticamente administradores da sincronização e não usar UUIDs inventados.

```sql
-- Substituir o placeholder pelo UUID de um usuário RH aprovado existente em auth.users.
INSERT INTO public.rh_data_readers (user_id, active)
VALUES ('<UUID-RH-APROVADO>'::uuid, true)
ON CONFLICT (user_id) DO UPDATE SET active = EXCLUDED.active;
```

Comandos de publicação, somente após autorização explícita:

```powershell
npx.cmd --yes supabase@2.120.0 migration list --linked
npx.cmd --yes supabase@2.120.0 db push --linked --dry-run
# Aplicar apenas quando TODAS as migrations exibidas tiverem sido revisadas:
npx.cmd --yes supabase@2.120.0 db push --linked
# Provisionar a lista aprovada no SQL Editor e validar a RLS antes da função.
npx.cmd --yes supabase@2.120.0 functions deploy systea-employee-sync --project-ref $projectRef --use-api
```

Não usar `functions deploy` sem nome (publicaria outras funções), `--prune` ou `--no-verify-jwt`. O `--yes` neste bloco é do npx, antes do pacote; não é confirmação automática do `db push`. Preservar o modo JWT/config da versão remota após a comparação.

Publicar o frontend pelo fluxo existente com artefato validado (`npm.cmd run build`), garantindo o mesmo Project ID. O plugin Lovable pode regenerar a função `mcp` durante o build; revisar o diff e não incluir essa alteração na publicação.

## 6. Validação sem recuperar colaboradores reais

1. Reexecutar o SQL de diagnóstico, conferir RLS, grants, mapeamentos e ausência de alteração nos vínculos/filiais administrativos. Aplicar a migration e publicar a função não inicia automaticamente a recuperação.
2. Com usuário RH ativo, consultar lista/vínculos e exibir todas as filiais. Com usuário autenticado fora da lista e com RH inativo, verificar ausência de colaboradores/vínculos; anônimo deve ser bloqueado. Usar sessões reais também, não apenas SQL Editor administrativo, que ignora RLS como proprietário.
3. No SQL Editor, o teste de papel pode ser feito em transação sem alterar dados:

```sql
BEGIN;
SELECT set_config('request.jwt.claim.sub', '<UUID-RH-APROVADO>', true);
SET LOCAL ROLE authenticated;
SELECT public.is_rh_data_reader(); -- esperado true
SELECT count(*) FROM public.colaboradores;
SELECT count(*) FROM public.colaborador_filiais;
ROLLBACK;
```

Repetir com UUID existente fora da lista (esperado false/zero), usuário inativo e papel anon. Para validar inatividade sem mudar um usuário real, usar conta de homologação já provisionada como inativa. Clientes não podem inserir em `rh_data_readers` nem executar a RPC de recuperação; testar negação em homologação ou usando as permissões do catálogo, sem tentativa de alterar registros reais.

4. Ler `last-run` pela interface para conferir autorização da função sem escrita. Se aprovado executar a prévia, `dry-run` consulta o Systea e valida dados sem gravar colaboradores; não iniciar `sync` ou `reconcile-clinics` nesta fase.
5. Recuperação real continua dependente de **outra autorização explícita**. Quando autorizada, congelar criações/exclusões/importações concorrentes durante a paginação por offset, salvar snapshot de vínculos, executar somente **Recuperar filiais** e comparar antes/depois.

## 7. Segurança dos lotes e limites

`reconcile-clinics` usa lotes de cinco, ordenados por UUID, `offset/nextOffset` e timeout por chamada. Cada colaborador chama a RPC aditiva sob lock de sua linha: `INSERT ... ON CONFLICT DO NOTHING`, sem DELETE. A filial administrativa é preenchida apenas se estiver NULL e existir exatamente um vínculo; uma filial administrativa já definida é preservada. Lista vazia não provoca escrita. Clínica sem mapeamento, resposta inválida e falhas aparecem como pendências. Repetir lotes não duplica vínculos.

Isso é diferente de `sync`: a rotina normal já existente remove vínculos ausentes da resposta e pode trocar a filial administrativa quando há uma única clínica. **Não usar `sync` como recuperação conservadora.** A pausa em alterações concorrentes evita deslocamento de páginas; se um lote for interrompido, reprocessar desde zero é idempotente. Não há exclusão automática de colaboradores.

## 8. Rollback

- Falha antes de migrations/deploy: parar; não há mudança remota a desfazer. Não reparar histórico automaticamente.
- Falha da nova função: republicar exclusivamente a função baixada, com configuração JWT/import map preservada. Comandos preparados, dependem de autorização:

```powershell
Push-Location $publishedDirectory
try {
  npx.cmd --yes supabase@2.120.0 functions deploy systea-employee-sync --project-ref $projectRef --use-api
  if ($LASTEXITCODE -ne 0) { throw 'Rollback da função falhou.' }
} finally { Pop-Location }
```

- Falha do frontend: restaurar o artefato anterior pelo provedor atual. Manter RLS restrita; a interface anterior só deverá acessar dados com usuário RH autorizado.
- Problema na RLS: corrigir o UUID/inscrição aprovada ou publicar migration corretiva. Não restaurar políticas públicas antigas, não desativar RLS e não remover gates para recuperar a tela. A tabela de autorização vazia nega acesso por projeto; não é motivo para conceder acesso a todo usuário autenticado.
- Necessidade de suspender a recuperação preparada: sob autorização administrativa, revogar a execução da nova RPC, mantendo RLS e dados:

```sql
REVOKE EXECUTE ON FUNCTION public.reconcile_systea_colaborador_filiais(uuid, integer[], timestamptz)
FROM service_role;
```

Isso bloqueia a rotina nova, mas não prova que uma função antiga deixará de aceitar `reconcile-clinics`: a versão local anterior usava a RPC de sincronização normal. Antes de restaurar o fonte antigo, verificar esse caminho. Para suspender todas as versões de recuperação, publicar uma alteração revisada que recuse esse modo e desabilitar o botão no frontend; não revogar indiscriminadamente as RPCs usadas pela sincronização normal.

- Migrations são expansivas: preferir rollback de código e manter tabela/RLS/RPC sem uso. Não excluir tabelas nem dados para reverter esta publicação, e não remover linhas do histórico de migrations.
- Recuperação não autorizada nesta publicação: portanto não há vínculos reais a desfazer. Se uma recuperação for autorizada depois, registrar previamente um ledger privado por colaborador/vínculo. Eventual rollback de dados deve usar snapshot/ledger e excluir somente vínculos comprovadamente inseridos por aquela execução, considerando alterações concorrentes; não apagar por `synced_at` ou restaurar indiscriminadamente um dump.
- Restauração integral por PITR/backup é último recurso, com autorização explícita, janela e avaliação de perdas de alterações posteriores. Ensaiar antes em instância isolada.

## Bloqueios atuais para concluir

Faltam login da CLI, vínculo verificado, acesso administrativo de banco, classificação do ambiente, lista aprovada de UUIDs de RH, consulta de secrets e comparação com a função/migrations remotas. A publicação só será revisável em definitivo após esses itens. Nenhum deploy ou recuperação real foi executado nesta preparação.
