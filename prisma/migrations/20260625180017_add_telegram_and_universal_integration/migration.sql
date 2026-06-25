-- AlterTable
ALTER TABLE "IntegrationSettings" ADD COLUMN     "authType" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "fieldMapping" JSONB,
ADD COLUMN     "isConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastConnectionCheckAt" TIMESTAMP(3),
ADD COLUMN     "ordersEndpoint" TEXT,
ADD COLUMN     "priceFieldMapping" JSONB,
ADD COLUMN     "productsEndpoint" TEXT,
ADD COLUMN     "providerName" TEXT,
ADD COLUMN     "providerType" TEXT NOT NULL DEFAULT 'manual_json',
ADD COLUMN     "requestMethod" TEXT NOT NULL DEFAULT 'GET',
ADD COLUMN     "stockFieldMapping" JSONB,
ADD COLUMN     "syncErrorMessage" TEXT,
ADD COLUMN     "syncStatus" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'web',
ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramUserId" TEXT;

-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "authDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSettings" (
    "id" TEXT NOT NULL,
    "botToken" TEXT,
    "adminChatId" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "botUsername" TEXT,
    "miniAppUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_userId_key" ON "TelegramUser"("userId");

-- AddForeignKey
ALTER TABLE "TelegramUser" ADD CONSTRAINT "TelegramUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
