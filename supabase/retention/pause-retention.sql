-- Menghentikan penghapusan berikutnya; tidak memulihkan data yang telah dihapus.
BEGIN;
UPDATE public.fivora_retention_settings SET enabled = FALSE WHERE singleton;
SELECT cron.unschedule(jobid)
FROM cron.job WHERE jobname = 'fivora-retention-cleanup';
COMMIT;
