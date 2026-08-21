-- CreateEnum
CREATE TYPE "MfsProvider" AS ENUM ('BKASH', 'NAGAD', 'ROCKET');

-- CreateEnum
CREATE TYPE "MfsPaymentStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "MfsAccount" (
    "id" TEXT NOT NULL,
    "provider" "MfsProvider" NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfsAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfsPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "MfsProvider" NOT NULL,
    "senderNumber" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "status" "MfsPaymentStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfsPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MfsAccount_provider_idx" ON "MfsAccount"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "MfsPayment_orderId_key" ON "MfsPayment"("orderId");

-- CreateIndex
CREATE INDEX "MfsPayment_orderId_idx" ON "MfsPayment"("orderId");

-- CreateIndex
CREATE INDEX "MfsPayment_status_idx" ON "MfsPayment"("status");

-- AddForeignKey
ALTER TABLE "MfsPayment" ADD CONSTRAINT "MfsPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
