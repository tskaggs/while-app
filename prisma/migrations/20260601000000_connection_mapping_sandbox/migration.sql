-- AlterTable
ALTER TABLE "dashboard_connections" ADD COLUMN "provisioning_status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "org_sandbox_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "ehr_vendor" TEXT NOT NULL DEFAULT 'Other',
    "data_format" TEXT NOT NULL DEFAULT 'fhir',
    "resource_types" JSONB NOT NULL DEFAULT '["Patient"]',
    "suggested_fields_version" TEXT NOT NULL DEFAULT '1',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_sandbox_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_field_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "connection_id" TEXT NOT NULL,
    "source_path" TEXT NOT NULL,
    "target_fhir_path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_field_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_required_data" (
    "connection_id" TEXT NOT NULL,
    "org_id" UUID NOT NULL,
    "ehr_endpoint" TEXT,
    "ehr_vendor" TEXT,
    "custom_fields" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_required_data_pkey" PRIMARY KEY ("connection_id")
);

-- CreateTable
CREATE TABLE "connection_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "partner_name" TEXT NOT NULL,
    "ehr_vendor" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "target_go_live" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "resource_types" JSONB NOT NULL DEFAULT '[]',
    "data_format" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "estimated_volume" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "connection_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_wireguard_peers" (
    "connection_id" TEXT NOT NULL,
    "org_id" UUID NOT NULL,
    "public_key" TEXT NOT NULL,
    "private_key_ref" TEXT,
    "endpoint" TEXT,
    "allowed_ips" TEXT NOT NULL DEFAULT '10.8.0.0/24',
    "peer_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_wireguard_peers_pkey" PRIMARY KEY ("connection_id")
);

-- CreateTable
CREATE TABLE "provisioning_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "connection_id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "vm_id" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provisioning_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_sandbox_profiles_org_id_key" ON "org_sandbox_profiles"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "connection_field_mappings_connection_id_source_path_key" ON "connection_field_mappings"("connection_id", "source_path");

-- CreateIndex
CREATE INDEX "connection_field_mappings_org_id_connection_id_idx" ON "connection_field_mappings"("org_id", "connection_id");

-- CreateIndex
CREATE INDEX "connection_requests_org_id_status_idx" ON "connection_requests"("org_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "provisioning_jobs_connection_id_key" ON "provisioning_jobs"("connection_id");

-- CreateIndex
CREATE INDEX "provisioning_jobs_org_id_status_idx" ON "provisioning_jobs"("org_id", "status");

-- AddForeignKey
ALTER TABLE "org_sandbox_profiles" ADD CONSTRAINT "org_sandbox_profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_field_mappings" ADD CONSTRAINT "connection_field_mappings_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "dashboard_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_required_data" ADD CONSTRAINT "connection_required_data_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "dashboard_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_wireguard_peers" ADD CONSTRAINT "connection_wireguard_peers_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "dashboard_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisioning_jobs" ADD CONSTRAINT "provisioning_jobs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "dashboard_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed existing orgs with sandbox profiles and default mappings
INSERT INTO "org_sandbox_profiles" ("org_id", "ehr_vendor", "data_format", "resource_types")
SELECT o.id, COALESCE(dc.ehr_vendor, 'Other'), 'fhir', '["Patient","Encounter","Observation"]'::jsonb
FROM "organizations" o
LEFT JOIN "org_sandbox_profiles" osp ON osp.org_id = o.id
LEFT JOIN "dashboard_connections" dc ON dc.org_id = o.id AND dc.connection_type = 'system_sandbox'
WHERE osp.org_id IS NULL;

INSERT INTO "connection_field_mappings" ("org_id", "connection_id", "source_path", "target_fhir_path", "status", "is_required", "sort_order")
SELECT dc.org_id, dc.id, m.source_path, m.target_fhir_path, m.status, m.is_required, m.sort_order
FROM "dashboard_connections" dc
CROSS JOIN (
  VALUES
    ('PID-5 (Patient Name)', 'Patient.name', 'mapped', true, 1),
    ('PID-7 (Date of Birth)', 'Patient.birthDate', 'mapped', true, 2),
    ('PID-8 (Gender)', 'Patient.gender', 'mapped', true, 3),
    ('PID-3 (MRN)', 'Patient.identifier', 'mapped', true, 4),
    ('OBX-5 (Observation Value)', 'Observation.valueQuantity', 'review', false, 5),
    ('PV1-44 (Admit Date)', 'Encounter.period.start', 'mapped', false, 6)
) AS m(source_path, target_fhir_path, status, is_required, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM "connection_field_mappings" cfm WHERE cfm.connection_id = dc.id
);

UPDATE "dashboard_connections" SET "provisioning_status" = 'active' WHERE "provisioning_status" IS NULL OR "provisioning_status" = '';
