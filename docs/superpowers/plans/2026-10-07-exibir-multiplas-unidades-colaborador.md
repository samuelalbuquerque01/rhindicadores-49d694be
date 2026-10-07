# Exibir múltiplas unidades do colaborador Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use /long-haul-development.md to implement this plan task-by-task (disk-backed plan + journal, `/newtask` relay, review gates). For a plan small enough to finish in one session, /executing-plans.md is the simpler inline path. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir na coluna Filial todos os vínculos multiunidade sincronizados do colaborador, mantendo a filial administrativa como fallback.

**Architecture:** Criar utilitários puros para agrupar atribuições por colaborador e formatar o texto da coluna. Criar um hook React Query que busca em lote os vínculos apenas dos IDs da página atual. Integrar o hook e o formatador em `ColaboradoresList`, sem modificar os filtros atuais baseados em `colaboradores.filial_id`.

**Tech Stack:** React 18, TypeScript, TanStack React Query v5, Supabase JS, Vitest.

---

## File Structure

| Arquivo | Responsabilidade |
| --- | --- |
| `src/lib/employeeFiliais.ts` | Tipos de leitura, agrupamento por colaborador e formatação determinística dos nomes de filiais. |
| `src/lib/employeeFiliais.test.ts` | Testes puros para múltiplas unidades, fallback administrativo e ausência de dados. |
| `src/hooks/useColaboradorFiliais.ts` | Consulta React Query em lote à tabela `colaborador_filiais` para os IDs visíveis. |
| `src/features/systea-sync/colaboradorFiliaisQuery.test.ts` | Proteção contra regressão: garante a consulta em lote e a FK explícita da filial da atribuição. |
| `src/components/dashboard/ColaboradoresList.tsx` | Obtém o mapa de atribuições da página e renderiza a coluna Filial com os nomes completos. |

### Task 1: Utilitários puros para unidades exibidas

**Files:**
- Create: `C:\Users\npc\Downloads\rhindicadores-main-filiais\src\lib\employeeFiliais.ts`
- Create: `C:\Users\npc\Downloads\rhindicadores-main-filiais\src\lib\employeeFiliais.test.ts`

- [ ] **Step 1: Escrever os testes que falham para agrupamento e texto da coluna**

```ts
import { describe, expect, it } from "vitest";
import {
  buildColaboradorFiliaisMap,
  formatColaboradorFiliais,
  type ColaboradorFilialAssignment,
} from "./employeeFiliais";

const assignments: ColaboradorFilialAssignment[] = [
  {
    colaborador_id: "employee-1",
    filial_id: "sul",
    is_primary: false,
    filial: { id: "sul", nome: "Unidade Sul" },
  },
  {
    colaborador_id: "employee-1",
    filial_id: "matriz",
    is_primary: true,
    filial: { id: "matriz", nome: "Matriz" },
  },
  {
    colaborador_id: "employee-1",
    filial_id: "life",
    is_primary: false,
    filial: { id: "life", nome: "Unidade Life" },
  },
];

describe("filiais exibidas do colaborador", () => {
  it("agrupa atribuições pelo colaborador", () => {
    const map = buildColaboradorFiliaisMap(assignments);

    expect(map.get("employee-1")).toHaveLength(3);
  });

  it("exibe a filial principal primeiro e ordena as demais por nome", () => {
    const map = buildColaboradorFiliaisMap(assignments);

    expect(formatColaboradorFiliais("employee-1", map, "Administrativa")).toBe(
      "Matriz, Unidade Life, Unidade Sul",
    );
  });

  it("usa a filial administrativa quando não existem atribuições sincronizadas", () => {
    expect(formatColaboradorFiliais("employee-2", new Map(), "Parquelândia")).toBe("Parquelândia");
  });

  it("exibe hífen quando não existe atribuição nem filial administrativa", () => {
    expect(formatColaboradorFiliais("employee-3", new Map(), undefined)).toBe("-");
  });
});
```

- [ ] **Step 2: Executar o teste para confirmar que falha pela ausência do módulo**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
npm test -- src/lib/employeeFiliais.test.ts
```

Expected: FAIL com erro de resolução de `./employeeFiliais`, pois o módulo ainda não existe.

- [ ] **Step 3: Implementar os tipos, agrupamento e formatação mínima**

```ts
export interface ColaboradorFilialAssignment {
  colaborador_id: string;
  filial_id: string;
  is_primary: boolean;
  filial: {
    id: string;
    nome: string;
  } | null;
}

export function buildColaboradorFiliaisMap(
  assignments: ColaboradorFilialAssignment[],
): Map<string, ColaboradorFilialAssignment[]> {
  const assignmentsByColaborador = new Map<string, ColaboradorFilialAssignment[]>();

  assignments.forEach((assignment) => {
    const current = assignmentsByColaborador.get(assignment.colaborador_id) ?? [];
    current.push(assignment);
    assignmentsByColaborador.set(assignment.colaborador_id, current);
  });

  return assignmentsByColaborador;
}

