-- VM provisioning: dual jobs per environment, stages, PAT tokens, WG peer fields

ALTER TABLE "connection_wireguard_peers" ADD COLUMN IF NOT EXISTS "environment" TEXT NOT NULL DEFAULT 'sandbox';
ALTER TABLE "connection_wireguard_peers" ADD COLUMN IF NOT EXISTS "listen_port" INTEGER;

DROP INDEX IF EXISTS "provisioning_jobs_connection_id_key";

ALTER TABLE "provisioning_jobs" ADD COLUMN IF NOT EXISTS "environment" TEXT NOT NULL DEFAULT 'sandbox';
ALTER TABLE "provisioning_jobs" ADD COLUMN IF NOT EXISTS "stage" TEXT NOT NULL DEFAULT 'queued';
ALTER TABLE "provisioning_jobs" ADD COLUMN IF NOT EXISTS "orchestrator_vm_id" TEXT;
ALTER TABLE "provisioning_jobs" ADD COLUMN IF NOT EXISTS "progress_percent" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "provisioning_jobs_connection_id_environment_key"
  ON "provisioning_jobs"("connection_id", "environment");

CREATE INDEX IF NOT EXISTS "provisioning_jobs_status_stage_idx"
  ON "provisioning_jobs"("status", "stage");

CREATE TABLE IF NOT EXISTS "machine_api_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "token_prefix" VARCHAR(12) NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expires_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_api_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "machine_api_tokens_token_hash_key" ON "machine_api_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "machine_api_tokens_org_id_idx" ON "machine_api_tokens"("org_id");

ALTER TABLE "machine_api_tokens" ADD CONSTRAINT "machine_api_tokens_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
