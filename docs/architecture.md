# Architecture

## Data flow

```text
reviewed source registry
        │
        ▼
provider adapter ──► normalized batch ──► worker ──► PostgreSQL read model
                                                       │
                                      ┌────────────────┼───────────────┐
                                      ▼                ▼               ▼
                                     Web            REST API          MCP
```

Providers return normalized values and never write directly to the database. The worker owns
idempotent persistence and operational run metadata. API and MCP processes are read-only and cannot
cause an on-demand crawl.

## Trust boundary

Every source and normalized record has a `distributionScope`.

- `public`: eligible for a hosted read path after its access basis is accepted.
- `local-only`: visible only to explicitly local experimental processes.

Hosted Web, API, and Streamable HTTP MCP always run as `public-safe`. Repository query functions and
transport handlers must both enforce this scope so one missed check cannot leak local-only data.
The current database schema is a future read-model scaffold; no database repository or live worker
persistence is wired in this milestone. Child-row scope must be derived from the admitted source and
rechecked at query and transport boundaries rather than trusted as an independent authorization fact.

## Runtime units

- `apps/web`: a React + Vite shell. Product UI is intentionally deferred.
- `apps/api`: Fastify HTTP process with health and versioned read contracts.
- `apps/worker`: provider registry and future scheduled ingestion process.
- `apps/mcp`: one tool surface with independent stdio and Streamable HTTP entrypoints.

The stdio process writes diagnostics to stderr only because stdout is reserved for MCP messages.
