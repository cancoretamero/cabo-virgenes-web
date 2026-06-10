-- =====================================================================
-- CABO VÍRGENES — columna `extra jsonb` en las entidades de array.
-- Preserva sin pérdida cualquier campo del admin que no tenga columna propia
-- (p.ej. consultas.status/resolution, boletines.intro/template/items).
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['cv_news','cv_team','cv_consultas','cv_subscribers','cv_jobs','cv_applications','cv_outlets','cv_journalists','cv_newsletters']
  loop
    execute format('alter table %I add column if not exists extra jsonb not null default ''{}''::jsonb', t);
  end loop;
end $$;
