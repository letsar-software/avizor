create table if not exists rate_limit_buckets (
  scope text not null,
  identity_hash text not null,
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null,
  primary key (scope, identity_hash, window_start)
);

create index if not exists rate_limit_buckets_expires_idx on rate_limit_buckets (expires_at);

comment on table rate_limit_buckets is 'Contadores distribuidos de rate limiting; identity_hash nunca almacena IP o email en claro.';
