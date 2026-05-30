-- Dashboard connection runtime fields
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "sidecar_id" TEXT;
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "tunnel_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "wireguard_public_key" TEXT;
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "ehr_endpoint" TEXT;
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "ehr_vendor" TEXT;
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "last_sync_at" TIMESTAMPTZ;
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT 'control-plane';
ALTER TABLE "dashboard_connections" ADD COLUMN IF NOT EXISTS "messages_processed_24h" INTEGER NOT NULL DEFAULT 0;

-- Telemetry tables
CREATE TABLE IF NOT EXISTS "processed_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "connection_id" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "direction" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "message_type" TEXT NOT NULL,
    "resource_type" TEXT,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "correlation_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "processed_messages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "processed_messages_org_id_environment_timestamp_idx" ON "processed_messages"("org_id", "environment", "timestamp");
CREATE INDEX IF NOT EXISTS "processed_messages_org_id_connection_id_timestamp_idx" ON "processed_messages"("org_id", "connection_id", "timestamp");

CREATE TABLE IF NOT EXISTS "integration_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "connection_id" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "anonymized_message" TEXT NOT NULL,
    "resource_type" TEXT,
    "event_type" TEXT,
    "hl7_message_type" TEXT,
    "correlation_id" TEXT,
    "duration_ms" INTEGER,
    "status_code" INTEGER,
    "actor" TEXT,
    "ip_address" TEXT,
    "source" TEXT,
    "details" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "integration_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "integration_logs_org_id_environment_timestamp_idx" ON "integration_logs"("org_id", "environment", "timestamp");
CREATE INDEX IF NOT EXISTS "integration_logs_org_id_category_timestamp_idx" ON "integration_logs"("org_id", "category", "timestamp");

CREATE TABLE IF NOT EXISTS "tunnel_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "connection_id" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "severity" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "incident_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tunnel_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tunnel_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "tunnel_logs_org_id_environment_timestamp_idx" ON "tunnel_logs"("org_id", "environment", "timestamp");
CREATE INDEX IF NOT EXISTS "tunnel_logs_org_id_connection_id_timestamp_idx" ON "tunnel_logs"("org_id", "connection_id", "timestamp");

CREATE TABLE IF NOT EXISTS "tunnel_incidents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "connection_id" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL,
    "resolved_at" TIMESTAMPTZ,
    "related_log_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tunnel_incidents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tunnel_incidents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "tunnel_incidents_org_id_environment_idx" ON "tunnel_incidents"("org_id", "environment");

CREATE TABLE IF NOT EXISTS "daily_metric_rollups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "connection_id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "fhir_resources" INTEGER NOT NULL DEFAULT 0,
    "uptime_pct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "tunnel_events" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_metric_rollups_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "daily_metric_rollups_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_metric_rollups_org_id_connection_id_environment_date_key" ON "daily_metric_rollups"("org_id", "connection_id", "environment", "date");
CREATE INDEX IF NOT EXISTS "daily_metric_rollups_org_id_environment_date_idx" ON "daily_metric_rollups"("org_id", "environment", "date");
