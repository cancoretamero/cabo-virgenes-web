-- =====================================================================
-- CABO VÍRGENES — columnas `status` de enum a TEXT.
-- El admin usa vocabularios de estado libres (p.ej. boletín 'archived') que no
-- encajaban en los enums. TEXT acepta cualquier valor; las RLS comparan con
-- literales string igual ('published'/'open'). Hay que dropear/recrear las
-- políticas que dependen de la columna status antes de alterar el tipo.
-- =====================================================================
drop policy if exists cv_news_public_read on cv_news;
drop policy if exists cv_jobs_public_read on cv_jobs;

alter table cv_news         alter column status drop default;
alter table cv_news         alter column status type text using status::text;
alter table cv_news         alter column status set default 'draft';

alter table cv_jobs         alter column status drop default;
alter table cv_jobs         alter column status type text using status::text;
alter table cv_jobs         alter column status set default 'open';

alter table cv_applications alter column status drop default;
alter table cv_applications alter column status type text using status::text;
alter table cv_applications alter column status set default 'new';

alter table cv_newsletters  alter column status drop default;
alter table cv_newsletters  alter column status type text using status::text;
alter table cv_newsletters  alter column status set default 'draft';

create policy cv_news_public_read on cv_news for select
  to anon using (status = 'published');
create policy cv_jobs_public_read on cv_jobs for select
  to anon using (status = 'open');
