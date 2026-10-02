# Shim Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish an incomplete component migration by removing 6 one-line re-export shim files in `src/components/` and pointing their only 2 real importers directly at the components' actual locations.

**Architecture:** A single, self-contained cleanup task: delete the 6 shims, fix the 3 import lines in each of the 2 files that use them. No behavior changes — the components themselves don't move or change, only which path imports them.

**Tech Stack:** Next.js 16.2.3, TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-02-shim-cleanup-design.md`

## Global Constraints

- Exactly these 6 files are deleted, nothing else: `src/components/card.tsx`, `src/components/badge.tsx`, `src/components/button.tsx`, `src/components/section-shell.tsx`, `src/components/page-shell.tsx`, `src/components/project-card.tsx`.
- Exactly these 2 files get import-path edits, nothing else in them changes: `src/app/[locale]/about/page.tsx`, `src/app/[locale]/contact/page.tsx`.
- New import targets: `@/components/card` → `@/components/ui/card`; `@/components/page-shell` → `@/components/layout/page-shell`; `@/components/section-shell` → `@/components/layout/section-shell`. The named imports themselves (`Card`, `CardContent`, `CardHeader`, `PageShell`, `SectionShell`) don't change, only the module path.
- No other file in `src/` imports from any of the 6 shims today (confirmed by the spec's grep) — `badge.tsx`, `button.tsx`, and `project-card.tsx` have zero importers and are pure dead code.
- `npx tsc --noEmit` is this change's real safety net: it scans the whole working tree, so any import this plan missed — or any import added by unrelated in-progress work elsewhere in this repo between now and execution — will surface as a compile error before anything is committed.

## Review Focus

- A second grep pass right before deleting must check both quote styles (`"@/components/..."` and `'@/components/...'`) and any barrel/re-export of these shims, in case the spec's single grep pass missed an importer that uses a different quote convention.
- `about/page.tsx` and `contact/page.tsx` must each end up with exactly 3 edited import lines (one per shim they use) — not merged into fewer import statements, not reordered, named imports preserved exactly as they are today.
- Deleting the 3 zero-importer shims (`badge.tsx`, `button.tsx`, `project-card.tsx`) must not be skipped just because they're "unused" — the spec calls for removing all 6, and leaving dead files behind defeats the point of this cleanup.
- Files must be removed via `git rm` (or an editor delete followed by `git add`), not merely deleted on disk and forgotten — confirm with `git status` that all 6 show as deleted before committing.
- Before staging, confirm (via `git status` on exactly these 8 paths) that none of them carry unrelated pre-existing uncommitted changes from other in-progress work on this branch — already checked clean as of plan-writing time, but re-verify at execution time since the tree keeps changing.

---

### Task 1: Delete the 6 shims, fix the 2 importers

**Files:**
- Delete: `src/components/card.tsx`
- Delete: `src/components/badge.tsx`
- Delete: `src/components/button.tsx`
- Delete: `src/components/section-shell.tsx`
- Delete: `src/components/page-shell.tsx`
- Delete: `src/components/project-card.tsx`
- Modify: `src/app/[locale]/about/page.tsx`
- Modify: `src/app/[locale]/contact/page.tsx`

**Interfaces:** None — this task is the whole plan.

- [ ] **Step 1: Re-confirm no other importers exist**

Run: `grep -rn "from \"@/components/\(card\|badge\|button\|section-shell\|page-shell\|project-card\)\"" src/` and the single-quote equivalent `grep -rn "from '@/components/\(card\|badge\|button\|section-shell\|page-shell\|project-card\)'" src/`.
Expected: only the 6 lines already known (3 imports in `about/page.tsx`, 3 in `contact/page.tsx`). If anything else turns up, STOP and report it — do not proceed with a stale import list.

Also run: `git status --short src/components/card.tsx src/components/badge.tsx src/components/button.tsx src/components/section-shell.tsx src/components/page-shell.tsx src/components/project-card.tsx "src/app/[locale]/about/page.tsx" "src/app/[locale]/contact/page.tsx"`.
Expected: no output (all 8 paths clean, matching HEAD). If any show as modified, STOP and report it before touching them — this branch's working tree has repeatedly carried unrelated uncommitted work in other files, and this task's commit must not accidentally absorb any of it.

- [ ] **Step 2: Update imports in `src/app/[locale]/about/page.tsx`**

Change the 3 import lines:
```ts
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { SectionShell } from "@/components/layout/section-shell";
```
No other line in this file changes.

- [ ] **Step 3: Update imports in `src/app/[locale]/contact/page.tsx`**

Same 3 import lines as Step 2, same rule — nothing else in the file changes.

- [ ] **Step 4: Delete the 6 shim files**

```bash
git rm src/components/card.tsx src/components/badge.tsx src/components/button.tsx src/components/section-shell.tsx src/components/page-shell.tsx src/components/project-card.tsx
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors beyond the 1 known pre-existing `admin-nav.tsx` error — in particular, no "Cannot find module" errors referencing any of the 6 deleted paths.

Run: `npm run lint`
Expected: clean on the 2 modified files.

Run: `npm test`
Expected: still 14/14 files, 51/51 tests passing (unrelated suite, confirms no accidental breakage).

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/about/page.tsx" "src/app/[locale]/contact/page.tsx"
git commit -m "$(cat <<'EOF'
refactor: remove re-export shims, import components directly

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

(The 6 deletions from Step 4 are already staged via `git rm` and ride along in this same commit.)
