# Mobile Nav + Error Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give mobile visitors full site navigation (hamburger + drawer) and replace Next's default error/404 screens with on-brand pages at every level of the app, so a backend outage or a bad URL never breaks the site's visual identity.

**Architecture:** A shared `navItems` data module feeds both the existing desktop nav and a new Radix Dialog-based mobile drawer. Four new special files (`error.tsx`, two `not-found.tsx`, `global-error.tsx`) cover every failure surface Next.js exposes in this App Router version, reusing the existing `PageShell`/`PageHero` components wherever the surrounding app shell is still intact, and falling back to fully self-contained markup only in `global-error.tsx`, where it isn't.

**Tech Stack:** Next.js 16.2.3 (App Router, `unstable_retry()` error-boundary API introduced in v16.2.0), React 19, `@radix-ui/react-dialog` (new), Tailwind v4 (plain `@keyframes`, no new plugin), next-intl.

**Spec:** `docs/superpowers/specs/2026-10-02-resilience-mobile-nav-error-pages-design.md`

## Global Constraints

- `error.tsx`/`global-error.tsx` use the `unstable_retry()` prop (added in Next v16.2.0) for the retry action, not `reset()`.
- `global-error.tsx` must define its own `<html>`/`<body>`, must not export `metadata`/`generateMetadata` (unsupported in a Client Component), must re-import `./globals.css` and `@/styles/tokens.css` directly, must use `system-ui, sans-serif` inline (no Google Fonts), and must import **nothing** from `src/components/*` — it is the last-resort fallback and must stay resilient even if a shared component is what broke.
- `src/app/not-found.tsx` (root) and `src/app/[locale]/not-found.tsx` receive no props (Next convention) — never destructure `params`/`locale` from them.
- `src/app/[locale]/not-found.tsx` and `src/app/[locale]/error.tsx` resolve translations via `getTranslations`/`useTranslations` with no explicit `locale` argument — `src/i18n/request.ts` already derives the locale from the in-flight request.
- `src/app/[locale]/error.tsx`, `src/app/[locale]/not-found.tsx`, and the root `src/app/not-found.tsx` reuse `PageShell` + `PageHero` (`variant="highlight"`) — only `global-error.tsx` is exempt (see above).
- `navItems` is defined exactly once, in `src/components/layout/nav-items.ts`, and imported by both `main-nav.tsx` and `mobile-nav.tsx`.
- No new test runner/config, no jsdom, no React Testing Library — this plan's spec explicitly ruled that out as out of scope. Verification per task is `npx tsc --noEmit`, `npm run lint`, and the existing `npm test` suite (must stay green); a manual browser checklist (not automated) covers actual UI behavior and is run once after all tasks land.

## Review Focus

- A click on a nav link inside the open mobile drawer must close the drawer (the `Dialog.Root` is controlled specifically for this) — not leave it visually stuck open during/after client-side navigation.
- `global-error.tsx` must not import, even transitively, anything from `src/components/*` — a later edit that "just reuses `Button`" would quietly reintroduce the recursive-failure risk this file exists to avoid.
- `src/app/[locale]/not-found.tsx` must not call `getTranslations({ locale, namespace: "common" })` with an explicit `locale` argument — it has none to pass (the file receives no props), and passing `undefined` by accident must not throw.
- The mobile drawer's trigger button must carry `md:hidden` (not just be visually redundant with the desktop nav) — otherwise a keyboard user tabbing through the page on desktop hits a hidden, inert button.
- `src/app/[locale]/error.tsx` must start with `"use client"` — omitting it is a common, easy-to-miss mistake for an error boundary that uses `useEffect`/`unstable_retry`.

---

### Task 1: Shared nav data + footer parity

**Files:**
- Create: `src/components/layout/nav-items.ts`
- Modify: `src/components/layout/main-nav.tsx`
- Modify: `src/components/layout/footer.tsx`

**Interfaces:**
- Produces: `export const navItems: readonly { href: string; label: string }[]` (`nav-items.ts`), consumed by Task 2's `mobile-nav.tsx`.

- [ ] **Step 1: Extract `navItems` to `nav-items.ts`**

```ts
// src/components/layout/nav-items.ts
export const navItems = [
  { href: "/", label: "nav.home" },
  { href: "/projects", label: "nav.projects" },
  { href: "/blog", label: "nav.blog" },
  { href: "/about", label: "nav.about" },
  { href: "/contact", label: "nav.contact" },
] as const;
```