export function formatColaboradorFiliais(
  colaboradorId: string,
  assignmentsByColaborador: Map<string, ColaboradorFilialAssignment[]>,
  administrativeFilialName?: string,
): string {
  const assignments = assignmentsByColaborador.get(colaboradorId) ?? [];
  const branchNames = assignments
    .filter((assignment) => assignment.filial?.nome)
    .sort((left, right) => {
      if (left.is_primary !== right.is_primary) return left.is_primary ? -1 : 1;
      return left.filial!.nome.localeCompare(right.filial!.nome, "pt-BR");
    })
    .map((assignment) => assignment.filial!.nome);

  return branchNames.join(", ") || administrativeFilialName || "-";
}
```

- [ ] **Step 4: Executar os testes puros para confirmar que passam**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
npm test -- src/lib/employeeFiliais.test.ts
```

Expected: PASS com 4 testes aprovados.

- [ ] **Step 5: Committar o utilitário testado**

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
git add src/lib/employeeFiliais.ts src/lib/employeeFiliais.test.ts
git commit -m "feat: format employee multi-branch assignments"
```

### Task 2: Hook de consulta em lote para a página visível

**Files:**
- Create: `C:\Users\npc\Downloads\rhindicadores-main-filiais\src\hooks\useColaboradorFiliais.ts`
- Create: `C:\Users\npc\Downloads\rhindicadores-main-filiais\src\features\systea-sync\colaboradorFiliaisQuery.test.ts`

- [ ] **Step 1: Escrever o teste de regressão que falha para a forma da consulta**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("consulta de atribuições multiunidade", () => {
  it("busca os vínculos da página em lote e usa a FK explícita da filial", () => {
    const source = readFileSync(resolve(process.cwd(), "src/hooks/useColaboradorFiliais.ts"), "utf8");

    expect(source).toContain('queryKey: ["colaborador-filiais", colaboradorIds]');
    expect(source).toContain('.from("colaborador_filiais")');
    expect(source).toContain('filial:filiais!colaborador_filiais_filial_id_fkey(id, nome)');
    expect(source).toContain('.in("colaborador_id", colaboradorIds)');
    expect(source).toContain("enabled: colaboradorIds.length > 0");
  });
});
```

- [ ] **Step 2: Executar o teste para confirmar que falha pela ausência do hook**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
npm test -- src/features/systea-sync/colaboradorFiliaisQuery.test.ts
```

Expected: FAIL com erro `ENOENT` para `src/hooks/useColaboradorFiliais.ts`.

- [ ] **Step 3: Implementar a consulta React Query em lote**

```ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  buildColaboradorFiliaisMap,
  type ColaboradorFilialAssignment,
} from "@/lib/employeeFiliais";

export function useColaboradorFiliais(colaboradorIds: string[]) {
  return useQuery({
    queryKey: ["colaborador-filiais", colaboradorIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaborador_filiais")
        .select("colaborador_id, filial_id, is_primary, filial:filiais!colaborador_filiais_filial_id_fkey(id, nome)")
        .in("colaborador_id", colaboradorIds);

      if (error) throw error;

      return buildColaboradorFiliaisMap((data ?? []) as ColaboradorFilialAssignment[]);
    },
    enabled: colaboradorIds.length > 0,
  });
}
```

- [ ] **Step 4: Executar o teste de regressão para confirmar que passa**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
npm test -- src/features/systea-sync/colaboradorFiliaisQuery.test.ts
```

Expected: PASS com 1 teste aprovado.

- [ ] **Step 5: Committar o hook e a proteção contra regressão**

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
git add src/hooks/useColaboradorFiliais.ts src/features/systea-sync/colaboradorFiliaisQuery.test.ts
git commit -m "feat: load employee branch assignments by page"
```

### Task 3: Integrar as unidades na tabela de colaboradores

**Files:**
- Modify: `C:\Users\npc\Downloads\rhindicadores-main-filiais\src\components\dashboard\ColaboradoresList.tsx:35-44,103-107,202-205,303`
- Modify: `C:\Users\npc\Downloads\rhindicadores-main-filiais\src\features\systea-sync\colaboradorFiliaisQuery.test.ts`

- [ ] **Step 1: Adicionar a proteção de regressão que exige a integração no componente**

Adicionar ao arquivo `src/features/systea-sync/colaboradorFiliaisQuery.test.ts`:

```ts
it("conecta a lista ao mapa de unidades sincronizadas", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/dashboard/ColaboradoresList.tsx"), "utf8");

  expect(source).toContain('import { useColaboradorFiliais } from "@/hooks/useColaboradorFiliais";');
  expect(source).toContain('import { formatColaboradorFiliais } from "@/lib/employeeFiliais";');
  expect(source).toContain("useColaboradorFiliais(colaboradorIds)");
  expect(source).toContain("formatColaboradorFiliais(");
  expect(source).toContain("getFilialNome(colaborador)");
});
```

- [ ] **Step 2: Executar o teste para confirmar que falha antes da integração**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
npm test -- src/features/systea-sync/colaboradorFiliaisQuery.test.ts
```

