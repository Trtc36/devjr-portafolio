# Admin Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the three critical/high security gaps in the admin panel and public blog — unsigned session cookie, unsanitized blog HTML, and unvalidated admin API bodies — plus add proxy-level defense in depth for `/admin`.

**Architecture:** A new dependency-free crypto module signs the existing session cookie payload with HMAC-SHA256; `proxy.ts` and `session.ts` both verify it. A new sanitize helper strips unsafe HTML from blog content at both render time and save time, reusing the existing block-traversal shape in `block-content.ts`. Zod schemas mirror the existing admin DTOs and gate every `POST`/`PUT` route handler under `api/admin/*` before the body is forwarded to the ASP.NET backend.

**Tech Stack:** Next.js 16.2.3 (App Router, `proxy.ts` on Node.js runtime), TypeScript (strict), Vitest (new — no test runner exists yet), `isomorphic-dompurify` (new), `zod` (already present as a transitive dependency, pinned as a direct one).

**Spec:** `docs/superpowers/specs/2026-10-01-admin-security-hardening-design.md`

## Global Constraints

- `proxy.ts` runs on the Node.js runtime in this Next.js version (not Edge) — `node:crypto` is available there without restriction.
- `SESSION_SECRET` is a server-only env var (no `NEXT_PUBLIC_` prefix); the process must fail fast at module load if it is missing, not fall back to unsigned behavior.
- Cookie flags stay exactly as today: `httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`, `path: "/"`.
- `contentJson` always travels and is stored as a JSON **string**, never as a parsed object.
- Every validation failure returns HTTP 400 with body shape `{ message: "validation_error", errors: <result.error.flatten()> }`.
- Sanitization allowlist is exactly: tags `b, strong, i, em, a, code, mark, u, s`; only the `href` attribute, only on `a`; only `http:`, `https:`, `mailto:` URI schemes.
- `code.data.code` is never run through DOMPurify — it renders as plain text inside `<pre><code>`, never via `dangerouslySetInnerHTML`.
- Zod schemas mirror the existing DTO field shapes exactly (`UpsertBlogPostRequestDto`, `UpsertProjectRequestDto`, `CreateTagRequestDto`, `CreateUserRequestDto`) — no new fields, no scope creep.
- The public `session.ts` API (`getAdminSession`, `requireAdminSession`, `isValidAdminSession`, `createAdminSessionCookie`, `clearAdminSessionCookie`, `getAdminAccessToken`, `isSessionExpired`) keeps its current exported names and signatures — three existing call sites depend on them (`admin/login/page.tsx`, `admin/(protected)/layout.tsx`, `api/session/login/route.ts`, `api/session/logout/route.ts`, `features/admin/lib/admin-api.ts`).

## Review Focus

- Legacy/unsigned cookie value (old format, no `.`-separated signature segment) must be treated as invalid and return `null`, not throw — Task 1.
- A cookie with a valid signature but an expired `expiresAtUtc` must still be rejected — Task 1.
- Deeply nested `BlogListItem.items` (list inside a list) must have every level sanitized, not just the top level — Task 3.
- An array field (`tagIds`, `stack`, `galleryImages`) containing a non-string element must be rejected with 400, not coerced or silently forwarded — Task 4 and Task 5.
- Missing `SESSION_SECRET` at process start must throw immediately when the module loads, not sign/verify with an empty secret — Task 1.

---

### Task 1: Test runner + signed session token

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `vitest`, `zod`, scripts `"test": "vitest run"`, `"test:watch": "vitest"`)
- Create: `src/features/auth/lib/session-token.ts`
- Test: `src/features/auth/lib/session-token.test.ts`
- Modify: `src/features/auth/lib/session.ts`
- Create: `.env.example`
- Modify: `.env.local` (add a local-only `SESSION_SECRET` value — this file is gitignored, do not commit it)

