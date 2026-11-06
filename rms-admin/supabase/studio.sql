-- The combined studio_documents blob has been replaced by the tables in records.sql.
drop table if exists public.studio_documents;

notify pgrst, 'reload schema';
