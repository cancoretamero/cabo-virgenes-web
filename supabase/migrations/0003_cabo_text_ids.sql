-- =====================================================================
-- CABO VÍRGENES — ids de entidad a TEXT (ids generados por el cliente del
-- admin encajan 1:1; el servidor sigue generando uuid::text por defecto).
-- =====================================================================
alter table cv_applications drop constraint if exists cv_applications_job_id_fkey;
alter table cv_journalists  drop constraint if exists cv_journalists_outlet_id_fkey;

do $$
declare t text;
begin
  foreach t in array array['cv_news','cv_team','cv_consultas','cv_subscribers','cv_jobs','cv_applications','cv_outlets','cv_journalists','cv_newsletters','cv_audit']
  loop
    execute format('alter table %I alter column id drop default', t);
    execute format('alter table %I alter column id type text using id::text', t);
    execute format('alter table %I alter column id set default gen_random_uuid()::text', t);
  end loop;
end $$;

alter table cv_applications alter column job_id   type text using job_id::text;
alter table cv_journalists  alter column outlet_id type text using outlet_id::text;

alter table cv_applications add constraint cv_applications_job_id_fkey
  foreign key (job_id) references cv_jobs(id) on delete set null;
alter table cv_journalists  add constraint cv_journalists_outlet_id_fkey
  foreign key (outlet_id) references cv_outlets(id) on delete set null;
