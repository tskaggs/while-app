# While interface — current version

This document describes the **UI-only MVP** of the While operator console: layout, navigation, environments, and each major view. All data is mock/static; there is no backend API or real authentication.

---

## Purpose

While is positioned as a **healthcare EMR/EHR connectivity platform**. The interface lets an integration operator:

- Monitor partner connections and message throughput
- Inspect tunnel health, mapping, and logs per connection
- Work in **Sandbox** (safe test data) or **Live** (production-shaped data with activation gates)
- Manage compliance artifacts and request support for onboarding

The experience is a single-page application built with **Nuxt 4** and **Nuxt UI 4**, using a top navigation shell rather than a persistent sidebar.

---

## Visual design

### Brand and typography

- **Wordmark:** “While” in Instrument Serif with a brand accent underline (purple in dark mode; lab purple in light mode).
- **UI type:** Inter for body, labels, tables, and navigation.
- **Primary brand color:** `lab(46.4195 14.6904 -42.411)` — used for charts, accents, and primary actions in light mode; extended as the `while` Tailwind color scale.

### Theme

- **Dark** is the default preference (stored in `localStorage` under `while-color-mode`).
- **Light** mode is available from **Settings** and the **user menu** (sun / moon / system).
- Light mode uses a warm off-white page background with soft radial gradients; dark mode uses zinc neutrals and elevated cards.

### Icons

- Interface icons use **Iconoir** via `@iconify-json/iconoir` (`i-iconoir-*` classes).
- The user menu trigger uses `profile-circle` instead of an avatar image.

### Layout shell

- **Sticky top bar:** logo, primary nav (desktop center / mobile scroll row), search, Sandbox/Live switcher, tunnel uptime indicator, notifications, user menu.
- **Page content:** full-width body below the header; page-level titles sit above toolbars/filters where applicable (`PageHeader` + optional `NavTitle` back control).

---

## Global controls

### Sandbox / Live switcher

A pill control in the top bar toggles the active **environment**:

| Mode | Meaning in the UI |
|------|-------------------|
| **Sandbox** | Mock EHR endpoints, no production PHI narrative; all sandbox connections visible. |
| **Live** | Production-shaped data; only **activated** live connections contribute to operational metrics (messages, uptime charts, overview aggregates). |

Switching environments:

- Updates lists, charts, and logs to the matching mock dataset
- On a **connection detail** URL, resolves the **paired** connection id (sandbox ↔ live) and preserves the sub-route (Overview, Connectivity, Mapping, Logs)
- Shows a toast confirming the switch

### Command palette search

`UDashboardSearch` indexes main nav destinations (Overview, Connections, Messages, etc.) for quick jumps.

### Back navigation

`NavTitle` shows a back button when browser history allows leaving nested views (connection detail, support flows, docs).

---

## Primary navigation

| Label | Route | Role |
|-------|-------|------|
| Overview | `/` | Dashboard KPIs, hero chart, connection watchlist |
| Connections | `/connections` | Partner integration directory |
| Messages | `/messages` | HL7/FHIR message inbox with filters |
| Tunnel Uptime | `/uptime` | Per-connection tunnel timeline and events |
| Logs | `/logs` | Global integration log stream |
| Compliance | `/compliance` | BAA, checklist, audit artifacts |
| Developer Docs | `/docs` | Static API docs (Nuxt Content) |
| Support | `/support` | Inbox + compose connection/ticket flows |
| Settings | `/settings` | Appearance (color mode) |

---

## Sandbox vs Live data model

### Paired connections

Every sandbox connection has a **live twin** (`pairedConnectionId`). Demo data includes four pairs (e.g. North Valley, Summit, Riverside, Lakeview).

### Live activation

Live connections carry `liveActivation`:

- **`activated: true`** — Full access to operational views and connection detail sub-pages.
- **`activated: false`** — Blocked with **`LiveActivationRequired`**: explains blocker type (`customer_action`, `while_documents`, `clinic_approval`, `clinic_connectivity`), waiting party, and link back to sandbox twin when relevant.

**`LiveViewGate`** wraps environment-wide Live views (e.g. Overview) when no activated live connections exist, showing aggregate blocker messaging instead of empty charts.

### Operational filtering

In Live mode, composables expose `operationalConnections` (activated only) for messages, logs, uptime, and usage metrics so the UI reflects “production-ready” partners only.

---

## Views

### Overview (`/`)

- Gated in Live when nothing is activated.
- **Performance AI summary** card (mock narrative).
- **Usage chart** — hero area chart with timeframe pills; overview uses brand purple surface with light tooltip text.
- **Connection watchlist** — searchable table with status filter; links to connection detail.

