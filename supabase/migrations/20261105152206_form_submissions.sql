-- Append-only visitor intake. Actual responses never belong in Git.
create table public.form_submissions (
  id uuid primary key,
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text not null check (char_length(phone) <= 40 and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15),
  email text check (email is null or (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  instagram_handle text check (char_length(instagram_handle) <= 100),
  linkedin_profile text check (char_length(linkedin_profile) <= 500),
  real_estate_goals text check (char_length(real_estate_goals) <= 5000),
  contact_preference text check (contact_preference in ('Call','Text','Email','Instagram DM','LinkedIn message')),
  skool_interest text check (skool_interest in ('Yes','Maybe, tell me more','Not right now')),
  community_must_have text check (char_length(community_must_have) <= 5000),
  ricky_feedback text check (char_length(ricky_feedback) <= 5000),
  event_code text not null check (event_code in ('unattributed','northeastern-2026-11-05')),
  page_path text not null check (page_path = '/volnayacademy/'),
  analytics_consent boolean not null,
  advertising_consent boolean not null,
  consent_version text not null check (consent_version = '1'),
  is_test boolean generated always as (
    position('test-lead' in lower(full_name)) > 0 or lower(coalesce(email,'')) like '%@example.com'
  ) stored
);
alter table public.form_submissions enable row level security;
revoke all on public.form_submissions from public, anon, authenticated;
grant insert (id, full_name, phone, email, instagram_handle, linkedin_profile,
  real_estate_goals, contact_preference, skool_interest, community_must_have,
  ricky_feedback, event_code, page_path, analytics_consent, advertising_consent,
  consent_version) on public.form_submissions to anon;
grant select, insert, update, delete on public.form_submissions to service_role;
create policy "Visitors can append bounded form submissions"
  on public.form_submissions for insert to anon
  with check (created_at between now() - interval '1 minute' and now() + interval '1 minute');
comment on table public.form_submissions is 'Private Volnay Academy questionnaire responses. Public API is INSERT-only; no public read/update/delete. Exclude is_test=true from prospect totals.';
comment on column public.form_submissions.id is 'Browser-generated idempotency UUID. Retry unchanged payload with the same UUID.';
comment on column public.form_submissions.full_name is 'Name — Google Forms entry.174957854';
comment on column public.form_submissions.phone is 'Phone number — Google Forms entry.1983000286';
comment on column public.form_submissions.email is 'Email (optional) — Google Forms entry.491185921';
comment on column public.form_submissions.instagram_handle is 'Instagram handle (optional) — Google Forms entry.709092237';
comment on column public.form_submissions.linkedin_profile is 'LinkedIn (optional) — Google Forms entry.1380447704';
comment on column public.form_submissions.real_estate_goals is 'What are your goals in real estate? — Google Forms entry.21922786';
comment on column public.form_submissions.contact_preference is 'Best way to reach you — Google Forms entry.686903170';
comment on column public.form_submissions.skool_interest is 'Are you interested in joining the Volnay Academy community on Skool? — Google Forms entry.2120816330';
comment on column public.form_submissions.community_must_have is 'What would make it something you had to be a part of? — Google Forms entry.922802930';
comment on column public.form_submissions.ricky_feedback is 'Any feedback for Ricky on today’s talk? — Google Forms entry.549558920';
