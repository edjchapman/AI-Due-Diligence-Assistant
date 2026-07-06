/**
 * Ingest CLI (implemented in M2). Walking-skeleton stub so the command wiring
 * exists: it will land reference-company documents into Postgres/pgvector and
 * write embeddings. For now it prints intent.
 */
const companies = process.argv.slice(2);

console.log(
  companies.length > 0
    ? `[ingest] would ingest: ${companies.join(', ')} (implemented in M2)`
    : '[ingest] usage: npm run ingest -- <company> [company...] (implemented in M2)',
);
