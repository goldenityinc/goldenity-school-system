-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "tenantSlug" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT;

-- CreateTable
CREATE TABLE "TenantBranding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantBranding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantBranding_tenantId_key" ON "TenantBranding"("tenantId");
CREATE INDEX "TenantBranding_tenantId_idx" ON "TenantBranding"("tenantId");
CREATE INDEX "User_tenantSlug_idx" ON "User"("tenantSlug");

-- UpdatedAt trigger for TenantBranding
DROP TRIGGER IF EXISTS "trg_tenantbranding_set_updated_at" ON "TenantBranding";
CREATE TRIGGER "trg_tenantbranding_set_updated_at"
BEFORE UPDATE ON "TenantBranding"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();