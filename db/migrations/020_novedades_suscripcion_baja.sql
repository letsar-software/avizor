-- WEB-D-015: a withdrawal is kept only as a short-lived suppression record.
create index if not exists interesados_suscripcion_activa_idx
  on interesados (ultima_interaccion_en)
  where consentimiento = true and baja_en is null;
create index if not exists interesados_baja_en_idx
  on interesados (baja_en)
  where baja_en is not null;
