CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoomMember_roomId_userId_key" ON "RoomMember"("roomId", "userId");
CREATE INDEX "RoomMember_userId_idx" ON "RoomMember"("userId");

ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "RoomMember" ("id", "roomId", "userId")
SELECT md5("Room"."id"::text || ':' || "Room"."adminId"), "Room"."id", "Room"."adminId"
FROM "Room"
ON CONFLICT ("roomId", "userId") DO NOTHING;

INSERT INTO "RoomMember" ("id", "roomId", "userId")
SELECT md5("Chat"."roomId"::text || ':' || "Chat"."userId"), "Chat"."roomId", "Chat"."userId"
FROM "Chat"
GROUP BY "Chat"."roomId", "Chat"."userId"
ON CONFLICT ("roomId", "userId") DO NOTHING;
