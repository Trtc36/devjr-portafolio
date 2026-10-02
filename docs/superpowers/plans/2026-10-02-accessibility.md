# Accessibility Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close 3 accessibility findings — duplicate `<h1>` from blog content, ungrouped tag checkboxes, and form inputs with no screen-reader-linked error messages — without changing any visual appearance or functional behavior.

**Architecture:** Each of the 4 touched files gets a narrowly-scoped, independent edit. `blog-form.tsx` and `project-form.tsx` each carry two related changes (fieldset/legend + a shared `Field` component upgrade) since both land in the same file; everything else is a single file, single concern.

**Tech Stack:** React 19, TypeScript, Next.js 16.2.3.

**Spec:** `docs/superpowers/specs/2026-10-02-accessibility-design.md`

## Global Constraints

- No visual change anywhere — every fix must render identically to today (verified manually, not just by tsc/lint/tests, since there's no visual regression tooling in this project).
- `admin-login-form.tsx`, `blog-form.tsx`, and `project-form.tsx` are currently untracked in git (never committed) — `BlockRenderer.tsx` is clean/committed. Tasks 2-4's commits will necessarily include each file's entire pre-existing content alongside the targeted edit (their first-ever commit) — expected, not a sign of a mistake.
- `Field`'s new `id` prop is optional; omitting it must leave `Field`'s behavior byte-for-byte identical to today (no `aria-*` attributes added, no cloning).
- `id` is added only to `Field` call sites whose field can show a validation error (appears in that form's `FormErrors`/`validate()`) — never to `Stack`/`Metrics` in `project-form.tsx` (no validation ever runs on them), never to the `Content` field in `blog-form.tsx` (wraps `BlockEditor`, not a plain `<input>`/`<textarea>`).
- `BlockRenderer.tsx`'s header level clamp changes from `Math.max(1, ...)` to `Math.max(2, ...)` — the `h1` render branch becomes unreachable and is deleted, not left as dead code.

## Review Focus

- A `Field` with `id` set and `error` undefined must render with `aria-invalid="false"` and no `aria-describedby` (not `aria-describedby` pointing at a `<span>` that doesn't exist, since the error `<span id=...>` only renders when `error` is truthy).
- `Field`'s cloning must not throw when `children` is something other than a single valid element — in practice this never happens in either form today, but the `isValidElement` check must gate the clone so a future caller passing e.g. a fragment doesn't crash the whole form.
- The tags `fieldset`/`legend` change must preserve the "no tags available yet" empty-state branch exactly — both the `fieldset` wrapper and its conditional content, not just the checkbox grid.
- A `header` block with `level: 1` (or no `level` at all, historically defaulting to 2) must render `<h2>`, not throw or render nothing — confirm the simplified ternary handles the default (`level ?? 2`) case before the clamp.
- The admin-login email/password `aria-describedby` must only be set when that field's error is actually present — not unconditionally pointing at an `id` that doesn't exist in the DOM when there's no error.

---

### Task 1: Heading levels in `BlockRenderer.tsx`

**Files:**
- Modify: `src/components/blog/BlockRenderer.tsx`

**Interfaces:** None.

- [ ] **Step 1: Simplify the `header` case**

Replace the current `level === 1` / `level === 3` / fallback `h2` branches (lines 53-82) with:
```tsx
case "header": {
  const level = Math.min(3, Math.max(2, block.data.level ?? 2));
  const HeadingTag = level === 3 ? "h3" : "h2";

  return (
    <HeadingTag
      key={key}
      className="font-semibold tracking-tight text-[hsl(var(--foreground))]"
      dangerouslySetInnerHTML={renderInlineHtml(block.data.text)}
    />
  );
}
```
Nothing else in the file changes.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors beyond the 1 known pre-existing `admin-nav.tsx` error.

Run: `npm run lint`
Expected: clean on this file.

Run: `npm test`
Expected: still 14/14 files, 51/51 tests passing.

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/BlockRenderer.tsx
git commit -m "$(cat <<'EOF'
fix(a11y): stop BlockRenderer from emitting a duplicate h1

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `aria-invalid`/`aria-describedby` in `admin-login-form.tsx`

**Files:**
- Modify: `src/features/auth/components/admin-login-form.tsx`

**Interfaces:** None.

- [ ] **Step 1: Wire the email field**

On the `email` `<input>` (currently lines 103-110), add `aria-invalid={Boolean(errors.email)}` and `aria-describedby={errors.email ? "email-error" : undefined}`. On the error `<p>` right below it (currently line 112), add `id="email-error"`.

- [ ] **Step 2: Wire the password field**

Same pattern on the `password` `<input>` (currently lines 120-127) and its error `<p>` (currently lines 128-132), using `"password-error"`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors beyond the known baseline one.

Run: `npm run lint`
Expected: clean on this file.

Run: `npm test`
Expected: still 51/51 passing.

- [ ] **Step 4: Commit**

This file is currently untracked (never committed) — this commit legitimately includes its entire pre-existing content alongside this targeted edit.

```bash
git add src/features/auth/components/admin-login-form.tsx
git commit -m "$(cat <<'EOF'
fix(a11y): link admin login field errors via aria-describedby

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `blog-form.tsx` — fieldset/legend + `Field` aria wiring

**Files:**
- Modify: `src/features/blog/components/blog-form.tsx`

**Interfaces:** None — `project-form.tsx` (Task 4) has its own separate, duplicated `Field` component; nothing is shared between these two tasks.

- [ ] **Step 1: Add the `cloneElement`/`isValidElement` import**

Add `cloneElement`, `isValidElement`, and the `ReactElement` type to the existing `import { useRef, useState, useTransition } from "react";` line (or a second import line — implementer's choice).

- [ ] **Step 2: Upgrade the local `Field` component (currently lines 361-379)**

```tsx
function Field({
  id,
  label,
  error,
  children,
}: {
  id?: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = id ? `${id}-error` : undefined;
  const content =
    id && isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          id,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? errorId : undefined,
        })
      : children;

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {content}
      {error ? (
        <span id={errorId} className="text-sm text-[hsl(var(--destructive))]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
```

- [ ] **Step 3: Add `id` to the 5 relevant `Field` call sites**

Add `id="title"`, `id="slug"`, `id="excerpt"`, `id="coverImageUrl"`, `id="publishedAt"` to the matching `<Field label="..." error={errors...}>` calls (currently the `Title`, `Slug`, `Excerpt`, `Cover image URL`, `Published at` fields). Do NOT add `id` to the `Content` field (wraps `BlockEditor`) — leave it exactly as-is, per the Global Constraints.

- [ ] **Step 4: Wrap the tags checkboxes in `fieldset`/`legend`**

Replace the `<div className="space-y-3">` / `<p className="text-sm font-medium">Tags</p>` wrapper (currently lines 296-326) with:
```tsx
<fieldset className="space-y-3 border-0 p-0 m-0">
  <legend className="p-0 text-sm font-medium">Tags</legend>
  {/* existing tags.length === 0 empty-state branch and checkbox grid, unchanged */}
</fieldset>
```
The empty-state branch and the checkbox grid's JSX, props, and handlers are otherwise unchanged.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors beyond the known baseline one.

Run: `npm run lint`
Expected: clean on this file.

Run: `npm test`
Expected: still 51/51 passing.

- [ ] **Step 6: Commit**

This file is currently untracked — this commit legitimately includes its entire pre-existing content alongside these targeted edits.

```bash
git add src/features/blog/components/blog-form.tsx
git commit -m "$(cat <<'EOF'
fix(a11y): group tag checkboxes and link field errors in blog form

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `project-form.tsx` — fieldset/legend + `Field` aria wiring

**Files:**
- Modify: `src/features/projects/components/project-form.tsx`

**Interfaces:** None — this file's `Field` component is a separate, duplicated implementation from Task 3's; apply the same change independently.

- [ ] **Step 1: Add the `cloneElement`/`isValidElement` import**

Same as Task 3 Step 1, applied to this file's existing `import { useMemo, useState, useTransition } from "react";` line.

- [ ] **Step 2: Upgrade the local `Field` component (currently lines 423-441)**

Identical implementation to Task 3 Step 2 — same `Field` function body, in this file.

- [ ] **Step 3: Add `id` to the 9 relevant `Field` call sites**

Add `id="title"`, `id="slug"`, `id="description"`, `id="domain"`, `id="coverImageUrl"`, `id="galleryImages"`, `id="repoUrl"`, `id="liveUrl"`, `id="videoUrl"`, `id="content"` to the matching `<Field>` calls (`Title`, `Slug`, `Description`, `Domain`, `Cover image URL`, `Gallery images`, `Repository URL`, `Live URL`, `Video URL`, `Content` — note: unlike `blog-form.tsx`, this file's `Content` field wraps a plain `<textarea>`, not `BlockEditor`, so it DOES get an `id`). Do NOT add `id` to `Stack` or `Metrics` (never populate a validation error) — per the Global Constraints.

- [ ] **Step 4: Wrap the tags checkboxes in `fieldset`/`legend`**

Same transformation as Task 3 Step 4, applied to this file's tags block (currently lines 347-377).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors beyond the known baseline one.

Run: `npm run lint`
Expected: clean on this file.

Run: `npm test`
Expected: still 51/51 passing.

- [ ] **Step 6: Commit**

This file is currently untracked — this commit legitimately includes its entire pre-existing content alongside these targeted edits.

```bash
git add src/features/projects/components/project-form.tsx
git commit -m "$(cat <<'EOF'
fix(a11y): group tag checkboxes and link field errors in project form

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Manual verification (not automated, run once all tasks land)

1. `npm run dev`: visually compare each touched page (a blog post with a header-level-1 block if one exists, the blog/project admin create forms, the admin login page) against its current appearance — confirm no visual change.
2. Create/edit a blog post with an EditorJS "Heading" block set to level 1 → confirm it renders as `<h2>` in the published post (inspect the DOM), not `<h1>`.
3. In browser devtools, inspect the Tags section in both admin forms → confirm a `<fieldset>`/`<legend>` wraps it.
4. Trigger a validation error on a text field in each of the 3 forms (e.g. submit blank) → inspect the `<input>`/`<textarea>` in devtools, confirm `aria-invalid="true"` and `aria-describedby` pointing at an `id` that exists on the error text.
