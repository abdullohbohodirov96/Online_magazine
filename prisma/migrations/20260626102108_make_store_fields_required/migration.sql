/*
  Warnings:

  - Made the column `storeId` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `storeId` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `storeId` on table `ExternalProduct` required. This step will fail if there are existing NULL values in that column.
  - Made the column `storeId` on table `IntegrationSettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `storeId` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `storeId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `storeId` on table `TelegramSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ExternalProduct" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "IntegrationSettings" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TelegramSettings" ALTER COLUMN "storeId" SET NOT NULL;
