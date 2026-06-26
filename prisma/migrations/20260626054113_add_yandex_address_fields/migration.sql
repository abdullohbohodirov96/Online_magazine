-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "addressComment" TEXT,
ADD COLUMN     "deliveryApartment" TEXT,
ADD COLUMN     "deliveryEntrance" TEXT,
ADD COLUMN     "deliveryFloor" TEXT,
ADD COLUMN     "deliveryIntercom" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "yandexAddress" TEXT;