- [ ] **Step 2: Update `main-nav.tsx` to import `navItems` from `./nav-items` instead of defining it locally**

Remove the local `navItems` array (currently lines 7-13); add `import { navItems } from "./nav-items";`. No other change to this file.

- [ ] **Step 3: Add the "about" link to `footer.tsx`**

In the existing `flex flex-wrap gap-4` link group (alongside `projects`/`blog`/`contact`), add one more `Link` using the same props/className pattern, `href="/about"`, text `{t("nav.about")}` (key already exists in both `en/common.json` and `es/common.json` — no i18n changes needed for this step).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors (same single pre-existing `admin-nav.tsx` error as baseline, unrelated to this task).

Run: `npm run lint`
Expected: no new warnings/errors in the 3 touched files.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/nav-items.ts src/components/layout/main-nav.tsx src/components/layout/footer.tsx
git commit -m "$(cat <<'EOF'
refactor(nav): centralize navItems, add about link to footer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Mobile nav (hamburger + Radix Dialog)

**Files:**
- Modify: `package.json` (add `@radix-ui/react-dialog`)
- Create: `src/components/layout/mobile-nav.tsx`
- Modify: `src/components/layout/header.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/i18n/messages/en/common.json`
- Modify: `src/i18n/messages/es/common.json`

**Interfaces:**
- Consumes: `navItems` from `src/components/layout/nav-items.ts` (Task 1).
- Produces: `export default function MobileNav(): JSX.Element` (`mobile-nav.tsx`), consumed by `header.tsx`.

- [ ] **Step 1: Install the dependency**

Run: `npm install @radix-ui/react-dialog`

- [ ] **Step 2: Add the drawer keyframes to `globals.css`**

**Before editing, note:** `src/app/globals.css` already has unrelated, uncommitted changes sitting in the working tree (an `@layer components { .admin-input ... .block-editor ... }` block from a different in-progress feature on this branch, confirmed via `git diff src/app/globals.css` — currently ~69 lines, appended at the end of the file). Add your keyframes **immediately after the `@import "tailwindcss";` line at the top of the file**, not at the end, so your change stays a small, separate hunk away from that pre-existing block. When you commit (Step 7), run `git diff src/app/globals.css` first and confirm it shows ONLY your new `@keyframes` lines — if the unrelated `@layer components` block also shows up, do not `git add` the whole file; use `git add -p src/app/globals.css` and stage only your own hunk.

