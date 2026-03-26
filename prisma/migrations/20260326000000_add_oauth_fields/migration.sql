-- AlterTable: add OAuth-related columns to accounts (idempotent)
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "platform_account_id" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "connected_via_oauth" BOOLEAN NOT NULL DEFAULT false;
