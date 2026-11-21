---
id: frontend-development
title: Frontend Development Guide
sidebar_label: Frontend Development
sidebar_position: 2
description: Working on the web app in apps/web — React 19, React Router 7 loaders and actions, Vite 7, and Tailwind.
---

# Frontend Development Guide

This guide explains how to work on the FF RESTaurent web application in
`apps/web`.

Stack versions were checked on 2026-10-22 against `apps/web/package.json` on `develop` and `main` (React Router 8.4, Vite 8.3, Tailwind CSS 4.3). The tree below matches that checkout. Production web hosting is [VPS and Vercel Hosting](../runbooks-operations/vps-and-vercel-hosting.md). The `/api` proxy in `apps/web/middleware.ts` is on `main` only.

## Technology Stack

- React 19 with TypeScript
- React Router 8 route loaders and actions
- Vite 8
- Tailwind CSS 4 plus app CSS in `src/index.css`
- `react-hot-toast` for localized transient feedback
- `lucide-react` for icons
- Recharts for responsive statistics charts
- `@ff-restaurent/shared` for shared enums, phone parsing, and bill-splitting
  rules

## Source Layout

There is no `src/pages` directory. Each domain lives under `src/features`.

```text
apps/web/src/
|-- main.tsx
|-- index.css
|-- api/
|   |-- client.ts            ApiClient and ApiError
|   |-- endpoints.ts
|   |-- types.ts
|   `-- generated/           api-types.ts from the OpenAPI contract
|-- app/
|   |-- App.tsx
|   |-- router.ts            composes the feature route modules
|   |-- root.routes.ts
|   |-- mutation-action.ts   one action for form mutations
|   |-- mutation-invalidation.ts
|   `-- providers/           app-context, i18n, theme, accent, query
|-- features/
|   |-- address/
|   |-- admin/
|   |-- auth/
|   |-- bills/
|   |-- catalog/
|   |-- collections/
|   |-- meal-votes/
|   |-- members/
|   |-- notifications/
|   |-- participant-groups/
|   |-- profile/
|   |-- recipes/
|   |-- restaurants/
|   `-- stats/
|-- components/
|   |-- ui/
|   `-- layout/
|-- hooks/
|   |-- useRouteMutation.ts
|   |-- useStoredState.ts
|   `-- useUrlFilters.ts
`-- lib/
    |-- session.ts
    |-- permissions.ts
    |-- currency.ts
    |-- push.ts
    |-- pwa.ts
    |-- result-messages.ts
    `-- translations/        en/ and vi/ JSON, assembled by translations/index.ts
```

A feature folder holds its pages, its `*.routes.ts` loaders and actions, and colocated tests (`*.test.ts`, `*.test.tsx`).

## Routing and Data Flow

The app uses React Router, configured in `src/app/router.ts`.

- `App.tsx` owns the shell and route error boundary.
- `router.ts` composes route modules from `src/features/*/*.routes.ts`. Those modules define loaders, intents, and redirects.
- Page components read loader data through React Router APIs. TanStack Query, provided by `src/app/providers/query.tsx`, caches client reads. `mutation-invalidation.ts` drops the queries a successful mutation affects.
- Shared app state, including the authenticated user and i18n, theme, and accent providers, lives under `src/app/providers/`.
- Form mutations submit to `mutationAction` in `src/app/mutation-action.ts`. Pages use `useRouteMutation` (`src/hooks/useRouteMutation.ts`) for the shared submit and toast flow. There is no `useMutation` hook.

Do not reintroduce the obsolete `tab`/`screen` state-router pattern or
page-level result banners. Mutation outcomes, background warnings, and API
failures should use localized `react-hot-toast` messages unless a field-level
validation error or route error boundary is more appropriate.

## API Client and Session Handling

`src/api/client.ts` contains `ApiClient` and `ApiError`. Request and response
types live in `src/api/types.ts` and in `src/api/generated/api-types.ts`.
Regenerate the generated file from the repository root with
`npm run openapi:generate` when the API contract changes. Do not hand-edit it.

Session storage is isolated in `src/lib/session.ts`. JWTs include a
`sessionVersion`; password changes, assisted resets, and root transfers can
invalidate older tokens. The web client should replace the stored token whenever
the API returns a fresh one.

## Components and UI Rules

- Use shared primitives from `src/components/ui` before adding one-off controls.
- Use `Dropdown.tsx` for production selection controls. Do not add native
  `<select>` elements for app selection UI.
- Use `ScrollArea.tsx` for app-owned scrolling regions. Do not add
  `react-scrollbars-custom`.
- Use `ConfirmDialog.tsx` or `Modal.tsx` for destructive confirmations and
  focused modal workflows.
- Keep reusable shell pieces in `components/layout`.
- Keep domain UI in the matching `features/<domain>` folder. Restaurants, bills, catalog, recipes, collections, and meal votes already follow that split.

## Domain Rules

- All money values from the API are integer cents. Never use floating point math
  for persisted or API monetary values.
- Shared bill-splitting behavior belongs in `packages/shared`, not duplicated in
  the web app.
- The API is the source of truth for Vietnamese phone validation. The web uses
  the shared parser only for immediate feedback.
- ROOT_ADMIN is the only role that manages member roles and root ownership.
  HEAD_CHEF has global bill visibility and archive/restore powers, but must not
  be treated as a member-governance role.
- Phase 2 normalized restaurant contracts are authoritative. Favorites and
  recommended restaurants persist through collections; cuisine and platform
  links persist through normalized relations. Legacy response aliases are
  derived by the API compatibility serializer.

## Shared Package Consumption

Vite aliases `@ff-restaurent/shared` to `packages/shared/src/index.ts`
(`apps/web/vite.config.ts`). The web `tsconfig` typechecks shared through a
project reference, not a path alias.

The root build and the API still use the compiled workspace output, so
rebuild shared before production builds or when validating changes that touch
shared exports:

```powershell
npm run build --workspace @ff-restaurent/shared
```

## Local Development

Run from the repository root:

```powershell
npm install
npm run dev --workspace @ff-restaurent/web
```

Expected local URL:

```text
http://localhost:5173
```

The API base URL is controlled by `VITE_API_URL`.

## Verification

For web-only changes:

```powershell
npm run typecheck --workspace @ff-restaurent/web
npm run lint --workspace @ff-restaurent/web
npm test --workspace @ff-restaurent/web
npm run build --workspace @ff-restaurent/web
```

For broader changes before review:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

When shared code changes, run the shared package tests and rebuild shared before
web verification:

```powershell
npm test --workspace @ff-restaurent/shared
npm run build --workspace @ff-restaurent/shared
```

## Frontend Change Checklist

- Add or update route loaders/actions when page data or navigation-coupled
  mutations change.
- Keep hand-written API types in `src/api/types.ts` aligned with backend responses, and regenerate `src/api/generated/api-types.ts` when the OpenAPI contract changes.
- Use localized strings from `src/lib/translations`; avoid hard-coded user-facing text in feature UI.
- Keep transient mutation feedback in toasts.
- Keep validation close to the field or route action that owns it.
- Preserve integer-cent handling for money.
- Use shared UI primitives for dropdowns, modals, scroll regions, and layout.
- Add or update colocated tests for changed routing, API result handling, and
  component behavior.
