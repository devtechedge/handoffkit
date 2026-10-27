import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local or the environment.");
  process.exit(1);
}

const sql = neon(url);

const statements = [
  `create schema if not exists handoffkit`,

  `create table if not exists handoffkit.accounts (
    id text primary key,
    email text not null unique,
    password_hash text not null,
    password_salt text not null,
    agency_name text not null default '',
    accent text not null default '#0b6f68',
    logo_url text,
    plan text not null default 'free',
    created_at timestamptz not null default now()
  )`,

  `create table if not exists handoffkit.sessions (
    id text primary key,
    token_hash text not null unique,
    account_id text not null references handoffkit.accounts(id) on delete cascade,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists handoffkit_sessions_account_idx
    on handoffkit.sessions (account_id, expires_at desc)`,

  `create table if not exists handoffkit.projects (
    id text primary key,
    account_id text not null references handoffkit.accounts(id) on delete cascade,
    client_name text not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists handoffkit_projects_account_idx
    on handoffkit.projects (account_id, created_at desc)`,

  `create table if not exists handoffkit.packs (
    id text primary key,
    account_id text not null references handoffkit.accounts(id) on delete cascade,
    project_id text references handoffkit.projects(id) on delete set null,
    public_id text not null unique,
    pack_name text not null,
    client_name text not null,
    agency_name text not null,
    source_format text not null default 'n8n',
    source_bytes integer not null default 0,
    pack_json jsonb not null,
    markdown text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create index if not exists handoffkit_packs_account_idx
    on handoffkit.packs (account_id, created_at desc)`,
  `create index if not exists handoffkit_packs_public_idx
    on handoffkit.packs (public_id)`,

  `create table if not exists handoffkit.subscriptions (
    account_id text primary key references handoffkit.accounts(id) on delete cascade,
    provider text not null default 'lemonsqueezy',
    customer_id text,
    subscription_id text,
    plan text not null default 'free',
    status text not null default 'none',
    current_period_end timestamptz,
    updated_at timestamptz not null default now()
  )`,

  `create table if not exists handoffkit.events (
    id text primary key,
    account_id text references handoffkit.accounts(id) on delete set null,
    type text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists handoffkit_events_type_idx
    on handoffkit.events (type, created_at desc)`,

  `create table if not exists handoffkit.leads (
    id text primary key,
    email text not null,
    source text not null default 'pricing',
    note text,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists handoffkit_leads_email_idx
    on handoffkit.leads (email, created_at desc)`,

  `create table if not exists handoffkit.feedback (
    id text primary key,
    account_id text references handoffkit.accounts(id) on delete set null,
    email text,
    message text not null,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists handoffkit.rate_limits (
    key text primary key,
    count integer not null default 0,
    reset_at timestamptz not null,
    updated_at timestamptz not null default now()
  )`,
];

try {
  for (const statement of statements) {
    await sql.query(statement);
  }
  const rows = await sql.query(
    `select table_name from information_schema.tables
     where table_schema = 'handoffkit' order by table_name`,
  );
  console.log("handoffkit schema ready:");
  for (const row of rows) console.log(`- ${row.table_name}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
