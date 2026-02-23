-- AlterTable: Add user profile fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "website" TEXT;
