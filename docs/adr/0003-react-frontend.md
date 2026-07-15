# ADR 0003 — React + Vite frontend for the demo page

## Status

Accepted (2026-07-15)

## Context

M5 shipped the demo page as a single self-contained static HTML file (vanilla
CSS/JS, no build step, no external requests) — a deliberate constraint: keep
every layer walkable cold, and keep the browser surface trivial next to the
headline (the eval harness). The M6-era redesign kept that constraint and even
pinned it with a CI contract test.

Two forces changed the calculus. First, the portfolio goal widened: the project
should also demonstrate **React/TypeScript frontend skill**, not only a tasteful
static page — component architecture, typed data flow, and frontend testing are
themselves interview artefacts. Second, the page had grown real UI state
(parallel report + extraction fetches, races between clicks, loading/error
states) that string-concatenated `innerHTML` expresses poorly and untestably.

## Decision

We will rebuild the demo as a **React 19 + Vite** app in `web/`, building into
`public/` — the directory Fastify already serves — so the server keeps zero
knowledge of the frontend toolchain.

- **One package, no workspace split.** React, Vite, and Testing Library are
  devDependencies of the root package; `vite build` is the only new build step
  (`npm run build:web`, run automatically by `pretest`, `make serve`, and a
  dedicated Docker stage). The runtime image ships only the static output.
- **Shared types across the stack.** The client imports its API types
  (`Report`, `Citation`, `CitedChunk`, `DocumentExtraction`, `Extraction`)
  type-only from the server source — one definition; a server shape change
  fails the frontend typecheck.
- **Component tests in CI.** Testing Library + jsdom cover the report flow,
  progressive enhancement (a failed `/extract` never blocks the report), and
  rate-limit errors; the reworked contract test asserts the _built artifact_
  (shell + hashed assets serve, the bundle calls every API surface, styles keep
  the light/dark contract, nothing loads from another origin).
- **Same design system.** The tokens, layout, and accessibility work from the
  M28 redesign carry over unchanged; the self-hosted property (no CDN, no
  external requests) is retained even though the file count grew.

This supersedes the "no build step" property of the M5 demo page decision (the
demo-page portion of ADR 0001's deploy story; ADR 0001's stack and deploy
decisions otherwise stand). The keyless-by-default posture is unchanged.

## Consequences

### Positive

- The repo now demonstrates typed React component architecture, hooks-based
  state (a discriminated-union view model, stale-response protection), and
  frontend testing — a second interview artefact beside the agent/eval system.
- UI state is testable: 29 keyless tests now include component and contract
  coverage that the innerHTML page could not support.
- Type sharing turns API drift into a compile error instead of a runtime bug.

### Negative

- A build step exists: Docker gained a `web` stage, `make serve` builds before
  serving, and `pretest` rebuilds (~0.5 s) on every test run.
- The served bundle is ~64 kB gzipped (React's cost) versus ~4 kB for the
  static page.
- The page is no longer readable as one file; walking it cold now means
  walking a component tree.

### Neutral

- `public/` is build output and gitignored; the committed frontend source of
  truth moved to `web/`.
- Frontend hot-reload is `npm run dev:web` (Vite dev server proxying the API
  to :3000); the served build remains the source of truth for tests.
