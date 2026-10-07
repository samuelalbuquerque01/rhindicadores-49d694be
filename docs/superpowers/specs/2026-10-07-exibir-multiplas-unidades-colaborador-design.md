# Exibição de múltiplas unidades do colaborador

**Data:** 7 de outubro de 2026  
**Status:** aprovado para especificação; aguardando revisão do documento

## Objetivo

Fazer a coluna **Filial** da lista de colaboradores representar todas as unidades de trabalho sincronizadas do Systea, não apenas o campo administrativo `colaboradores.filial_id`.

O usuário selecionou a opção visual A: exibir os nomes completos das unidades diretamente na célula, separados por vírgula.

## Contexto

A sincronização multiunidade persiste os vínculos de trabalho na tabela `colaborador_filiais`. Cada linha associa um colaborador a uma filial local e contém `is_primary`, que indica a unidade principal entre os vínculos sincronizados.

O campo `colaboradores.filial_id` continua existindo como filial administrativa principal. Ele pode estar vazio para registros que não têm uma filial administrativa preenchida, mesmo havendo atribuições em `colaborador_filiais`.

O relacionamento administrativo `colaboradores -> filiais` deve continuar sendo selecionado explicitamente por `filiais!colaboradores_filial_id_fkey(*)`, pois há mais de uma relação entre as tabelas desde a criação de `colaborador_filiais`.

## Comportamento da coluna Filial

Para cada colaborador visível na página atual:

1. Consultar os vínculos de `colaborador_filiais` daquele conjunto de IDs, incluindo a filial associada por `filiais!colaborador_filiais_filial_id_fkey(*)`.
2. Se existirem vínculos sincronizados, mostrar todos os nomes de filial separados por `, `.
3. Ordenar os nomes de forma determinística: vínculo marcado como `is_primary` primeiro; os demais em ordem alfabética pelo nome da filial.
4. Se não houver vínculo em `colaborador_filiais`, usar a filial administrativa existente em `colaborador.filial_id` como fallback.
5. Se não houver vínculo sincronizado nem filial administrativa, mostrar `-`.

Exemplos:

| Vínculos multiunidade | Filial administrativa | Exibição |
| --- | --- | --- |
| Matriz (principal), Unidade Sul | Matriz | `Matriz, Unidade Sul` |
| Unidade Life | Unidade Life | `Unidade Life` |
| nenhum | Parquelândia | `Parquelândia` |
| nenhum | nenhuma | `-` |

## Arquitetura

### Consulta em lote por página

O componente `ColaboradoresList` já recebe uma página paginada de colaboradores. A implementação buscará os vínculos apenas para esses IDs, usando uma única consulta React Query para `colaborador_filiais` com filtro `in("colaborador_id", employeeIds)`.

O resultado será transformado em um `Map<string, ColaboradorFilial[]>`, indexado por `colaborador_id`. Isso evita uma consulta por linha (N+1), preserva a paginação atual e permite renderização síncrona da célula.

### Renderização

Uma função de apresentação receberá o colaborador e o mapa de vínculos:

- usa os nomes das atribuições caso o mapa tenha entradas para ele;
- caso contrário, resolve o nome da filial administrativa com a lista já carregada por `useFiliais`;
- retorna `-` quando não houver fonte de filial.

Nenhuma alteração será feita na regra atual dos filtros de filial, que ainda usam `colaboradores.filial_id`. Este trabalho é estritamente de visibilidade na lista, não de redefinição de filtros ou métricas.

## Tratamento de carregamento e erro

Enquanto a consulta de vínculos estiver carregando, a célula de filial poderá apresentar o fallback administrativo disponível; quando os vínculos retornarem, ela será atualizada automaticamente pela React Query.

Se a consulta de vínculos falhar, a lista de colaboradores continuará visível e a célula manterá o fallback administrativo. A melhoria global para exibir erros de consulta na listagem permanece fora deste escopo.

## Testes

Os testes devem comprovar a regra de apresentação, sem depender de chamadas reais ao Supabase:

1. Várias atribuições: mostra todas as unidades, com a principal primeiro e as demais ordenadas por nome.
2. Nenhuma atribuição: usa a filial administrativa como fallback.
3. Nenhuma atribuição e nenhuma filial administrativa: mostra `-`.
4. A consulta de atribuições é em lote, filtrada pelos IDs da página atual, e seleciona explicitamente a relação `colaborador_filiais_filial_id_fkey`.

Também devem ser executados o teste de regressão `administrativeFilialRelation.test.ts` e o build de produção.

## Fora de escopo

- Alterar ou preencher automaticamente `colaboradores.filial_id`.
- Mudar o comportamento dos filtros globais por filial.
- Alterar a sincronização Systea ou a migração do banco de dados.
- Criar edição manual dos vínculos multiunidade.
- Implementar a mensagem visível de erro da lista quando uma query falhar.