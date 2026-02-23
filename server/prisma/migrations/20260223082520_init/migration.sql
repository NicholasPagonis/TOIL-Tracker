-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "locationLabel" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Break" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME NOT NULL,
    CONSTRAINT "Break_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "standardDailyMinutes" INTEGER NOT NULL DEFAULT 456,
    "roundingRule" TEXT NOT NULL DEFAULT 'NONE',
    "overtimeStartsAfterMinutes" INTEGER,
    "allowNegativeTil" BOOLEAN NOT NULL DEFAULT false,
    "workLocationGeofenceName" TEXT,
    "reportRecipientEmails" TEXT NOT NULL DEFAULT '[]',
    "reportSubjectTemplate" TEXT NOT NULL DEFAULT 'TOIL Report {from} to {to}',
    "reportFooter" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
