-- Jalankan di Supabase SQL Editor setelah aktivasi dan satu jadwal berlalu.
SELECT public.fivora_retention_preview() AS retention;

SELECT jobname, schedule, active
FROM cron.job WHERE jobname = 'fivora-retention-cleanup';

SELECT run.start_time, run.end_time, run.status, run.return_message
FROM cron.job_run_details AS run
JOIN cron.job AS job ON job.jobid = run.jobid
WHERE job.jobname = 'fivora-retention-cleanup'
ORDER BY run.start_time DESC LIMIT 5;

-- Status cron sukses berarti request terkirim. Hasil HTTP memeriksa worker-nya.
SELECT id, status_code, timed_out, error_msg, content, created
FROM net._http_response
WHERE content LIKE '%reports_deleted%' OR content LIKE '%Cleanup failed%'
  OR content LIKE '%Retention has not been activated%'
ORDER BY created DESC LIMIT 5;