### Connections (`/connections`)

- Page title above filter bar pattern.
- Table: partner, EHR, environment or Live column, sidecar id, tunnel status, last sync, row actions.
- **New connection** flows via Support, not inline creation.

### Connection detail (`/connections/:id`)

Shared header for all sub-views:

- Partner name, metadata line (EHR · sidecar · environment)
- **Sub-navigation** beside the title: Overview | Connectivity | Mapping | Logs
- **Live not activated** badge when applicable (tunnel status badge removed from header)

| Sub-view | Route | Content |
|----------|-------|---------|
| **Overview** | `/connections/:id` | Topology diagram, integration details card, flight check list |
| **Connectivity** | `.../connectivity` | WireGuard keys, endpoints, copy actions |
| **Mapping** | `.../mapping` | Field mapping UI (demo) |
| **Logs** | `.../logs` | `LogStream` scoped to connection id |

**Topology diagram** (Overview only):

- Three nodes: Your App → While Sidecar → Clinic EHR
- Horizontal connectors with labeled pills (`Secure API`, `WireGuard`)
- Status colors: **green** connected, **yellow** to be reviewed, **red** failed
- Footer pills on each node with **tooltips** explaining metrics (MTU, handshake, HL7, message counts, etc.)
- Dot-grid canvas background; alert below when tunnel pending/error

Unactivated live connections show the activation blocker instead of sub-page content.

### Messages (`/messages`)

- Filter toolbar (direction, status, connection, search).
- Table with direction icons; row opens detail slideover.
- Histogram chart for volume (client-only).

### Tunnel Uptime (`/uptime`)

- Connection filter and search.
- Timeline chart per connection (client-only).
- Event log table with severity and detail slideover.

### Logs (`/logs`)

- Category, severity, connection, time range filters.
- **Anonymize PHI** toggle (masks mock sensitive fields in UI).
- Paginated table; row opens log detail slideover.

### Compliance (`/compliance`)

- BAA status and download (mock).
- Security checklist with pass/pending/fail icons.
- Audit report generation (mock).
- Change log list.

### Developer Docs (`/docs`)

- Separate layout with TOC and content from `content/docs/`.
- Topics: getting started, environments, webhooks, FHIR, sidecar endpoints, error codes.

### Support (`/support`)

- Inbox list (connection requests + tickets).
- Compose: new connection wizard (multi-step), ticket form.
- Detail slideover per item.

### Settings (`/settings`)

- Color mode select (light / dark / system).

---

## Key UI patterns

1. **Page header hierarchy** — H1 title above filters on list pages; connection detail puts sub-nav inline with title.
2. **Slideover details** — Messages, logs, uptime events, support items use right-hand slideovers for drill-down without leaving the list.
3. **Status semantics** — Success / warning / error colors align across badges, topology connectors, and tunnel badges.
4. **Client-only charts** — Unovis charts load in `*.client.vue` components to avoid SSR issues.
5. **No real auth** — User menu is static (“Sarah Chen”) with theme and settings links only.

---

## Mock data locations

| Domain | Source |
|--------|--------|
| Connections & live activation | `app/data/connections.ts` |
| Messages | `app/data/messages.ts` (via composables) |
| Logs | `app/data/logs.ts` |
| Uptime events | `app/data/uptime.ts` |
| Usage / overview chart | `app/data/usage.ts` |
| Compliance | `app/data/compliance.ts` |

Environment selection is held in `useEnvironment` (`localStorage` key `while-env`).

---

## Technical stack (interface-relevant)

- **Nuxt 4.4** + **Vue 3.5**
- **Nuxt UI 4.7** (components, tokens, `UApp` tooltip provider)
- **Tailwind CSS 4**
- **Nuxt Content 3** — in-app docs
- **Unovis** — charts
- **Iconoir** — icon set
- **pnpm** — package manager (`packageManager` in `package.json`)

---

## Out of scope (this version)

- Real API, webhooks, or sidecar provisioning
- Authentication, RBAC, and audit trails backed by a server
- Editing mappings or tunnel config with persistence
- Live promotion wizard (removed; activation state is data-driven only)

---

## Suggested reading order for engineers

1. `app/layouts/default.vue` — nav map  
2. `app/composables/useEnvironment.ts` + `useConnections.ts` — environment and pairing  
3. `app/pages/connections/[id].vue` + `useConnectionDetail.ts` — detail shell  
4. `app/components/connections/TopologyMap.vue` — diagram behavior  
5. `app/components/live/LiveActivationRequired.vue` + `LiveViewGate.vue` — Live gating  

For API copy shown to integrators, use **`content/docs/`** and the `/docs` routes, not this `doc/` folder.