Add, outside any `@layer` block (plain top-level CSS, same as Tailwind v4's own convention for custom keyframes referenced via arbitrary values):

```css
@keyframes mobileNavOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes mobileNavOverlayOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes mobileNavPanelIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes mobileNavPanelOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
```

- [ ] **Step 3: Add the 3 new i18n keys**

Under `nav` in both files (alongside the existing `home`/`projects`/`blog`/`about`/`contact`):

`en/common.json`: `"openMenu": "Open menu"`, `"closeMenu": "Close menu"`, `"menuTitle": "Navigation menu"`.
`es/common.json`: `"openMenu": "Abrir menú"`, `"closeMenu": "Cerrar menú"`, `"menuTitle": "Menú de navegación"`.

- [ ] **Step 4: Implement `mobile-nav.tsx`**

`"use client"`. Import `navItems` from `./nav-items`, `Dialog` as `* as Dialog` from `@radix-ui/react-dialog`, `Menu`/`X` from `lucide-react`, `Button` from `@/components/ui/button`, `Link`/`usePathname` from `@/i18n/navigation`, `useLocale`/`useTranslations` from `next-intl`, `cn` from `@/lib/utils`.

- A local `const [open, setOpen] = useState(false)`.
- `<Dialog.Root open={open} onOpenChange={setOpen}>`.
- `<Dialog.Trigger asChild>`: a `Button variant="ghost" size="sm"` with the `Menu` icon, `aria-label={t("nav.openMenu")}`, className including `md:hidden` (per Global Constraints and Review Focus — the trigger must not be tabbable on desktop).
- `<Dialog.Portal>` → `<Dialog.Overlay>` (fixed inset-0, `bg-black/50`, `data-[state=open]:animate-[mobileNavOverlayIn_200ms_ease-out]`, `data-[state=closed]:animate-[mobileNavOverlayOut_200ms_ease-in]`) → `<Dialog.Content>` (fixed right-0 top-0 h-full, a sensible max width e.g. `w-80 max-w-[85vw]`, `bg-[hsl(var(--surface))]` with a left border and shadow matching `main-nav.tsx`'s existing token usage, `data-[state=open]:animate-[mobileNavPanelIn_200ms_ease-out]`, `data-[state=closed]:animate-[mobileNavPanelOut_200ms_ease-in]`).
- Inside `Dialog.Content`: `<Dialog.Title className="sr-only">{t("nav.menuTitle")}</Dialog.Title>`, a `<Dialog.Close asChild>` button with the `X` icon and `aria-label={t("nav.closeMenu")}`, then a `<nav>` mapping `navItems` the same way `main-nav.tsx` does (active-state highlighting is optional polish, not required), each `Link` with `onClick={() => setOpen(false)}` (Review Focus item — closes the drawer before/while navigating).

- [ ] **Step 5: Wire it into `header.tsx`**

Import `MobileNav` from `@/components/layout/mobile-nav` and render it adjacent to `<MainNav />` inside the existing `flex items-center gap-3 md:gap-5` wrapper (`header.tsx:33`).

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npm run lint`
Expected: clean on all touched/created files.

Run: `npm test`
Expected: still 14/14 files, 51/51 tests passing (unrelated suite, confirms no accidental breakage).

- [ ] **Step 7: Commit**

Run `git diff src/app/globals.css` first and confirm only your keyframes show (see Step 2's note) before staging it.

```bash
git add package.json package-lock.json src/components/layout/mobile-nav.tsx src/components/layout/header.tsx src/app/globals.css src/i18n/messages/en/common.json src/i18n/messages/es/common.json
git commit -m "$(cat <<'EOF'
feat(nav): add mobile hamburger menu with Radix Dialog

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: In-segment error handling (`[locale]/error.tsx`, `[locale]/not-found.tsx`)

**Files:**
- Create: `src/app/[locale]/error.tsx`
- Create: `src/app/[locale]/not-found.tsx`
- Modify: `src/i18n/messages/en/common.json`
- Modify: `src/i18n/messages/es/common.json`

**Interfaces:**
- Consumes: `PageShell` (`@/components/layout/page-shell`), `PageHero` (`@/components/layout/page-hero`), `Button` (`@/components/ui/button`) — all pre-existing, unchanged.

- [ ] **Step 1: Add the `error`/`notFound` i18n namespaces**

Top-level in both files (sibling to `nav`/`theme`/`footer`/`common`):

`en/common.json`:
```json
"error": {
  "title": "Something went wrong",
  "description": "We hit an unexpected error loading this page. You can try again, or head back to the homepage.",
  "retry": "Try again",
  "backHome": "Back to home"
},
"notFound": {
  "title": "We couldn't find that page",
  "description": "The page you're looking for may have moved or no longer exists.",
  "backHome": "Back to home",
  "viewBlog": "View the blog"
}
```

`es/common.json`:
```json
"error": {
  "title": "Algo salió mal",
  "description": "Hubo un error inesperado al cargar esta página. Puedes reintentar o volver al inicio.",
  "retry": "Reintentar",
  "backHome": "Volver al inicio"
},
"notFound": {
  "title": "No encontramos esta página",
  "description": "La página que buscas pudo haberse movido o ya no existe.",
  "backHome": "Volver al inicio",
  "viewBlog": "Ver el blog"
}
```

- [ ] **Step 2: Implement `src/app/[locale]/error.tsx`**

`"use client"` (Global Constraint / Review Focus item — do not omit). Signature: `export default function Error({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void })`. `useEffect(() => { console.error(error); }, [error]);`. Use `useTranslations("common")` (no explicit locale — matches the existing pattern in `main-nav.tsx`). Render `<PageShell><PageHero title={t("error.title")} description={t("error.description")} actions={<>...</>} /></PageShell>` (omit `eyebrow` entirely — it's optional) with two actions: `<Button onClick={() => unstable_retry()}>{t("error.retry")}</Button>`, and `<Button asChild variant="secondary"><Link href="/">{t("error.backHome")}</Link></Button>` (`Link` from `@/i18n/navigation`, same `asChild`+`Slot` composition already used elsewhere in this codebase for link-styled-as-button).

- [ ] **Step 3: Implement `src/app/[locale]/not-found.tsx`**

Server Component, no props (Global Constraint — do not destructure `params`). `const t = await getTranslations({ namespace: "common" });` — object form without a `locale` key, consistent with every other `getTranslations` call site in this codebase, which otherwise always pass `{ locale, namespace }` (Review Focus item: omitting `locale` here is required, not optional, since this file receives no props to take it from). Same `PageShell`/`PageHero` structure as Step 2 (no `eyebrow`), title `t("notFound.title")`, description `t("notFound.description")`, actions: `<Button asChild><Link href="/">{t("notFound.backHome")}</Link></Button>` and `<Button asChild variant="secondary"><Link href="/blog">{t("notFound.viewBlog")}</Link></Button>`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npm run lint`
Expected: clean.

Run: `npm test`
Expected: still 14/14 files, 51/51 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/\[locale\]/error.tsx src/app/\[locale\]/not-found.tsx src/i18n/messages/en/common.json src/i18n/messages/es/common.json
git commit -m "$(cat <<'EOF'
feat(resilience): add error.tsx and not-found.tsx for the locale segment

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Catastrophic fallback (`global-error.tsx`, root `not-found.tsx`)

**Files:**
- Create: `src/app/global-error.tsx`
- Create: `src/app/not-found.tsx`

**Interfaces:**
- `src/app/not-found.tsx` consumes `PageShell`/`PageHero` (same as Task 3, hardcoded English strings — no next-intl here).
- `src/app/global-error.tsx` consumes **nothing** from `src/components/*` (Global Constraint) — fully inline JSX.

- [ ] **Step 1: Implement `src/app/global-error.tsx`**

`"use client"`. Signature: `export default function GlobalError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void })`. No `metadata` export (unsupported here). Must render its own `<html lang="en" className="dark"><body>...</body></html>`. Import `"./globals.css"` and `"@/styles/tokens.css"` directly (same two imports as `src/app/layout.tsx`) so the CSS custom properties resolve. Inline `style={{ fontFamily: "system-ui, sans-serif" }}` on `<body>` — no Google Fonts import. Body content: plain `<div>` (no `PageShell`/`PageHero`/`Button` — Global Constraint), centered, using Tailwind utility classes + `hsl(var(--token))` colors directly: a heading "Something went wrong", a short line "We hit an unexpected error. Please try again or return to the homepage.", a `<button onClick={() => unstable_retry()}>Try again</button>`, and a plain `<a href="/en">Home</a>` (not `@/i18n/navigation`'s `Link` — no i18n context exists here).

- [ ] **Step 2: Implement `src/app/not-found.tsx`**

Server Component, no props. No `getTranslations`/next-intl (not available at this level, outside `[locale]`). Reuse `PageShell`/`PageHero` (they take plain string props, no next-intl dependency themselves) with hardcoded English copy: title "Page not found", description "This page doesn't exist. Head back to the homepage.", one action: `<Button asChild><a href="/en">Home</a></Button>` — a plain `<a>` (not the i18n `Link`, which depends on context not available at this level), still styled via `Button`'s `asChild`+`Slot` composition like every other button-styled link in this codebase.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npm run lint`
Expected: clean.

Run: `npm run build`
Expected: compiles successfully through to completion, OR fails only at the pre-existing, out-of-scope `admin-nav.tsx:17` type-check error (known baseline issue from unrelated in-progress work on this branch, present since before this entire multi-sub-project effort started) — if it fails for any other reason, that is a real regression to fix before committing.

- [ ] **Step 4: Commit**

```bash
git add src/app/global-error.tsx src/app/not-found.tsx
git commit -m "$(cat <<'EOF'
feat(resilience): add global-error.tsx and root not-found.tsx

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Manual verification (not automated, run once all tasks land)

1. `npm run dev`, viewport <768px: hamburger opens the drawer with all 5 links; clicking a link navigates and closes the drawer; ESC closes it; focus returns to the trigger button on close. At ≥768px, the hamburger button is not present in the tab order.
2. Visit a nonexistent blog/project slug (e.g. `/en/blog/does-not-exist`) → the on-brand `not-found.tsx` renders with Header/Footer intact.
3. Temporarily throw an error in a test page under `[locale]`, visit it → `error.tsx` renders with Header/Footer intact; "Try again" re-attempts the render.
4. Visit a URL with no recognizable locale segment at all → the root `not-found.tsx` renders (no Header/Footer, but on-brand tokens/colors).
5. Visually review `global-error.tsx`'s source for anything beyond plain HTML/inline Tailwind classes — confirm no stray import from `src/components/*` slipped in (Review Focus item; hard to trigger this file live without deliberately breaking the root layout).
6. Footer on any page: confirm "About" now appears alongside Projects/Blog/Contact.
