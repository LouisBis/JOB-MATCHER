# Frontend Architecture

Angular 21 application — standalone components, signals, lazy-loaded routes, design system via Style Dictionary.

---

## Folder structure

```text
frontend/
├── design-tokens/          ← Untitled UI token definitions (JSON, source of truth)
├── build-tokens.mjs        ← Style Dictionary v5 build script (tokens → CSS variables)
├── public/
│   └── assets/mock/        ← Static JSON for GitHub Pages demo (no backend needed)
└── src/
    ├── environments/
    │   ├── environment.ts          ← dev  : useMock=false, apiUrl=n8n webhook
    │   └── environment.github.ts  ← demo : useMock=true,  apiUrl=''
    ├── styles/
    │   └── generated/_tokens.css  ← auto-generated CSS custom properties (git-ignored)
    ├── styles.scss                 ← global reset + font + token application on body
    ├── index.html                  ← loads Inter font (Google Fonts preconnect)
    └── app/
        ├── app.config.ts           ← providers: HttpClient, Router, LOCALE_ID (fr)
        ├── app.routes.ts           ← lazy routes (one chunk per page)
        ├── app.component.*         ← shell: <app-navbar> + <router-outlet>
        ├── core/
        │   ├── models/             ← TypeScript interfaces (Offer, Preferences)
        │   ├── services/           ← OffersService, PreferencesService
        │   ├── components/navbar/  ← sticky top nav, RouterLinkActive
        │   └── i18n/fr.ts          ← all UI labels as typed constants (no hardcoded strings)
        └── features/
            ├── offers/
            │   ├── components/
            │   │   ├── offer-card/     ← card with score + source badges
            │   │   ├── score-badge/    ← 1–10 colored pill (green / orange / red)
            │   │   └── source-badge/   ← Indeed / France Travail pill
            │   └── pages/
            │       ├── offers-list/    ← dashboard, offers sorted by score desc
            │       └── offer-detail/   ← full view + external "Voir l'annonce" CTA
            └── preferences/
                └── pages/preferences/ ← reactive form, read-only in mock mode
```

---

## Design system — token pipeline

```text
design-tokens/*.json
        │
        ▼  build-tokens.mjs  (Style Dictionary v5, ESM)
src/styles/generated/_tokens.css   →  --jm-color-brand-600, --jm-spacing-4, …
        │
        ▼  angular.json styles array (loaded before styles.scss)
All components                      →  var(--jm-*) in .scss files
```

Token source files — Untitled UI values:

| File | Content |
|---|---|
| `color.json` | Brand (25–950), gray (25–950), success / warning / error |
| `typography.json` | Inter, sizes xs–4xl, weights, line heights |
| `spacing.json` | 4 px scale: `1` (4 px) → `20` (80 px) |
| `radius.json` | `sm` (4 px) → `full` (9999 px) |
| `shadow.json` | `xs` → `xl` Untitled UI shadows |

`_tokens.css` is git-ignored — rebuilt automatically by `npm run tokens`, which is chained in both `npm start` and `npm run build`.

---

## Routing

```typescript
// app.routes.ts — each route is a separate lazy-loaded chunk
{ path: 'offers',      loadComponent: () => import('…/offers-list') }
{ path: 'offers/:id',  loadComponent: () => import('…/offer-detail') }
{ path: 'preferences', loadComponent: () => import('…/preferences') }
```

Each page is code-split into its own JavaScript chunk at build time. Nothing is loaded until the user navigates to the route.

---

## Service layer

Both services switch their data source based on `environment.useMock`:

| Service | Dev (n8n) | Mock (GitHub Pages) |
|---|---|---|
| `getOffers()` | `GET /webhook/jobs` | `assets/mock/offers.json` |
| `getOfferById(id)` | `GET /webhook/jobs/:id` | filters mock list client-side |
| `getPreferences()` | `GET /webhook/preferences` | `assets/mock/preferences.json` |
| `savePreferences()` | `POST /webhook/preferences` | disabled (form read-only) |

---

## Component patterns

**Signals** for all local state (`signal()`, `computed()`, `input.required()`):

```typescript
// Read-only signal input (Angular 17+)
readonly score = input.required<number>();

// Derived state — recomputed when score changes
readonly colorClass = computed(() => {
  const s = this.score();
  if (s >= 8) return 'badge--success';
  if (s >= 5) return 'badge--warning';
  return 'badge--error';
});
```

**New control flow** (`@if` / `@for`) instead of `*ngIf` / `*ngFor` — no `CommonModule` import needed:

```html
@if (loading()) {
  <p>Chargement…</p>
} @else {
  @for (offer of offers(); track offer.id) {
    <app-offer-card [offer]="offer" />
  }
}
```

---

## i18n

All visible strings live in `core/i18n/fr.ts` as a typed `as const` object. Components import `LABELS` and reference keys — no hardcoded strings in templates or components.

```typescript
// core/i18n/fr.ts
export const LABELS = {
  offers: { loadError: 'Impossible de charger les offres.', … },
  …
} as const;

// In a component
readonly labels = LABELS.offers;
// In the template
{{ labels.loadError }}
```

Single-language by design (French). Switching to multi-language would mean replacing this file with `ngx-translate` + JSON files per locale.

---

## Build configurations

| Configuration | `useMock` | `baseHref` | Usage |
|---|---|---|---|
| `development` (default) | `false` | `/` | `npm start` with n8n running |
| `mock` | `true` | `/` | `ng serve --configuration mock` — UI dev without backend |
| `github-pages` | `true` | `/JOB-MATCHER/` | `npm run build:gh-pages` → GitHub Pages |

---

## Local development

```bash
cd frontend

# With n8n backend running
npm start

# Without backend — mock data only
npx ng serve --configuration mock

# Production build for GitHub Pages
npm run build:gh-pages
```
