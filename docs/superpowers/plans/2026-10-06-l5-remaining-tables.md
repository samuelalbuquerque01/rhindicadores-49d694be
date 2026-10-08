# L5 Remaining Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use /long-haul-development.md to implement this plan task-by-task (disk-backed plan + journal, `/newtask` relay, review gates). For a plan small enough to finish in one session, /executing-plans.md is the simpler inline path. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved dashboard table presentation to the remaining events and employee absence-history tables without changing their behavior.

**Architecture:** Keep existing data, state, actions, responsive branches, and callbacks intact. Add only local presentation classes in `EventsTable.tsx`; in `EmployeeDetails.tsx`, replace the manually styled semantic table tags with the existing shared table primitives so the current overflow wrapper and table styling conventions are reused.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shared shadcn-style table primitives, Vite, Vitest, ESLint.

---

### Task 1: Refine the desktop events table

**Files:**
- Modify: `src/features/events/components/EventsTable.tsx:71-83`

- [x] Add `min-w-[900px]` to the existing `Table` and `bg-muted/50` to its `TableHeader`.
- [x] Preserve the desktop wrapper, the independent mobile card branch, `expandedId`, action callbacks, tooltips, badges, pagination, and all table columns.

### Task 2: Standardize the employee absence-history table

**Files:**
- Modify: `src/pages/EmployeeDetails.tsx:21-28`
- Modify: `src/pages/EmployeeDetails.tsx:449-483`

- [x] Import `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, and `TableRow` from `@/components/ui/table`.
- [x] Replace only the manual table markup with the shared primitives inside `rounded-md border`; set `min-w-[780px]` and `bg-muted/50`.
- [x] Preserve the five existing columns, `AfastamentoBadge`, status badge class calculation, date formatting, observations rendering, data map, and all absence-history content.

### Task 3: Verify scope and project health

**Files:**
- Verify: `src/features/events/components/EventsTable.tsx`
- Verify: `src/pages/EmployeeDetails.tsx`

- [x] Inspect the focused diff to confirm it is presentational only.
- [x] Run `npx.cmd tsc --noEmit`, `git diff --check`, `npm.cmd run build`, `npm.cmd run test`, and `npm.cmd run lint`.
- [x] Confirm lint retains the known baseline: 96 errors, 16 warnings, 112 problems, and wrapper marker `LINT_EXIT:0`.