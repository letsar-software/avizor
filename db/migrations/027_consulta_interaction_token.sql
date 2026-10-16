-- Existing results remain readable; no write credential can be recovered from a public link.
alter table consultas add column interaction_token_hash text;
alter table consultas add constraint consultas_interaction_token_hash_check
  check (interaction_token_hash is null or interaction_token_hash ~ '^[a-f0-9]{64}$');
