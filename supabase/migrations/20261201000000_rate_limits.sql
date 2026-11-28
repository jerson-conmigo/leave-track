-- TASK-025 (first slice of TASK-041, ARCH D16): rate-limit counters in Postgres, so a limit
-- holds across every server instance. Generic on purpose: TASK-041 adds limits for submit and
-- decisions on this same table and store (lib/rate-limit/).
--
-- One row per (key, 1-minute bucket). A limiter sums the buckets inside its window, which
-- approximates a sliding window without a burst at window edges. Keys never contain personal
-- data: callers HMAC the email / IP first (lib/auth/sign-in-throttle.ts).
-- Rows are counters, not records: old buckets are pruned by the store (not the
-- never-delete rule, which covers leave_requests and audit_log).

create table public.rate_limits (
  key    text        not null,
  bucket timestamptz not null,
  count  integer     not null default 1,
  constraint rate_limits_pkey primary key (key, bucket),
  constraint rate_limits_count_positive check (count > 0),
  constraint rate_limits_key_length check (char_length(key) between 1 and 200)
);

create index rate_limits_bucket_idx on public.rate_limits (bucket);

-- Server-only table: RLS on, no policies (the app connects as the table owner).
alter table public.rate_limits enable row level security;
