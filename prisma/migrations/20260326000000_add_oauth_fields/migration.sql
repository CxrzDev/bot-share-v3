-- AlterTable: add OAuth-related columns to accounts
ALTER TABLE "accounts" ADD COLUMN "platform_account_id" TEXT;
ALTER TABLE "accounts" ADD COLUMN "connected_via_oauth" BOOLEAN NOT NULL DEFAULT false;
