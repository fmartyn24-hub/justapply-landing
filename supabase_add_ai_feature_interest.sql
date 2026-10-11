-- "Would you use this?" answers collected from locked AI features while AI is
-- in beta. One row per answer (a user can add a comment later as a new row).
create table if not exists public.ai_feature_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('import', 'match_analysis', 'cover_letter', 'cv_advice')),
  answer text not null check (answer in ('yes', 'maybe', 'no')),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists ai_feature_interest_feature_idx on public.ai_feature_interest (feature);

-- Written only by the API route with the service role key; no client access.
alter table public.ai_feature_interest enable row level security;

-- Handy summary: select * from ai_feature_interest_summary;
create or replace view public.ai_feature_interest_summary
with (security_invoker = true) as
select
  feature,
  count(distinct user_id) filter (where answer = 'yes') as yes_users,
  count(distinct user_id) filter (where answer = 'maybe') as maybe_users,
  count(distinct user_id) filter (where answer = 'no') as no_users,
  count(*) filter (where comment is not null) as comments
from public.ai_feature_interest
group by feature;
