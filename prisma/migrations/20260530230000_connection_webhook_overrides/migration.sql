ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "webhook_url" TEXT;
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "webhook_secret" TEXT;
