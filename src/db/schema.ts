import { pgTable, uuid, text, integer, timestamp, vector } from 'drizzle-orm/pg-core';

/** A source document for a target company (10-K, board minutes, news item). */
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  company: text('company').notNull(),
  sourceType: text('source_type').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** A retrievable chunk of a document, with its embedding (pgvector). */
export const chunks = pgTable('chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  ordinal: integer('ordinal').notNull(),
  content: text('content').notNull(),
  // OpenAI/text-embedding-3-small dimensionality; revisit at M2 with the chosen model.
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
