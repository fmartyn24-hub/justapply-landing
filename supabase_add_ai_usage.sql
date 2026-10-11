-- One row per AI call made on a free allowance (e.g. the free CV import),
-- used to enforce per-user limits and to see what the free tier costs.
-- Applied to production on 2026-10-11.
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_feature_idx on public.ai_usage (user_id, feature);

-- Written and read only by API routes using the service role key.
alter table public.ai_usage enable row level security;
