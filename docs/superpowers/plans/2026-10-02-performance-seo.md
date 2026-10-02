# Performance + SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the project's highest-severity performance finding (zero `next/image` usage across 5 `<img>` tags, causing predictable CLS and no format/priority optimization) and give the site baseline SEO infrastructure (`metadataBase`, `sitemap.ts`, `robots.ts`).

**Architecture:** Each `<img>` migrates to `next/image` using one of two patterns depending on whether its container has a known fixed aspect ratio (`fill` + a `relative`-positioned sized container) or not (explicit `width`/`height` as an aspect hint + CSS override to stay responsive). A new `NEXT_PUBLIC_SITE_URL` env var backs `metadataBase` (root layout) and two new special files, `sitemap.ts`/`robots.ts`, which read site content through the same public service functions (`getProjects()`/`getBlogPosts()`) the pages already use.

**Tech Stack:** Next.js 16.2.3 (`next/image`, `MetadataRoute` types), React 19, next-intl (`routing.locales`, `localePrefix: "always"`).

**Spec:** `docs/superpowers/specs/2026-10-02-performance-seo-design.md`

## Global Constraints

- `images.remotePatterns` in `next.config.ts` allows both `https` and `http` with wildcard `hostname: "**"` — deliberate, because the admin "Cover image URL" fields are free-text inputs with no domain restriction; a narrower allowlist would break arbitrary admin-pasted URLs after this change.
- Every `<Image fill>` usage requires a `relative`-positioned parent with an explicit height (either a fixed `h-*` class or the existing responsive `h-[280px] md:h-[420px]` pattern already in the two detail pages).
- `priority` goes on exactly 2 images (the cover images in `src/app/[locale]/blog/[slug]/page.tsx` and `src/app/[locale]/projects/[slug]/page.tsx`) — nowhere else. Too many `priority` images on one page actively hurts LCP; it must not spread to list cards or the gallery.
- `BlockRenderer.tsx`'s embedded blog image uses `width={1200} height={675}` (an aspect-ratio hint, not an exact rendered size) + `className="h-auto w-full ..."`, not `fill` — EditorJS content has unknown intrinsic dimensions, and this is Next's documented pattern for that case.
- `NEXT_PUBLIC_SITE_URL` placeholder value is exactly `https://devjr.example.com` (no real production domain exists yet) — used identically as the fallback in `src/app/layout.tsx`, `src/app/sitemap.ts`, and `src/app/robots.ts`. Do not invent a different placeholder in any of the three.
- `src/app/sitemap.ts` must export `export const revalidate = 3600;` — `getProjectsFromApi`/`getBlogPostsFromApi` (`src/features/{projects,blog}/services/*.api.ts`) silently fall back to local fixture data if the backend is unreachable; without revalidation, a sitemap built once against that fallback would stay stale indefinitely.
- `src/app/sitemap.ts` must iterate `routing.locales` (from `@/i18n/routing`) rather than hardcoding `"en"`/`"es"` literals, so a future third locale doesn't require editing this file.
- `src/app/robots.ts` disallows exactly `/admin` and `/api`, nothing else.
- **Several files this plan touches already have large, substantial, uncommitted changes sitting in the working tree from an unrelated in-progress feature** (confirmed via `git diff --stat`: `project-card.tsx` +64/-22, `editorial-post-row.tsx` +18/-5, `blog/[slug]/page.tsx` +40/-38, `projects/[slug]/page.tsx` +194/-88, `next.config.ts` +2/-1) — and critically, in every one of these files, **the exact `<img>` block this plan migrates only exists in that uncommitted content** (it was never in the last commit at all). There is no way to separate "this plan's edit" from "the other feature's uncommitted work" via `git add -p` here — unlike a previous plan's experience with `globals.css`, where the unrelated content was a cleanly separable block. All of this uncommitted content already passes `tsc --noEmit`/`npm run lint`/the existing test suite (confirmed clean baseline before this plan started). Each task below instructs committing the **whole file** normally (`git add <file>`, not `-p`) — do not attempt hunk-level surgery on these specific files, and do not be alarmed that a task's diff looks far larger than "just adding next/image."

## Review Focus

- A project/post with no cover image (`coverImageUrl` falsy) must still render nothing for that slot — the existing `{x.coverImageUrl ? ... : null}` guard must survive the migration unchanged; `next/image` has no `src` fallback and would crash on `undefined`.
- `src/app/sitemap.ts` must not throw if the backend is unreachable — `getProjects()`/`getBlogPosts()` already catch and fall back to fixture data internally, so the sitemap route itself has nothing extra to catch, but this must not be "fixed" by adding a redundant try/catch that swallows a real bug instead.
- `BlockRenderer.tsx`'s existing `if (!imageUrl) return null;` guard (for an image block with neither `file.url` nor `url`) must survive the migration unchanged.
- `priority` must land on exactly the 2 detail-page covers and nowhere else (see Global Constraints) — this is the single easiest thing for an implementer to over-apply "for consistency."
- `src/app/sitemap.ts`'s locale iteration must come from `routing.locales`, not a hardcoded `["en", "es"]` array independent of it — a literal, disconnected array would silently drift if `src/i18n/routing.ts` ever changes.

