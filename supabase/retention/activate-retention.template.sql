BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Nilai diisi oleh scripts/setup-retention.ps1; jangan jalankan templat mentah ini.
DO $$
DECLARE
  v_endpoint TEXT := '__FIVORA_ENDPOINT__';
  v_token TEXT := '__FIVORA_TOKEN__';
  v_id UUID;
BEGIN
  IF v_endpoint LIKE '%__FIVORA_%' OR v_token LIKE '%__FIVORA_%' OR length(v_token) < 32 THEN
    RAISE EXCEPTION 'Jalankan scripts/setup-retention.ps1 terlebih dahulu.';
  END IF;
  IF to_regprocedure('public.fivora_retention_preview()') IS NULL THEN
    RAISE EXCEPTION 'Jalankan migration 20261010000002_three_month_data_retention.sql terlebih dahulu.';
  END IF;

  SELECT id INTO v_id FROM vault.secrets WHERE name = 'fivora_retention_endpoint';
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(v_endpoint, 'fivora_retention_endpoint');
  ELSE
    PERFORM vault.update_secret(v_id, v_endpoint);
  END IF;
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'fivora_retention_token';
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(v_token, 'fivora_retention_token');
  ELSE
    PERFORM vault.update_secret(v_id, v_token);
  END IF;
END;
$$;

-- Cron menyimpan nama fungsi saja. Token dibaca dari Vault saat pemanggilan.
CREATE OR REPLACE FUNCTION public.fivora_invoke_retention_cleanup()
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_endpoint TEXT;
  v_token TEXT;
  v_request BIGINT;
BEGIN
  IF NOT COALESCE((SELECT enabled FROM public.fivora_retention_settings WHERE singleton), FALSE) THEN
    RETURN NULL;
  END IF;
  SELECT decrypted_secret INTO v_endpoint FROM vault.decrypted_secrets
  WHERE name = 'fivora_retention_endpoint';
  SELECT decrypted_secret INTO v_token FROM vault.decrypted_secrets
  WHERE name = 'fivora_retention_token';
  IF v_endpoint IS NULL OR v_token IS NULL THEN
    RAISE EXCEPTION 'Konfigurasi retensi belum lengkap.';
  END IF;
  SELECT net.http_post(
    url := v_endpoint,
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-fivora-retention-token', v_token),
    body := '{"dry_run": false}'::JSONB,
    timeout_milliseconds := 60000
  ) INTO v_request;
  RETURN v_request;
END;
$$;
REVOKE ALL ON FUNCTION public.fivora_invoke_retention_cleanup()
FROM PUBLIC, anon, authenticated, service_role;

UPDATE public.fivora_retention_settings SET enabled = TRUE WHERE singleton;
SELECT cron.schedule('fivora-retention-cleanup', '*/5 * * * *',
  'SELECT public.fivora_invoke_retention_cleanup();');

COMMIT;

SELECT public.fivora_retention_preview() AS retention;
SELECT jobname, schedule, active FROM cron.job
WHERE jobname = 'fivora-retention-cleanup';