Expected: FAIL porque `ColaboradoresList.tsx` ainda não importa nem usa o hook e o formatador de unidades.

- [ ] **Step 3: Conectar o hook e o formatador à coluna Filial**

No bloco de imports, adicionar:

```ts
import { useColaboradorFiliais } from "@/hooks/useColaboradorFiliais";
import { formatColaboradorFiliais } from "@/lib/employeeFiliais";
```

Após as definições de `colaboradores` e `totalCount`, adicionar:

```ts
const colaboradorIds = colaboradores.map((colaborador) => colaborador.id);
const { data: colaboradorFiliais = new Map() } = useColaboradorFiliais(colaboradorIds);
```

Substituir `getFilialNome` por:

```ts
const getFilialNome = (colaborador: Colaborador) => {
  const administrativeFilialName = colaborador.filial_id
    ? filiais?.find((filial) => filial.id === colaborador.filial_id)?.nome
    : undefined;

  return formatColaboradorFiliais(
    colaborador.id,
    colaboradorFiliais,
    administrativeFilialName,
  );
};
```

Na célula da tabela, substituir:

```tsx
<TableCell>{getFilialNome(colaborador.filial_id)}</TableCell>
```

por:

```tsx
<TableCell>{getFilialNome(colaborador)}</TableCell>
```

- [ ] **Step 4: Executar os testes da funcionalidade e o teste do join administrativo**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
npm test -- src/lib/employeeFiliais.test.ts src/features/systea-sync/colaboradorFiliaisQuery.test.ts src/features/systea-sync/administrativeFilialRelation.test.ts
```

Expected: PASS; a correção existente de `filiais!colaboradores_filial_id_fkey(*)` deve permanecer aprovada.

- [ ] **Step 5: Executar o build de produção**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
npm run build
```

Expected: EXIT 0 e geração de `dist/` sem erro de TypeScript.

- [ ] **Step 6: Revisar o diff e committar a integração**

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
git diff --check
git diff -- src/components/dashboard/ColaboradoresList.tsx src/features/systea-sync/colaboradorFiliaisQuery.test.ts
git add src/components/dashboard/ColaboradoresList.tsx src/features/systea-sync/colaboradorFiliaisQuery.test.ts
git commit -m "feat: show all employee branches in list"
```

### Task 4: Verificação final e evidência de conclusão

**Files:**
- Verify: `C:\Users\npc\Downloads\rhindicadores-main-filiais\src\lib\employeeFiliais.ts`
- Verify: `C:\Users\npc\Downloads\rhindicadores-main-filiais\src\hooks\useColaboradorFiliais.ts`
- Verify: `C:\Users\npc\Downloads\rhindicadores-main-filiais\src\components\dashboard\ColaboradoresList.tsx`

- [ ] **Step 1: Executar toda a suíte de testes**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
npm test
```

Expected: EXIT 0 sem falhas.

- [ ] **Step 2: Reexecutar o build limpo**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
npm run build
```

Expected: EXIT 0.

- [ ] **Step 3: Conferir o estado e os commits da branch**

Run:

```powershell
Set-Location 'C:\Users\npc\Downloads\rhindicadores-main-filiais'
git status --short
git log --oneline -4
```

Expected: nenhum arquivo de código da funcionalidade pendente; commits separados para utilitário, hook e integração.

- [ ] **Step 4: Validar manualmente após deploy**

1. Abrir `rhindicadores.lovable.app` depois do deploy da branch publicada.
2. Fazer hard refresh com `Ctrl + Shift + R`.
3. Abrir a aba **Colaboradores CLT**.
4. Conferir um colaborador com duas clínicas sincronizadas: a coluna **Filial** deve mostrar ambos os nomes, como `Matriz, Unidade Sul`.
5. Conferir um colaborador sem atribuições em `colaborador_filiais`, mas com `filial_id`: a coluna deve mostrar somente a filial administrativa.
6. Conferir um colaborador sem nenhuma das duas fontes: a coluna deve mostrar `-`.

## Self-review

- **Cobertura da especificação:** Task 1 implementa ordenação, fallback e `-`; Task 2 implementa a consulta em lote por página com FK explícita; Task 3 integra sem alterar filtros; Task 4 executa teste total, build e validação no app.
- **Sem placeholders:** caminhos, snippets, comandos e resultados esperados estão definidos em cada etapa.
- **Consistência de tipos:** `ColaboradorFilialAssignment`, `buildColaboradorFiliaisMap`, `formatColaboradorFiliais` e `useColaboradorFiliais` são definidos antes de serem consumidos.