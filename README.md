# While

Healthcare EMR/EHR connectivity platform — **UI-only MVP** built with Nuxt 4. Operators monitor integrations, tunnels, and compliance from a single console with separate **Sandbox** and **Live** environments.

## Features

- **Overview** — usage KPIs, throughput chart, connection watchlist (Live-gated when no activated partners)
- **Sandbox / Live** — global environment switcher; paired sandbox/live connections; Live activation blockers
- **Connections** — partner directory; per-connection **Overview**, **Connectivity**, **Mapping**, and **Logs** routes with topology diagram and tooltips
- **Messages** — inbox, filters, histogram, message detail slideover
- **Tunnel Uptime** — per-connection timelines and event log
- **Logs** — integration log stream with categories, pagination, PHI anonymize toggle
- **Compliance** — BAA status, checklist, audit log (mock)
- **Support** — inbox plus multi-step connection request and ticket flows
- **Developer Docs** — static API documentation via Nuxt Content (`/docs`)
- **Settings** — light / dark / system appearance

## Documentation

Product and UX notes for this interface version:

- **[`doc/interface.md`](./doc/interface.md)** — full write-up of navigation, environments, views, and patterns
- **[`doc/README.md`](./doc/README.md)** — index of repo documentation

In-app integrator docs live under [`content/docs/`](./content/docs/) and are served at `/docs`.

## Stack

- Nuxt 4.4 · Nuxt UI 4 · Tailwind CSS 4
- Nuxt Content 3 · Unovis (charts) · Iconoir (icons)
- TypeScript · VueUse

## Getting started

Requires [pnpm](https://pnpm.io) (see `packageManager` in `package.json`).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
pnpm build      # production build
pnpm preview    # preview production build
pnpm typecheck  # vue-tsc via nuxt typecheck
pnpm lint       # eslint
```

## Project layout

```
app/
  components/   # UI by domain (connections, dashboard, live, logs, …)
  composables/  # useConnections, useEnvironment, useConnectionDetail, …
  data/         # mock static datasets
  pages/        # file-based routes
content/docs/   # Developer Docs (Nuxt Content)
doc/            # internal interface / product documentation
```

## Note

This is a **UI-only** phase — all data is mock/static. There is no backend API or real authentication. Environment and color preferences persist in `localStorage` only.
