# Accesibilidad — headings, fieldset/legend, aria-invalid (sub-proyecto 5/6)

Fecha: 2026-10-02
Origen: `docs/audit-2026-10-01.md`, hallazgos 2.2 (jerarquía de headings duplicada, Medio), 2.3 (checkboxes de tags sin agrupación semántica, Medio), 2.4 (formularios sin aria-invalid/aria-describedby, Bajo — alcance ampliado a los 3 formularios admin, no solo login, por decisión explícita).

## Objetivo

Cerrar 3 defectos de accesibilidad puntuales y bien acotados, sin tocar diseño visual ni comportamiento funcional de ningún formulario o página.

## A. Jerarquía de headings en `src/components/blog/BlockRenderer.tsx`

El bloque `"header"` (líneas 53-82) clampea `block.data.level` entre 1 y 3 y renderiza un `<h1>` real cuando el nivel es 1. Las páginas que usan `BlockRenderer` (`blog/[slug]/page.tsx`) ya tienen su propio `<h1>` vía `PageHero` — un bloque "header nivel 1" del editor produce un segundo `<h1>` en la misma página, rompiendo la jerarquía para lectores de pantalla.

Cambio: el clamp mínimo pasa de 1 a 2 (`Math.max(2, block.data.level ?? 2)`), dejando la rama `h1` inalcanzable — se elimina esa rama (código muerto) y el bloque se simplifica:

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

Nada más en el archivo cambia — el saneamiento (`sanitizeBlogContentDocument`), el resto de los `case`, y las clases se mantienen idénticos.

## B. `fieldset`/`legend` en los checkboxes de tags

`src/features/blog/components/blog-form.tsx` (líneas 296-326) y el bloque **idéntico duplicado** en `src/features/projects/components/project-form.tsx` (líneas 347-377) envuelven el grupo de checkboxes de tags en un `<div><p>Tags</p>...</div>`. Pasa a:

```tsx
<fieldset className="space-y-3 border-0 p-0 m-0">
  <legend className="p-0 text-sm font-medium">Tags</legend>
  {/* resto del contenido (estado vacío / grid de checkboxes) sin cambios */}
</fieldset>
```

`border-0 p-0 m-0` en el `fieldset` y `p-0` en el `legend` resetean el estilo default del navegador para que el resultado visual sea idéntico al `div`/`p` actual. El resto del bloque (el mensaje de "No tags available yet", el grid de checkboxes, el `onChange`/`toggleTag`) no cambia. El checkbox individual "Published" (blog-form) / "Featured" y "Published" (project-form) no se toca — son checkboxes sueltos, no un grupo, `fieldset` no aplica ahí.

## C. `aria-invalid` / `aria-describedby`

### `src/features/auth/components/admin-login-form.tsx`

En los inputs `email` (líneas 103-110) y `password` (líneas 120-127): agrega `aria-invalid={Boolean(errors.email)}` y `aria-describedby={errors.email ? "email-error" : undefined}` (mismo patrón para password con `"password-error"`). El `<p>` de error correspondiente gana `id="email-error"` / `id="password-error"`.

### `src/features/blog/components/blog-form.tsx` y `src/features/projects/components/project-form.tsx`

Ambos archivos tienen su propio componente local `Field` (duplicado, misma forma exacta: `<label><span>{label}</span>{children}{error}</label>`). Gana un prop opcional `id?: string`:

```tsx
import { cloneElement, isValidElement, type ReactElement } from "react";

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

Cuando se pasa `id`, `Field` clona el hijo inyectándole `id`/`aria-invalid`/`aria-describedby` — un solo cambio corrige todos los campos que reciban `id`. Cuando no se pasa `id`, `Field` se comporta exactamente como hoy (sin cambios).

Se pasa `id` únicamente en los campos que participan en `validate()`/`mapApiErrors()` de cada formulario (los que realmente pueden mostrar un error) — para los demás (campos sin validación posible, y el campo "Content" de `blog-form.tsx` que envuelve `<BlockEditor>`, un componente con su propio tipo de props, no un `<input>`/`<textarea>` plano) se omite `id` y no se les aplica la inyección.

**`blog-form.tsx`** — campos con `id`: `title`, `slug`, `excerpt`, `coverImageUrl`, `publishedAt`. Sin `id` (sin cambio): `contentJson` (envuelve `BlockEditor`).

**`project-form.tsx`** — campos con `id`: `title`, `slug`, `description`, `domain`, `coverImageUrl`, `galleryImages`, `repoUrl`, `liveUrl`, `videoUrl`, `content` (este sí es un `<textarea>` plano, no `BlockEditor`). Sin `id` (nunca tienen error de validación): `stack`, `metrics`.

## Testing

- `npx tsc --noEmit`, `npm run lint`, `npm test` (suite existente, 51 tests) en verde — ninguno de estos 5 archivos tiene tests hoy.
- Manual, en navegador: confirmar visualmente que el blog no cambia de aspecto (headings, tags, forms se ven igual); con un lector de pantalla o las devtools de accesibilidad, confirmar que un bloque "header nivel 1" del editor ahora renderiza `<h2>`, que el grupo de tags se anuncia como grupo (`role` implícito de `fieldset`/`legend`), y que un campo con error en los 3 formularios admin tiene `aria-invalid="true"` y `aria-describedby` apuntando a un `id` que existe en el DOM.
