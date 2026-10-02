# Seguridad crítica — hardening de admin y blog (sub-proyecto 1/6)

Fecha: 2026-10-01
Origen: `docs/audit-2026-10-01.md`, hallazgos 5.1, 5.2, 5.3 y 4.3.
Alcance: Next.js 16.2.3 / React 19, App Router. `proxy.ts` corre en runtime Node.js (ya no Edge) — confirmado en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.

## Objetivo

Cerrar los tres riesgos de seguridad más graves del proyecto antes de cualquier lanzamiento:

1. Contenido de blog sanitizado para prevenir XSS persistente contra visitantes públicos.
2. Cookie de sesión admin a prueba de manipulación por el propio usuario.
3. Validación runtime de los bodies que llegan a `api/admin/*` en vez de confiar ciegamente en el backend ASP.NET.

Incluye además el hallazgo 5.1 (defensa en profundidad a nivel de `proxy.ts` para `/admin/*`), añadido al alcance porque depende directamente de la firma de cookie (punto 2) y es barato de cerrar una vez esa firma existe.

Fuera de alcance explícito: 2FA/rate-limiting de login (5.5, backend), rotación de `.env.local` (5.4), todo lo que no sea seguridad (UX, performance, accesibilidad, limpieza de shims — sub-proyectos 2-6).

## A. Firma HMAC de la cookie de sesión + defensa en profundidad en `proxy.ts`

### Formato de la cookie

Hoy: `devjr-admin-session = base64url(JSON.stringify(session))`.

Nuevo: `devjr-admin-session = base64url(JSON.stringify(session)) + "." + base64url(HMAC-SHA256(payload, SESSION_SECRET))`.

- El payload (`AdminSession`: `accessToken`, `user`, `expiresAtUtc`) no cambia de forma, solo se le añade una firma.
- No se cifra el contenido: el `accessToken` ya depende de validación de firma JWT en el backend ASP.NET para cualquier llamada real a la API, y la cookie sigue siendo `httpOnly` + `secure` en producción. La amenaza que se cierra es la edición manual del JSON (p.ej. `role: "Admin"`) para renderizar el shell admin sin serlo — eso lo resuelve la integridad (firma), no la confidencialidad.
- Verificación con `crypto.timingSafeEqual` sobre los HMACs (longitud fija, 32 bytes) para evitar timing attacks.

### `src/features/auth/lib/session.ts`

- `encodeSession`/`decodeSession` pasan a `signSession`/`verifySessionCookie`.
- `verifySessionCookie(raw: string): AdminSession | null` es una función pura (sin `next/headers`), reutilizable desde Server Components (vía `cookies()`) y desde `proxy.ts` (vía `NextRequest.cookies`).
- Firma inválida, payload corrupto, o expirado → todos devuelven `null` sin distinguir el motivo (no filtrar por qué falló).
- `SESSION_SECRET` se lee una sola vez a nivel de módulo; si no está definida, se lanza un error al cargar el módulo (fail fast) en vez de operar sin firmar.

### Nueva env var

- `SESSION_SECRET`: string server-only (sin prefijo `NEXT_PUBLIC_`), mínimo 32 caracteres recomendados.
- Se añade `.env.example` (nuevo archivo) documentando `NEXT_PUBLIC_API_URL` (ya existente) y `SESSION_SECRET`.
- El usuario deberá generar y añadir su propio valor a `.env.local` (no versionado) como parte de la implementación.

### `proxy.ts`

- Se amplía para interceptar `/admin/:path*` excepto `/admin/login` (y excepto los propios assets/`_next`).
- Lee la cookie cruda con `request.cookies.get("devjr-admin-session")`, la pasa por `verifySessionCookie`; si es `null`, `NextResponse.redirect(new URL("/admin/login", request.url))`.
- `requireAdminSession()` en `src/app/admin/(protected)/layout.tsx` no cambia su contrato externo — solo se beneficia de que `getAdminSession()` ahora verifica firma internamente. El proxy es una capa adicional, no un reemplazo.
- Las rutas `api/admin/*` siguen protegidas igual que hoy vía `requestAdmin()` → `getAdminAccessToken()` → `getAdminSession()` (que ahora verifica firma); no se les añade matcher de proxy separado porque ya fallan con 401 si la sesión es inválida.

## B. Sanitización con DOMPurify (render + guardado) — sólo blog

Confirmado por grep: `dangerouslySetInnerHTML` sólo aparece en `src/components/blog/BlockRenderer.tsx`. Projects/tags/users no renderizan HTML enriquecido, así que no se tocan.

### Nueva dependencia

- `isomorphic-dompurify` (funciona tanto en Server Components como en Route Handlers de Node.js runtime).

### `src/features/blog/lib/sanitize-html.ts` (nuevo)

```
sanitizeInlineHtml(value: string): string
```
- Allowlist de tags: `b`, `strong`, `i`, `em`, `a`, `code`, `mark`, `u`, `s`.
- Allowlist de atributos: `href` sólo en `a`.
- `href` restringido a protocolos `http:`, `https:`, `mailto:` (bloquea `javascript:` y similares vía `ALLOWED_URI_REGEXP` de DOMPurify).

### `src/features/blog/lib/block-content.ts` (extendido)

