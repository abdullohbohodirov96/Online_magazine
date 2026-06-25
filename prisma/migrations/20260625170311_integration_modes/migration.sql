-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "externalProductId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "syncPrice" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "syncStock" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "IntegrationSettings" (
    "id" TEXT NOT NULL,
    "integrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "integrationMode" TEXT NOT NULL DEFAULT 'disabled',
    "integrationApiUrl" TEXT,
    "integrationApiKey" TEXT,
    "autoUpdatePrices" BOOLEAN NOT NULL DEFAULT true,
    "autoUpdateStock" BOOLEAN NOT NULL DEFAULT true,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 5,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalProduct" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "nomenclatureCode" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "categoryName" TEXT,
    "rawData" JSONB,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalProduct_barcode_key" ON "ExternalProduct"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalProduct_nomenclatureCode_key" ON "ExternalProduct"("nomenclatureCode");