---

### Task 1: List-card images (`project-card.tsx`, `editorial-post-row.tsx`) + `next.config.ts`

**Files:**
- Modify: `next.config.ts`
- Modify: `src/features/projects/components/project-card.tsx`
- Modify: `src/features/blog/components/editorial-post-row.tsx`

**Interfaces:** None consumed or produced — this task is self-contained and does not interact with Tasks 2-3.

- [ ] **Step 1: Add `images.remotePatterns` to `next.config.ts`**

Add to the existing `nextConfig` object (alongside `typedRoutes: true`):
```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "**" },
    { protocol: "http", hostname: "**" },
  ],
},
```

- [ ] **Step 2: Migrate `project-card.tsx`'s cover image**

Add `import Image from "next/image";`. The container `<div className="overflow-hidden border-b border-[hsl(var(--border))]">` gains `relative h-56` (becomes `className="relative h-56 overflow-hidden border-b border-[hsl(var(--border))]"`). Replace the `<img>` with:
```tsx
<Image
  src={project.coverImageUrl}
  alt={localizeCopy(project.title, locale)}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
/>
```
No `priority` (Global Constraint). The surrounding `{project.coverImageUrl ? (...) : null}` conditional is unchanged.

- [ ] **Step 3: Migrate `editorial-post-row.tsx`'s cover image**

Same pattern as Step 2, using `post.coverImageUrl`/`post.title` in place of `project.coverImageUrl`/`project.title`. No `priority`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors beyond the 1 known pre-existing `admin-nav.tsx` error.

Run: `npm run lint`
Expected: no new errors/warnings in the 3 touched files.

Run: `npm test`
Expected: still 14/14 files, 51/51 tests passing (unrelated suite, confirms no accidental breakage).

- [ ] **Step 5: Commit**

Per the Global Constraints note above, these 3 files carry substantial pre-existing uncommitted content — commit them whole, not with `-p`.

```bash
git add next.config.ts src/features/projects/components/project-card.tsx src/features/blog/components/editorial-post-row.tsx
git commit -m "$(cat <<'EOF'
perf(images): migrate list-card covers to next/image

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Detail-page images (`blog/[slug]/page.tsx`, `projects/[slug]/page.tsx`)

**Files:**
- Modify: `src/app/[locale]/blog/[slug]/page.tsx`
- Modify: `src/app/[locale]/projects/[slug]/page.tsx`

**Interfaces:** None — independent of Task 1.

- [ ] **Step 1: Migrate `blog/[slug]/page.tsx`'s cover image**

Add `import Image from "next/image";`. The container `<div className="overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">` gains `relative h-[280px] md:h-[420px]` (the height classes move here from the `<img>`'s current className). Replace the `<img>` with:
```tsx
<Image
  src={post.coverImageUrl}
  alt={localizeCopy(post.title, locale)}
  fill
  sizes="100vw"
  priority
  className="object-cover"
/>
```

- [ ] **Step 2: Migrate `projects/[slug]/page.tsx`'s cover image**

Same pattern as Step 1, using `project.coverImageUrl`/`project.title`, same container height-class move, `priority` included.

- [ ] **Step 3: Migrate `projects/[slug]/page.tsx`'s gallery image**

The `<Surface key={artifact.id} variant="elevated" className="overflow-hidden p-0">` gains `relative h-56` (className becomes `"relative h-56 overflow-hidden p-0"`). Replace the `<img>` with:
```tsx
<Image
  src={artifact.imageUrl}
  alt={artifact.title ? localizeCopy(artifact.title, locale) : localizeCopy(project.title, locale)}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
/>
```
No `priority` (Global Constraint — this is one of N gallery images, not the page's LCP candidate).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors beyond the known baseline one.

Run: `npm run lint`
Expected: clean on both touched files.

Run: `npm test`
Expected: still 51/51 passing.

- [ ] **Step 5: Commit**

Same note as Task 1 — these 2 files carry substantial pre-existing uncommitted content; commit whole, not with `-p`.

```bash
git add "src/app/[locale]/blog/[slug]/page.tsx" "src/app/[locale]/projects/[slug]/page.tsx"
git commit -m "$(cat <<'EOF'
perf(images): migrate detail-page covers and gallery to next/image

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Blog embedded images (`BlockRenderer.tsx`)

