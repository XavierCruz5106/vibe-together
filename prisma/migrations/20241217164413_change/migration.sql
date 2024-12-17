/*
  Warnings:

  - You are about to drop the column `user_id` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spotify_uri" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotify_access_token" TEXT NOT NULL,
    "spotify_refresh_token" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_User" ("created_at", "id", "spotify_access_token", "spotify_refresh_token", "spotify_uri", "updated_at") SELECT "created_at", "id", "spotify_access_token", "spotify_refresh_token", "spotify_uri", "updated_at" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_spotify_uri_key" ON "User"("spotify_uri");
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
