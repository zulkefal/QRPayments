-- CreateTable
CREATE TABLE "ShopSettings" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "iban" TEXT NOT NULL,
    "accountTitle" TEXT NOT NULL,
    "bankName" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);