**Files:**
- Modify: `src/components/blog/BlockRenderer.tsx`

**Interfaces:** None — independent of Tasks 1-2.

- [ ] **Step 1: Migrate the `image` block case**

Add `import Image from "next/image";`. In the `case "image":` block, after the existing `if (!imageUrl) { return null; }` guard (unchanged — Review Focus item), replace the `<img>` with:
```tsx
<Image
  src={imageUrl}
  alt={block.data.caption || "Blog image"}
  width={1200}
  height={675}
  sizes="100vw"
  className="h-auto w-full rounded-2xl border border-[hsl(var(--border))] object-cover"
/>
```
No `fill`, no `priority` (not a detail-page cover).

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors beyond the known baseline one.

Run: `npm run lint`
Expected: clean.

Run: `npm test`
Expected: still 51/51 passing — note `BlockRenderer.tsx` has no direct unit tests, but `src/features/blog/lib/block-content.test.ts`/`sanitize-html.test.ts` (from an earlier plan) exercise the data this component renders; confirm those still pass unchanged.

- [ ] **Step 3: Commit**

`BlockRenderer.tsx` is already committed and clean (no pre-existing uncommitted content) — a normal, small diff is expected here, unlike Tasks 1-2.

```bash
git add src/components/blog/BlockRenderer.tsx
git commit -m "$(cat <<'EOF'
perf(images): migrate blog embedded images to next/image

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: SEO infrastructure (`metadataBase`, `sitemap.ts`, `robots.ts`)

**Files:**
- Modify: `.env.local`
- Modify: `.env.example`
- Modify: `src/app/layout.tsx`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

**Interfaces:**
- Consumes: `getProjects()` (`@/services/projects.service`), `getBlogPosts()` (`@/services/blog.service`) — both pre-existing, unchanged; `routing` (`@/i18n/routing`, exposes `routing.locales: readonly AppLocale[]`).

- [ ] **Step 1: Add `NEXT_PUBLIC_SITE_URL`**

`.env.local`: add `NEXT_PUBLIC_SITE_URL=https://devjr.example.com`.
`.env.example`: add the same key with a comment line above it: `# Replace with the real production domain before deploying`.

- [ ] **Step 2: Add `metadataBase` to `src/app/layout.tsx`**

In the existing `export const metadata: Metadata = { title: ..., description: ... }`, add:
```ts
metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://devjr.example.com"),
```

- [ ] **Step 3: Implement `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getProjects } from "@/services/projects.service";
import { getBlogPosts } from "@/services/blog.service";

export const revalidate = 3600;

const STATIC_PATHS = ["/", "/projects", "/blog", "/about", "/contact"] as const;

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://devjr.example.com";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [projects, posts] = await Promise.all([getProjects(), getBlogPosts()]);

  const staticEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: `${baseUrl}/${locale}${path === "/" ? "" : path}`,
    })),
  );

  const projectEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    projects.map((project) => ({
      url: `${baseUrl}/${locale}/projects/${project.slug}`,
      lastModified: project.publishedAt,
    })),
  );

  const blogEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    posts.map((post) => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: post.publishedAt,
    })),
  );

  return [...staticEntries, ...projectEntries, ...blogEntries];
}
```

- [ ] **Step 4: Implement `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devjr.example.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors beyond the known baseline one.

Run: `npm run lint`
Expected: clean on the 3 modified/created files.

Run: `npm test`
Expected: still 51/51 passing.

- [ ] **Step 6: Commit**

`.env.local` is gitignored in this repo (confirmed: `.gitignore` lines 20-22) — do not attempt to `git add` it; it stays local-only. Commit only the 4 files below. Still edit `.env.local` per Step 1 so `npm run dev` has the var available.

```bash
git add .env.example src/app/layout.tsx src/app/sitemap.ts src/app/robots.ts
git commit -m "$(cat <<'EOF'
feat(seo): add metadataBase, sitemap.ts, and robots.ts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Manual verification (not automated, run once all tasks land)

1. `npm run dev`: open a project/blog list page and a detail page; confirm all images load (no 400 in the Network tab / browser console — a 400 there means a `remotePatterns` mismatch).
2. DevTools Network tab: confirm an image request's response `Content-Type` is `image/webp` or `image/avif`, not the original format.
3. DevTools Performance/Layout Shift: no visible layout shift when list-card or detail-page images load (the container already reserves the space).
4. Visit `/sitemap.xml` and `/robots.txt` in dev; confirm the sitemap lists both locales' static paths plus real project/blog slugs, and `robots.txt` disallows `/admin` and `/api`.
5. Confirm `priority` appears only on the 2 detail-page cover images (grep the diff) — not on list cards or the gallery.