**Interfaces:**
- Produces (from `session-token.ts`, consumed by Tasks 1 continuation and Task 2):
  - `export const SESSION_COOKIE_NAME: string`
  - `export function signSessionToken(session: AdminSession): string`
  - `export function verifySessionToken(raw: string): AdminSession | null`
  - `export function isSessionExpired(expiresAtUtc: string): boolean`

- [ ] **Step 1: Add the test runner**

Add `vitest` to `devDependencies` in `package.json`, add scripts `"test": "vitest run"` and `"test:watch": "vitest"`. Create `vitest.config.ts` at the project root with `test.environment: "node"`, `test.env: { SESSION_SECRET: "test-session-secret-not-for-production" }`, and a `resolve.alias` mapping `@` to `./src` (matching `tsconfig.json`'s `paths`). Run `npm install`.

- [ ] **Step 2: Write the failing tests for `session-token.ts`**

```ts
// src/features/auth/lib/session-token.test.ts
import { describe, it, expect, vi } from "vitest";
import { signSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "./session-token";
import type { AdminSession } from "@/features/auth/types/auth.dto";

const validSession: AdminSession = {
  accessToken: "token",
  expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
  user: { id: "1", email: "a@b.com", fullName: "A B", username: "ab", role: "Admin" },
};

describe("signSessionToken / verifySessionToken", () => {
  it("round-trips a valid session", () => {
    const token = signSessionToken(validSession);
    expect(verifySessionToken(token)).toEqual(validSession);
  });

  it("rejects a tampered payload", () => {
    const token = signSessionToken(validSession);
    const [payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...validSession, user: { ...validSession.user, role: "Admin-tampered" } }),
    ).toString("base64url");
    expect(verifySessionToken(`${tamperedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = signSessionToken(validSession);
    const [payload] = token.split(".");
    expect(verifySessionToken(`${payload}.not-a-real-signature`)).toBeNull();
  });

  it("rejects a legacy unsigned cookie (no signature segment)", () => {
    const legacy = Buffer.from(JSON.stringify(validSession), "utf8").toString("base64url");
    expect(verifySessionToken(legacy)).toBeNull();
  });

  it("rejects a validly-signed but expired session", () => {
    const expired: AdminSession = { ...validSession, expiresAtUtc: new Date(Date.now() - 1000).toISOString() };
    const token = signSessionToken(expired);
    expect(verifySessionToken(token)).toBeNull();
  });

  it("throws at module load when SESSION_SECRET is missing", async () => {
    vi.resetModules();
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    await expect(import("./session-token")).rejects.toThrow();
    process.env.SESSION_SECRET = original;
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- session-token`
Expected: FAIL — `./session-token` has no exports yet.

- [ ] **Step 4: Implement `session-token.ts`**

Read `SESSION_SECRET` once into a module-level `const` and `throw` immediately if it's unset (fail fast, satisfies the missing-module-load test). Build the token as `base64url(JSON.stringify(session)) + "." + base64url(hmac-sha256(payload, SESSION_SECRET))`. In `verifySessionToken`, split on `"."`, reject anything that isn't exactly 2 parts, recompute the HMAC and compare with `crypto.timingSafeEqual` (reject on length mismatch before calling it), then `JSON.parse` the payload inside a `try/catch`, and reject if `accessToken` is missing, `user.role !== "Admin"`, or `isSessionExpired(expiresAtUtc)` is true. Export `SESSION_COOKIE_NAME = "devjr-admin-session"` and `isSessionExpired` from this module.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- session-token`
Expected: PASS (6 tests)

- [ ] **Step 6: Wire `session.ts` to the new token module**

Modify `src/features/auth/lib/session.ts`: remove the local `SESSION_COOKIE_NAME` constant and the `encodeSession`/`decodeSession` functions; import `SESSION_COOKIE_NAME`, `signSessionToken`, `verifySessionToken`, `isSessionExpired` from `./session-token` and re-export `isSessionExpired` (existing call sites import it from `session.ts`, not `session-token.ts`). `createAdminSessionCookie` calls `signSessionToken` instead of `encodeSession`; `getAdminSession` calls `verifySessionToken(rawSession)` directly (it already does the null/expiry check, so `getAdminSession` no longer needs its own separate `isValidAdminSession` check after decoding — keep `isValidAdminSession` exported as-is since `admin/login/page.tsx` imports it directly). Do not change any other exported signature.

- [ ] **Step 7: Verify existing behavior still compiles**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 8: Document and set the new env var**

Create `.env.example` with `NEXT_PUBLIC_API_URL=http://localhost:5228` and `SESSION_SECRET=` (empty, with a comment that it must be a long random string, server-only). Add a real generated value for `SESSION_SECRET` to `.env.local` (not committed).

- [ ] **Step 9: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/features/auth/lib/session-token.ts src/features/auth/lib/session-token.test.ts src/features/auth/lib/session.ts .env.example
git commit -m "$(cat <<'EOF'
feat(auth): sign admin session cookie with HMAC-SHA256

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `proxy.ts` defense in depth for `/admin`

**Files:**
- Modify: `proxy.ts`
- Test: `proxy.test.ts`

**Interfaces:**
- Consumes: `SESSION_COOKIE_NAME`, `verifySessionToken` from `src/features/auth/lib/session-token.ts` (Task 1).

- [ ] **Step 1: Write the failing tests**

```ts
// proxy.test.ts
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import proxy from "./proxy";
import { signSessionToken, SESSION_COOKIE_NAME } from "@/features/auth/lib/session-token";
import type { AdminSession } from "@/features/auth/types/auth.dto";

const validSession: AdminSession = {
  accessToken: "token",
  expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
  user: { id: "1", email: "a@b.com", fullName: "A B", username: "ab", role: "Admin" },
};

function requestWithCookie(path: string, cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue) headers.set("cookie", `${SESSION_COOKIE_NAME}=${cookieValue}`);
  return new NextRequest(new URL(path, "https://example.com"), { headers });
}

describe("proxy admin guard", () => {
  it("redirects to /admin/login when the cookie is missing", () => {
    const res = proxy(requestWithCookie("/admin"));
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toContain("/admin/login");
  });

  it("redirects to /admin/login when the cookie is tampered", () => {
    const token = signSessionToken(validSession);
    const res = proxy(requestWithCookie("/admin", `${token}x`));
    expect(res?.headers.get("location")).toContain("/admin/login");
  });

  it("lets the request through when the cookie is valid", () => {
    const token = signSessionToken(validSession);
    const res = proxy(requestWithCookie("/admin", token));
    expect(res?.headers.get("location")).toBeNull();
  });

  it("does not guard /admin/login itself", () => {
    const res = proxy(requestWithCookie("/admin/login"));
    expect(res?.headers.get("location")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- proxy.test`
Expected: FAIL — current `proxy.ts` returns `NextResponse.next()` unconditionally for `/admin`, and the matcher excludes `/admin` anyway so no redirect ever happens.

- [ ] **Step 3: Implement the guard in `proxy.ts`**

Replace the `if (pathname.startsWith("/admin")) return NextResponse.next();` branch: if the pathname is `/admin/login` (or starts with `/admin/login/`), `return NextResponse.next()`; otherwise read `request.cookies.get(SESSION_COOKIE_NAME)?.value`, pass it through `verifySessionToken`, and `return NextResponse.redirect(new URL("/admin/login", request.url))` when it's `null`, else `NextResponse.next()`. Update `config.matcher` to remove `admin` from the negative lookahead (`/((?!api|_next|_vercel|.*\\..*).*)`) so `/admin/*` paths actually reach `proxy()` — today's matcher excludes them entirely, which is the root cause of audit finding 5.1.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- proxy.test`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add proxy.ts proxy.test.ts
git commit -m "$(cat <<'EOF'
feat(auth): verify signed session cookie in proxy for /admin

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Blog HTML sanitization

**Files:**
- Create: `src/features/blog/lib/sanitize-html.ts`
- Test: `src/features/blog/lib/sanitize-html.test.ts`
- Modify: `src/features/blog/lib/block-content.ts`
- Test: `src/features/blog/lib/block-content.test.ts` (new file — no prior tests existed for this module)
- Modify: `src/components/blog/BlockRenderer.tsx`
- Modify: `package.json` (add `isomorphic-dompurify`)

**Interfaces:**
- Produces: `export function sanitizeInlineHtml(value: string): string` (`sanitize-html.ts`); `export function sanitizeBlogContentDocument(doc: BlogContentDocument): BlogContentDocument` (`block-content.ts`), consumed by Task 4.

- [ ] **Step 1: Install the dependency**

Add `isomorphic-dompurify` to `dependencies` in `package.json`, run `npm install`.

- [ ] **Step 2: Write the failing tests for `sanitizeInlineHtml`**

```ts
// src/features/blog/lib/sanitize-html.test.ts
import { describe, it, expect } from "vitest";
import { sanitizeInlineHtml } from "./sanitize-html";

describe("sanitizeInlineHtml", () => {
  it("strips script tags", () => {
    expect(sanitizeInlineHtml("hi<script>alert(1)</script>")).toBe("hi");
  });

  it("strips event handler attributes from img", () => {
    expect(sanitizeInlineHtml('<img src=x onerror="alert(1)">')).not.toContain("onerror");
  });

  it("strips javascript: hrefs", () => {
    expect(sanitizeInlineHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });

  it("keeps allowed formatting tags", () => {
    expect(sanitizeInlineHtml("<b>bold</b> and <i>italic</i>")).toBe("<b>bold</b> and <i>italic</i>");
  });

  it("keeps an https link with its href", () => {
    expect(sanitizeInlineHtml('<a href="https://example.com">link</a>')).toBe(
      '<a href="https://example.com">link</a>',
    );
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- sanitize-html`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `sanitize-html.ts`**

Use `isomorphic-dompurify`'s default export, calling `.sanitize(value, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP })` with `ALLOWED_TAGS = ["b", "strong", "i", "em", "a", "code", "mark", "u", "s"]`, `ALLOWED_ATTR = ["href"]`, and a URI regexp that only matches `http:`, `https:`, and `mailto:` schemes (or bare text with no scheme).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- sanitize-html`
Expected: PASS (5 tests)

- [ ] **Step 6: Write the failing test for `sanitizeBlogContentDocument`**

```ts
// src/features/blog/lib/block-content.test.ts
import { describe, it, expect } from "vitest";
import { sanitizeBlogContentDocument } from "./block-content";
import type { BlogContentDocument } from "./block-content";

describe("sanitizeBlogContentDocument", () => {
  it("sanitizes paragraph, header and image caption text", () => {
    const doc: BlogContentDocument = {
      blocks: [
        { type: "paragraph", data: { text: "<script>alert(1)</script>safe" } },
        { type: "header", data: { text: "<img onerror=alert(1)>title", level: 2 } },
        { type: "image", data: { caption: "<script>alert(1)</script>caption", file: { url: "https://x/y.png" } } },
      ],
    };
    const result = sanitizeBlogContentDocument(doc);
    expect(result.blocks[0]).toMatchObject({ data: { text: "safe" } });
    expect((result.blocks[1] as { data: { text: string } }).data.text).toBe("title");
    expect((result.blocks[2] as { data: { caption: string } }).data.caption).toBe("caption");
  });

  it("sanitizes nested list items at every depth", () => {
    const doc: BlogContentDocument = {
      blocks: [
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "<script>alert(1)</script>top",
              { content: "<script>alert(2)</script>mid", items: ["<script>alert(3)</script>deep"] },
            ],
          },
        },
      ],
    };
    const result = sanitizeBlogContentDocument(doc);
    const items = (result.blocks[0] as { data: { items: unknown[] } }).data.items;
    expect(items[0]).toBe("top");
    expect((items[1] as { content: string }).content).toBe("mid");
    expect((items[1] as { items: string[] }).items[0]).toBe("deep");
  });

  it("does not sanitize code blocks", () => {
    const doc: BlogContentDocument = { blocks: [{ type: "code", data: { code: "<script>x</script>" } }] };
    const result = sanitizeBlogContentDocument(doc);
    expect((result.blocks[0] as { data: { code: string } }).data.code).toBe("<script>x</script>");
  });
});
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `npm test -- block-content`
Expected: FAIL — `sanitizeBlogContentDocument` not exported.

- [ ] **Step 8: Implement `sanitizeBlogContentDocument` in `block-content.ts`**

Import `sanitizeInlineHtml` from `./sanitize-html`. Add a `sanitizeListItem` helper mirroring the shape of the existing `normalizeListItem` (recurse into `.items`), and a `sanitizeBlogContentDocument(doc)` that maps over `doc.blocks`, applying `sanitizeInlineHtml` to `paragraph.data.text`, `header.data.text`, `image.data.caption` (only if present), and `list.data.items` (via `sanitizeListItem`), leaving `code` blocks untouched.

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm test -- block-content`
Expected: PASS (3 tests)

- [ ] **Step 10: Wire sanitization into `BlockRenderer.tsx`**

At the top of the `BlockRenderer({ content })` function body, add `const safeContent = sanitizeBlogContentDocument(content);` and change every subsequent reference from `content.blocks` to `safeContent.blocks` (the rest of the switch/render logic is unchanged). Import `sanitizeBlogContentDocument` from `@/features/blog/lib/block-content`.

- [ ] **Step 11: Verify the project still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json src/features/blog/lib/sanitize-html.ts src/features/blog/lib/sanitize-html.test.ts src/features/blog/lib/block-content.ts src/features/blog/lib/block-content.test.ts src/components/blog/BlockRenderer.tsx
git commit -m "$(cat <<'EOF'
fix(blog): sanitize EditorJS HTML before rendering

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Validate + sanitize-on-save for blog admin routes

**Files:**
- Create: `src/features/blog/lib/blog-admin.schema.ts`
- Test: `src/features/blog/lib/blog-admin.schema.test.ts`
- Modify: `src/app/api/admin/blog/route.ts`
- Modify: `src/app/api/admin/blog/[id]/route.ts`
- Test: `src/app/api/admin/blog/route.test.ts`
- Test: `src/app/api/admin/blog/[id]/route.test.ts`

**Interfaces:**
- Consumes: `sanitizeBlogContentDocument`, `parseBlogContentJson`, `stringifyBlogContentDocument` (Task 3, `block-content.ts`); `requestAdmin`, `apiEndpoints` (existing, `@/features/admin/lib/admin-api`).
- Produces: `export const upsertBlogPostSchema: ZodSchema` (`blog-admin.schema.ts`).

- [ ] **Step 1: Write the failing schema tests**

```ts
// src/features/blog/lib/blog-admin.schema.test.ts
import { describe, it, expect } from "vitest";
import { upsertBlogPostSchema } from "./blog-admin.schema";

const validBody = {
  title: "t", slug: "t", excerpt: "e", contentJson: "{}",
  coverImageUrl: null, published: true, publishedAt: null, tagIds: ["1"],
};

describe("upsertBlogPostSchema", () => {
  it("accepts a valid payload", () => {
    expect(upsertBlogPostSchema.safeParse(validBody).success).toBe(true);
  });

  it("rejects a missing title", () => {
    const { title, ...rest } = validBody;
    expect(upsertBlogPostSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a non-string element in tagIds", () => {
    expect(upsertBlogPostSchema.safeParse({ ...validBody, tagIds: [1] }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- blog-admin.schema`
Expected: FAIL.

- [ ] **Step 3: Implement `blog-admin.schema.ts`**

`z.object` mirroring `UpsertBlogPostRequestDto`: `title`, `slug`, `excerpt`, `contentJson` as non-empty strings (`z.string().min(1)`); `coverImageUrl`, `publishedAt` as `z.string().nullish()`; `published` as `z.boolean()`; `tagIds` as `z.array(z.string())`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- blog-admin.schema`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the failing route handler tests**

```ts
// src/app/api/admin/blog/route.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/lib/admin-api", () => ({
  apiEndpoints: { adminBlogPosts: "/admin/blog-posts" },
  requestAdmin: vi.fn().mockResolvedValue({ id: "1" }),
}));

import { POST } from "./route";
import { requestAdmin } from "@/features/admin/lib/admin-api";

const validBody = {
  title: "t", slug: "t", excerpt: "e",
  contentJson: JSON.stringify({ blocks: [{ type: "paragraph", data: { text: "<script>alert(1)</script>safe" } }] }),
  coverImageUrl: null, published: true, publishedAt: null, tagIds: ["1"],
};

describe("POST /api/admin/blog", () => {
  it("returns 400 and does not call requestAdmin for an invalid body", async () => {
    const { title, ...rest } = validBody;
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(rest) }));
    expect(res.status).toBe(400);
    expect(requestAdmin).not.toHaveBeenCalled();
  });

  it("sanitizes contentJson before forwarding a valid body", async () => {
    await POST(new Request("http://x", { method: "POST", body: JSON.stringify(validBody) }));
    const forwarded = vi.mocked(requestAdmin).mock.calls[0][1]?.json as { contentJson: string };
    expect(forwarded.contentJson).not.toContain("<script>");
    expect(forwarded.contentJson).toContain("safe");
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm test -- api/admin/blog/route`
Expected: FAIL — no validation/sanitization wired in yet.

- [ ] **Step 7: Implement validation + sanitize-on-save in `blog/route.ts` (POST) and `blog/[id]/route.ts` (PUT)**

In both handlers: parse the body, run `upsertBlogPostSchema.safeParse(body)`; on failure return `NextResponse.json({ message: "validation_error", errors: result.error.flatten() }, { status: 400 })`. On success, build `sanitizedBody = { ...result.data, contentJson: stringifyBlogContentDocument(sanitizeBlogContentDocument(parseBlogContentJson(result.data.contentJson))) }` and pass that as `json` to `requestAdmin` instead of the raw `body`.

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- api/admin/blog`
Expected: PASS

- [ ] **Step 9: Write and pass the equivalent test for `blog/[id]/route.ts` (PUT)**

Mirror Step 5–6's test file for `PUT`, importing from `./route` in `src/app/api/admin/blog/[id]/`, constructing the second argument as `{ params: Promise.resolve({ id: "1" }) }`. Confirm it fails then passes the same way.

- [ ] **Step 10: Commit**

```bash
git add src/features/blog/lib/blog-admin.schema.ts src/features/blog/lib/blog-admin.schema.test.ts "src/app/api/admin/blog/route.ts" "src/app/api/admin/blog/route.test.ts" "src/app/api/admin/blog/[id]/route.ts" "src/app/api/admin/blog/[id]/route.test.ts"
git commit -m "$(cat <<'EOF'
feat(blog): validate and sanitize admin blog post payloads

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Validate projects, tags and users admin routes

**Files:**
- Create: `src/features/projects/lib/project-admin.schema.ts`, `src/features/tags/lib/tag-admin.schema.ts`, `src/features/users/lib/user-admin.schema.ts`
- Test: one `.test.ts` file per schema above
- Modify: `src/app/api/admin/projects/route.ts`, `src/app/api/admin/projects/[id]/route.ts`, `src/app/api/admin/tags/route.ts`, `src/app/api/admin/users/route.ts`
- Test: one `.test.ts` file per modified route handler above

**Interfaces:**
- Consumes: `requestAdmin`, `apiEndpoints` (existing).
- Produces: `upsertProjectSchema`, `createTagSchema`, `createUserSchema` (each a `ZodSchema`), not consumed elsewhere in this plan.

- [ ] **Step 1: Write and fail the three schema tests**

For each schema, one test file with an "accepts a valid payload" case and 1-2 "rejects an invalid payload" cases, following the exact pattern from Task 4 Step 1:
  - `project-admin.schema.test.ts`: valid payload matching `UpsertProjectRequestDto`; reject a missing `title`; reject a `stack` array containing a number.
  - `tag-admin.schema.test.ts`: valid `{ name: "t", slug: "t" }`; reject a missing `slug`.
  - `user-admin.schema.test.ts`: valid payload matching `CreateUserRequestDto`; reject an invalid `email`; reject a `password` shorter than 8 characters.

Run: `npm test -- schema`
Expected: FAIL (modules don't exist).

- [ ] **Step 2: Implement the three schemas**

- `project-admin.schema.ts`: `z.object` mirroring `UpsertProjectRequestDto` — `title`/`slug`/`description`/`content`/`domain` as `z.string().min(1)`; `coverImageUrl`/`repoUrl`/`liveUrl`/`videoUrl` as `z.string().nullish()`; `galleryImages`/`stack`/`tagIds` as `z.array(z.string())`; `metrics` as `z.record(z.string(), z.string().nullable())`; `featured`/`published` as `z.boolean()`.
- `tag-admin.schema.ts`: `z.object({ name: z.string().min(1), slug: z.string().min(1) })`.
- `user-admin.schema.ts`: `z.object` mirroring `CreateUserRequestDto` — `fullName`/`username`/`role` as `z.string().min(1)`; `email` as `z.string().email()`; `password` as `z.string().min(8)`.

- [ ] **Step 3: Run schema tests to verify they pass**

Run: `npm test -- schema`
Expected: PASS

- [ ] **Step 4: Write and fail one route handler test per modified route**

Following the exact mock pattern from Task 4 Step 5 (`vi.mock("@/features/admin/lib/admin-api", ...)`), for each of `projects/route.ts` (POST), `projects/[id]/route.ts` (PUT), `tags/route.ts` (POST), `users/route.ts` (POST): one test asserting an invalid body returns 400 and `requestAdmin` is not called, and one test asserting a valid body calls `requestAdmin` and returns its data.

Run: `npm test -- api/admin`
Expected: FAIL for the four new/changed handlers.

- [ ] **Step 5: Wire `safeParse` into the four route handlers**

Same pattern as Task 4 Step 7, without the sanitize-on-save step (not needed — no rich-text field in these DTOs): `schema.safeParse(body)`, 400 with `{ message: "validation_error", errors: result.error.flatten() }` on failure, else forward `result.data` to `requestAdmin`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, full suite green.

- [ ] **Step 7: Commit**

```bash
git add \
  src/features/projects/lib/project-admin.schema.ts src/features/projects/lib/project-admin.schema.test.ts \
  src/features/tags/lib/tag-admin.schema.ts src/features/tags/lib/tag-admin.schema.test.ts \
  src/features/users/lib/user-admin.schema.ts src/features/users/lib/user-admin.schema.test.ts \
  "src/app/api/admin/projects/route.ts" "src/app/api/admin/projects/route.test.ts" \
  "src/app/api/admin/projects/[id]/route.ts" "src/app/api/admin/projects/[id]/route.test.ts" \
  "src/app/api/admin/tags/route.ts" "src/app/api/admin/tags/route.test.ts" \
  "src/app/api/admin/users/route.ts" "src/app/api/admin/users/route.test.ts"
git commit -m "$(cat <<'EOF'
feat(admin): validate projects, tags and users payloads with Zod

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Manual verification (not automated, run once all tasks land)

1. `npm run dev`, log into `/admin`, open devtools → Application → Cookies, edit one character of `devjr-admin-session`, reload `/admin` → expect redirect to `/admin/login`.
2. Create/edit a blog post with a paragraph containing `<script>alert(1)</script>bold<b>text</b>` in the editor, save, view the public post → expect no alert, "bold" visible as plain text, "text" rendered bold.
3. Submit the admin blog/project/tag/user forms with a required field cleared via devtools (bypassing client-side validation) → expect a 400 response, not a 500 or a silent pass-through to the backend.
