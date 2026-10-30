# SchoolBookTracker

This template should help get you started developing with Vue 3 in Vite.

## Workspaces

- `apps/web`: Vue frontend, Vite configuration, and frontend tests.
- `apps/api`: Express backend, Drizzle schema, and migration history.
- Root: shared linting/formatting configuration and one npm lockfile.

Install dependencies with `npm install` from the repository root. Put the backend
connection string in `apps/api/.env.local` as `DATABASE_URL`; keep this file out of Git.

`npm run dev` starts both apps. Use `npm run dev:web` or `npm run dev:api` to
start one workspace. Vite forwards `/api` requests to Express on port 3000.

`npm run type-check` checks both workspaces and tooling configuration.
`npm run format` formats both source directories; `npm run lint` lints from the root.
Run tests once with `npm run test:unit -- --run`.

Generate migrations with `npm run db:generate -- --name=describe_change` and apply
them with `npm run db:migrate`. The API workspace owns the Drizzle configuration.
The web build outputs `apps/web/dist`; the API build currently checks types only
and its start command runs TypeScript through `tsx`.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