- Nueva función `sanitizeBlogContentDocument(doc: BlogContentDocument): BlogContentDocument`, que reutiliza el mismo recorrido de bloques que ya usan `normalizeBlogContentDocument`/`extractTextFromBlogContent`, aplicando `sanitizeInlineHtml` a: `paragraph.data.text`, `header.data.text`, `image.data.caption`, y recursivamente a cada `BlogListItem.content`/string.
- `code.data.code` **no** se sanitiza con DOMPurify (se renderiza como texto plano dentro de `<pre><code>`, nunca vía `dangerouslySetInnerHTML` — ver `BlockRenderer.tsx` líneas 79-87 actuales).

### Render — `src/components/blog/BlockRenderer.tsx`

- Al entrar a `BlockRenderer({ content })`, primero `const safeContent = sanitizeBlogContentDocument(content)`, y todo el `switch`/`map` existente pasa a iterar sobre `safeContent.blocks` en vez de `content.blocks`. No se toca cada `dangerouslySetInnerHTML` individualmente.

### Guardado — `api/admin/blog/route.ts` (POST) y `api/admin/blog/[id]/route.ts` (PUT)

- Después de que Zod valida la forma del body (ver sección C), se transforma `contentJson` antes de reenviar al backend:
  ```
  const doc = parseBlogContentJson(parsed.contentJson);
  const sanitizedDoc = sanitizeBlogContentDocument(doc);
  const sanitizedBody = { ...parsed, contentJson: stringifyBlogContentDocument(sanitizedDoc) };
  ```
- Esto es defensa en profundidad: el render-time sanitiza igual aunque este paso fallara o datos legacy ya estuvieran guardados sin limpiar.

## C. Validación Zod en `api/admin/*`

### Nueva dependencia

- `zod`.

### Schemas (uno por feature, reflejando los DTOs existentes como fuente de verdad)

- `src/features/blog/lib/blog-admin.schema.ts` → espejo de `UpsertBlogPostRequestDto` (`title`, `slug`, `excerpt`: strings no vacíos; `contentJson`: string, se valida como JSON parseable dentro del handler, no en el schema; `coverImageUrl`: string url opcional/nullable; `published`: boolean; `publishedAt`: string opcional/nullable; `tagIds`: array de strings).
- `src/features/projects/lib/project-admin.schema.ts` → espejo de `UpsertProjectRequestDto` (strings requeridos para `title`/`slug`/`description`/`content`/`domain`; arrays de strings para `galleryImages`/`stack`/`tagIds`; `metrics` como `record<string, string|null>`; urls opcionales para `repoUrl`/`liveUrl`/`videoUrl`/`coverImageUrl`; booleans `featured`/`published`).
- `src/features/tags/lib/tag-admin.schema.ts` → espejo de `CreateTagRequestDto` (`name`, `slug`: strings no vacíos).
- `src/features/users/lib/user-admin.schema.ts` → espejo de `CreateUserRequestDto` (`fullName`, `username`, `email` con `.email()`, `password` con longitud mínima, `role`: string no vacío).

### Integración en los route handlers

Para cada handler que acepta body (`blog` POST, `blog/[id]` PUT, `projects` POST, `projects/[id]` PUT, `tags` POST, `users` POST):

```ts
const body = await request.json();
const result = schema.safeParse(body);

if (!result.success) {
  return NextResponse.json(
    { message: "validation_error", errors: result.error.flatten() },
    { status: 400 },
  );
}

const data = await requestAdmin(endpoint, { method, json: result.data });
```

- El shape de la respuesta de error (`{ message, errors }`) coincide con el que ya devuelve `toAdminErrorResponse` para errores del backend, para no romper el manejo de errores existente en los forms admin.
- GET y DELETE no llevan body, no se tocan.

## Testing

- **Cookie:** unit test de `signSession`/`verifySessionCookie` — round-trip válido, detección de tampering (flip de un byte en el payload o en la firma → `null`), expiración.
- **Sanitización:** unit tests de `sanitizeInlineHtml`/`sanitizeBlogContentDocument` con payloads típicos (`<img src=x onerror=alert(1)>`, `<script>alert(1)</script>`, `<a href="javascript:alert(1)">`) confirmando que se neutralizan, y que tags permitidos (`<b>`, `<a href="https://...">`) sobreviven.
- **Zod:** unit tests por schema con payloads válidos e inválidos representativos (campo faltante, tipo incorrecto, email inválido, password corta).
- **Manual:** login admin → editar el valor de la cookie `devjr-admin-session` en devtools → recargar `/admin` → debe redirigir a `/admin/login`.

## Archivos tocados (resumen)

- `src/features/auth/lib/session.ts` (modificado)
- `proxy.ts` (modificado)
- `.env.example` (nuevo)
- `src/features/blog/lib/sanitize-html.ts` (nuevo)
- `src/features/blog/lib/block-content.ts` (modificado)
- `src/components/blog/BlockRenderer.tsx` (modificado)
- `src/app/api/admin/blog/route.ts` (modificado)
- `src/app/api/admin/blog/[id]/route.ts` (modificado)
- `src/features/blog/lib/blog-admin.schema.ts` (nuevo)
- `src/features/projects/lib/project-admin.schema.ts` (nuevo)
- `src/features/tags/lib/tag-admin.schema.ts` (nuevo)
- `src/features/users/lib/user-admin.schema.ts` (nuevo)
- `src/app/api/admin/projects/route.ts`, `src/app/api/admin/projects/[id]/route.ts`, `src/app/api/admin/tags/route.ts`, `src/app/api/admin/users/route.ts` (modificados)
- `package.json` (nuevas dependencias: `isomorphic-dompurify`, `zod`)
