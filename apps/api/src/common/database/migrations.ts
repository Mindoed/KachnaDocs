/**
 * Database migrations, embedded rather than kept as loose .sql files: the API
 * runs them itself at boot (DatabaseService), and the paths survive every
 * packaging layout — a repo-root `db/` directory is not inside the API image's
 * WORKDIR assumptions, and a run-time path to source files is exactly the kind
 * of thing that only breaks in production.
 *
 * Applied in array order, each exactly once, tracked in `schema_migrations`.
 * Never edit an applied migration — append a new one; the table is keyed by
 * name and old entries are never re-run.
 */
export interface Migration {
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    name: '0001_documents_and_collaboration',
    sql: /* sql */ `
      -- Application identity is a Discord snowflake (text, not uuid — Discord
      -- ids exceed int64 display conventions and are only ever compared as
      -- strings). gen_random_uuid() ships in core Postgres since 13.
      CREATE TABLE IF NOT EXISTS documents (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title       text NOT NULL DEFAULT 'Untitled',
        created_by  text NOT NULL,
        created_at  timestamptz NOT NULL DEFAULT now()
      );

      -- Document-level ACL. One row per principal; owner ⊃ editor ⊃ viewer.
      -- principal_type is here so guild-wide or workspace-wide principals can
      -- be added later without reshuffling the key.
      CREATE TABLE IF NOT EXISTS document_permissions (
        document_id    uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        principal_id   text NOT NULL,
        principal_type text NOT NULL DEFAULT 'user'
                       CHECK (principal_type IN ('user')),
        permission     text NOT NULL
                       CHECK (permission IN ('viewer', 'editor', 'owner')),
        PRIMARY KEY (document_id, principal_type, principal_id)
      );

      CREATE INDEX IF NOT EXISTS document_permissions_principal_idx
        ON document_permissions (principal_type, principal_id);

      -- The live collaborative state of each document, as an encoded Yjs
      -- update (binary — JSON round-trips destroy CRDT identity, see the
      -- Hocuspocus database-extension docs). Written by apps/collab, read by
      -- apps/collab; the API only touches it for lifecycle (delete cascades).
      CREATE TABLE IF NOT EXISTS document_states (
        document_id uuid PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
        yjs_state   bytea,
        updated_at  timestamptz NOT NULL DEFAULT now()
      );
    `,
  },
];
