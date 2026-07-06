# AI Due Diligence Assistant

[![CI](https://github.com/edjchapman/ai-due-diligence-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/edjchapman/ai-due-diligence-assistant/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**An AI due-diligence assistant** that ingests a target company's filings, board minutes, and public commentary, runs structured due-diligence checks via a stateful **LangGraph.js** agent, and produces an **audit-grade report with cited sources** — plus a **CI-runnable evaluation harness** that scores its own answers. A portfolio project by [Ed Chapman](https://github.com/edjchapman) demonstrating end-to-end ownership of a production-shaped LLM system in **TypeScript/Node.js**: design, build, deploy, operate, evaluate.

> **Status: `M5` (deploy + demo + case study).** The full system is in place: ingest → cited
> retrieval → a LangGraph.js agent (`GET /report/:company`) → an **eval harness that scores every
> finding against a golden set and runs in CI on every push** (see [Evaluation](#evaluation)).
> A minimal demo page, rate-limited endpoints, and a keyless-by-default Railway deploy config ship
> here; read the [case study](docs/case-study.md). Quality is measured, not asserted.

## Why this exists

Most engineers can call an LLM API. Fewer can show a _system_ around it: retrieval with citations, a stateful agent, and — critically — an **evaluation loop that runs in CI** so quality is measured, not asserted. This project is that system, deliberately built in TypeScript/Node.js.

## Architecture (target)

```text
Ingest CLI (TS) ─▶ Postgres + pgvector (Drizzle) ─▶ Fastify API ─▶ LangGraph.js agent ─▶ Eval harness (golden + LLM-as-judge, in CI)
```

- **Fastify** typed HTTP surface — a demo page at `/`, plus `/health`, `/companies`, `/search`, `/report/:company` (rate-limited). The eval harness is a CLI + CI gate, not an endpoint.
- **Postgres + pgvector** via **Drizzle ORM** — one store for relational metadata and vector retrieval.
- **LangGraph.js** stateful agent — a node per due-diligence check, each retrieving, reasoning (Claude via the **Vercel AI SDK**), and returning a cited finding.
- **Eval harness** (Vitest) — golden-set + LLM-as-judge, runnable in CI.

## Quickstart

**See it work in one command — no API key needed:**

```bash
make demo   # pgvector up → migrate → ingest → print a cited audit report per company
```

`make demo` is the milestone demo: it runs the whole pipeline end-to-end and prints an
audit report (flagged vs clear per check, with citations) for each reference company. It's
keyless by design (`EMBED_PROVIDER=local` + `LLM_PROVIDER=local`, deterministic stand-ins)
so it runs on a fresh clone with just Docker. Each milestone extends it to demo what it added.

**The real thing** (semantic embeddings + Claude, over HTTP):

```bash
npm ci
cp .env.example .env          # set DATABASE_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY
docker compose up -d db       # Postgres + pgvector
npm run db:migrate            # apply schema + CREATE EXTENSION vector
npm run ingest                # embed the reference-company fixtures into pgvector
npm run dev                   # Fastify on :3000
curl 'localhost:3000/search?q=revenue%20concentration'   # cited retrieval
curl 'localhost:3000/report/northwind'                   # full cited DD report
```

- `/search?q=<query>&k=<n>` embeds the query and returns cosine top-k chunks, each cited.
- `/report/:company` runs the LangGraph agent and returns a structured report: a finding
  per check with `verdict`, `summary`, and `citations`. `:company` matches ingested names
  case-insensitively. Ingest is idempotent: `npm run ingest -- helios` re-ingests just one.

## Evaluation

The headline signal: quality is **measured, not asserted**. The harness runs the agent over
every reference company and scores each finding against a **golden set** (the expected verdicts,
planted in the fixtures) with an **LLM-as-judge**. It runs in CI on every push and fails the
build below threshold.

```bash
make eval   # keyless: ingest → run agent → score vs golden → PASS/FAIL
```

```
  Score: 12/12 (100%)  —  PASS (threshold 90%)
```

Two honest layers:

- **CI gate (keyless, deterministic):** the agent runs on the local reasoner and a verdict-match
  judge — a regression gate that proves the whole pipeline (ingest → retrieve → reason → graph →
  score) still yields the expected findings on every push. This is the `12/12` above.
- **LLM-as-judge (keyed):** scores the **real** Claude-reasoned reports, with Claude judging each
  finding for faithfulness to its cited evidence:

  ```bash
  EMBED_PROVIDER=openai LLM_PROVIDER=anthropic JUDGE_PROVIDER=anthropic npm run eval
  ```

## Demo page & deploy

A minimal demo page (served at `/`) lists the companies, runs a report, and searches the corpus —
no build step, just static HTML calling the API. Public endpoints (`/search`, `/report`,
`/companies`) are rate-limited to 60/min/IP; `/health` is exempt for platform probes.

Deploy targets **Railway** (config in [`railway.json`](railway.json), one Docker image, `/health`
probe). The container is **keyless by default** (`EMBED_PROVIDER=local`, `LLM_PROVIDER=local`) — the
public demo needs no API keys and costs nothing per request; the boot command migrates, seeds the
fixtures, and serves. To deploy (mirrors the AWS-documented target as a swap):

```bash
railway init                 # link a Railway project
railway add --database postgres   # provision Postgres — must have the pgvector extension
railway up                   # build the Dockerfile image and deploy
```

For the **real** semantic + Claude-reasoned path in production, set `EMBED_PROVIDER=openai`,
`LLM_PROVIDER=anthropic`, and the `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` variables in Railway.

## Development

```bash
npm run typecheck   # tsc (strict)
npm run lint        # eslint (type-checked)
npm test            # vitest — set RUN_DB_TESTS=1 (+ a live DB) for the DB-backed tests
make check          # the full gate CI runs: typecheck + lint + format + test
make eval           # the eval harness (keyless)
```

## Milestones

- [x] **M1** — repo + typed Fastify skeleton (`/health`), Postgres/pgvector schema (Drizzle), Docker, CI green.
- [x] **M2** — ingest CLI + OpenAI embeddings + cited retrieval (`/search`); pgvector integration test in CI.
- [x] **M3** — LangGraph.js DD-check agent (node per check) + `GET /report/:company` with citations.
- [x] **M4** — eval harness (golden set + LLM-as-judge) scoring the agent, running in CI (`12/12`).
- [x] **M5** — demo page + rate-limited endpoints + keyless Railway deploy config + [case study](docs/case-study.md).

## License

MIT — see [LICENSE](LICENSE).
