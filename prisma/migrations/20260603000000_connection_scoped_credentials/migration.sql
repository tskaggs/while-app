-- Per-connection sandbox API keys and pending credential fields

ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "connection_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_connection_id_fkey'
  ) THEN
    ALTER TABLE "api_keys"
      ADD CONSTRAINT "api_keys_connection_id_fkey"
      FOREIGN KEY ("connection_id") REFERENCES "dashboard_connections"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "api_keys_org_id_connection_id_environment_idx"
  ON "api_keys" ("org_id", "connection_id", "environment");

ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "pending_sandbox_key" TEXT;
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "pending_webhook_secret" TEXT;

-- Bind existing org-level sandbox keys to the system sandbox connection
UPDATE "api_keys" ak
SET "connection_id" = dc.id
FROM "dashboard_connections" dc
WHERE ak."connection_id" IS NULL
  AND ak."environment" = 'sandbox'
  AND ak."is_active" = true
  AND dc."org_id" = ak."org_id"
  AND dc."connection_type" = 'system_sandbox';
