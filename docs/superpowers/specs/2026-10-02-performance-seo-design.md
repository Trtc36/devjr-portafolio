# Performance y SEO — next/image + metadataBase/sitemap/robots (sub-proyecto 3/6)

Fecha: 2026-10-02
Origen: `docs/audit-2026-10-01.md`, hallazgos 3.1 (cero uso de `next/image`, Alto) y 3.3 (falta `metadataBase`/`sitemap.ts`/`robots.ts`).
Alcance: Next.js 16.2.3 / React 19, App Router.

## Objetivo

1. Cerrar el hallazgo de performance más alto del proyecto: 0 uso de `next/image` en los 5 `<img>` existentes → CLS previsible (sin `width`/`height` reservados), sin optimización automática de formato/`srcset`, sin control de prioridad de carga del LCP.
2. Dar al sitio indexabilidad básica correcta: `metadataBase` resuelve URLs de OG relativas correctamente, `sitemap.ts`/`robots.ts` existen y reflejan contenido real.

Fuera de alcance explícito: manifest de PWA/favicon avanzado, cambiar el fetcher global a `revalidate` por defecto (hallazgo 3.4, distinto sub-proyecto), cambiar el flujo de admin de "pegar URL de imagen" a upload gestionado.

## A. Migración de `<img>` a `next/image`

### `next.config.ts`

Agrega:
```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "**" },
    { protocol: "http", hostname: "**" },
  ],
},
```
Patrón amplio deliberado: el campo "Cover image URL" en `blog-form.tsx`/`project-form.tsx` es un input de texto libre validado solo como "URL válida" (sin restricción de dominio) — un `remotePatterns` restringido a dominios específicos rompería cualquier URL de un host no listado que un admin pegue después de este cambio. `http` se incluye porque `NEXT_PUBLIC_API_URL` de desarrollo es `http://localhost:5228`.

### Cards de listado: `project-card.tsx`, `editorial-post-row.tsx`

Contenedor pasa de `<div className="overflow-hidden border-b ...">` a `<div className="relative h-56 w-full overflow-hidden border-b ...">`. El `<img>` se reemplaza por:
```tsx
<Image
  src={coverImageUrl}
  alt={...}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
/>
```
(clases de hover/transition que ya existían se preservan). `project-card.tsx` es `"use client"` (por `framer-motion`) — `next/image` funciona igual en client components, sin cambios adicionales.

### Portadas de detalle: `blog/[slug]/page.tsx`, `projects/[slug]/page.tsx`

Mismo patrón `fill`: el contenedor existente (`className="overflow-hidden rounded-[2rem] border ... bg-[hsl(var(--surface))]"`) gana `relative` y una altura explícita (`h-[280px] md:h-[420px]`, ya presente en el `<img>` actual, se mueve al contenedor). `sizes="100vw"` (ocupan el ancho completo de `PageShell`). **`priority`** en ambos — son el candidato más probable a LCP de sus respectivas páginas de detalle.

### Galería de proyecto (`projects/[slug]/page.tsx`, `artifact.imageUrl`)

Mismo patrón `fill` + contenedor `relative`, `sizes="(max-width: 768px) 100vw, 50vw"`, **sin** `priority` (no es LCP, son N imágenes en una grilla más abajo en la página).

### Imágenes embebidas del blog (`BlockRenderer.tsx`, bloque `image`)

Dimensiones desconocidas de antemano (contenido arbitrario del editor). En vez de `fill`, usa el patrón documentado de Next para "ancho/alto variable, responsive":
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
`width`/`height` son solo un hint de aspect-ratio para el optimizador (requeridos por la API de `next/image` cuando no se usa `fill`); `h-auto w-full` en CSS hace que la imagen final respete su proporción real una vez cargada, no el 1200×675 exacto.

### No afectado

El `<img>` dentro de `sanitize-html.ts`/`block-content.ts` (strings de test con payloads XSS) no son renderizado real — fuera de alcance, no se tocan.

## B. `metadataBase` + `sitemap.ts` + `robots.ts`

### Nueva env var `NEXT_PUBLIC_SITE_URL`

- `.env.local`: `NEXT_PUBLIC_SITE_URL=https://devjr.example.com` (placeholder — aún no hay dominio definitivo).
- `.env.example`: misma key con un comentario `# Replace with the real production domain before deploying`.

### `src/app/layout.tsx` (root, modificado)

El `metadata` export existente (`title`, `description`) gana:
```ts
metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://devjr.example.com"),
```
Se aplica a todas las páginas/locales — Next resuelve `metadataBase` desde el layout ancestro más cercano, incluyendo el `Metadata` que ya arma `buildMetadata()` en `src/lib/metadata.ts` (función sin cambios).

### `src/app/sitemap.ts` (nuevo)

`export default async function sitemap(): Promise<MetadataRoute.Sitemap>`. Contenido:
- Rutas estáticas × 2 locales (`en`/`es`, por `localePrefix: "always"`): `/`, `/projects`, `/blog`, `/about`, `/contact` → 10 entradas.
- Dinámicas: `getProjects()` y `getBlogPosts()` (mismas funciones que ya usan las páginas públicas), una entrada por `slug` × 2 locales, con `lastModified` tomado de `publishedAt` (no existe un campo `updatedAt` separado en los view-models actuales — `publishedAt` es el mejor proxy disponible).
- `export const revalidate = 3600;` — `getProjectsFromApi`/`getBlogPostsFromApi` (`src/features/{projects,blog}/services/*.api.ts`) tienen un `catch` que cae a datos fixture locales (`fallbackProjects`/`fallbackPosts`) si el backend no responde; sin `revalidate`, un sitemap generado en un build sin backend disponible quedaría permanentemente con slugs de fixture. Con `revalidate`, Next lo regenera cada hora contra el backend real.

### `src/app/robots.ts` (nuevo)

`export default function robots(): MetadataRoute.Robots`:
```ts
{
  rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
  sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://devjr.example.com"}/sitemap.xml`,
}
```

## Testing

- `npx tsc --noEmit` y `npm run lint` en verde (ningún componente de prueba existente se ve afectado).
- `npm test` (suite existente, 51 tests) sin regresión — ninguno de estos archivos tiene tests hoy.
- Manual, en navegador (`npm run dev`): las 5 imágenes cargan sin error de `next/image` (hostname no configurado se vería como error 400 en la consola del navegador); Network tab confirma que las imágenes sirven como `image/webp` o `image/avif` en vez del formato original; Lighthouse o DevTools "Layout Shift" no muestra CLS en las cards/portadas (contenedor ya reserva el espacio antes de que cargue la imagen).
- Manual: visitar `/sitemap.xml` y `/robots.txt` en dev, confirmar que listan las rutas esperadas y que un slug de blog/proyecto real aparece.
