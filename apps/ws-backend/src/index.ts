import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import {
  FRONTEND_URL,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_SECRET,
  WS_PORT,
} from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const allowedOrigin = new URL(FRONTEND_URL).origin;
const wss = new WebSocketServer({
  port: WS_PORT,
  maxPayload: 1024 * 1024,
  verifyClient: (info: { origin: string }) =>
    !info.origin || info.origin === allowedOrigin,
});

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
  userName: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      !decoded.userId
    ) {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

function readRoomId(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const roomId = String(value);

  if (!/^[1-9]\d*$/.test(roomId)) {
    return null;
  }

  const numericRoomId = Number(roomId);

  if (!Number.isSafeInteger(numericRoomId)) {
    return null;
  }

  return { roomId, numericRoomId };
}

function sendError(ws: WebSocket, message: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "error", message }));
  }
}

function broadcastToRoom(
  roomId: string,
  message: unknown,
  excludeUserId?: string,
) {
  users.forEach((user) => {
    if (
      user.rooms.includes(roomId) &&
      user.userId !== excludeUserId &&
      user.ws.readyState === WebSocket.OPEN
    ) {
      user.ws.send(JSON.stringify(message));
    }
  });
}

wss.on("connection", async (ws, request) => {
  const requestUrl = new URL(request.url ?? "/", "ws://localhost");
  const token = requestUrl.searchParams.get("token") ?? "";
  const userId = checkUser(token);

  if (!userId) {
    ws.close(1008, "Unauthorized");
    return;
  }

  let userName = "Anonymous";
  try {
    const dbUser = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    if (dbUser?.name && dbUser.name.trim()) {
      userName = dbUser.name.trim();
    } else if (dbUser?.email) {
      userName = dbUser.email.split("@")[0];
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
  }

  const user: User = {
    userId,
    userName,
    rooms: [],
    ws,
  };

  users.push(user);
  ws.send(JSON.stringify({ type: "connected", userId }));

  ws.on("message", async (data) => {
    try {
      const parsedData = JSON.parse(data.toString()) as Record<string, unknown>;
      const currentUser = users.find((candidate) => candidate.ws === ws);

      if (!currentUser || typeof parsedData.type !== "string") {
        sendError(ws, "Invalid message format");
        return;
      }

      if (parsedData.type === "join_room") {
        const room = readRoomId(parsedData.roomId);

        if (!room) {
          sendError(ws, "Invalid room id");
          return;
        }

        const existingRoom = await prismaClient.room.findUnique({
          where: { id: room.numericRoomId },
          select: { id: true },
        });

        if (!existingRoom) {
          sendError(ws, "Room not found");
          return;
        }

        await prismaClient.roomMember.upsert({
          where: {
            roomId_userId: {
              roomId: room.numericRoomId,
              userId,
            },
          },
          update: {},
          create: {
            roomId: room.numericRoomId,
            userId,
          },
        });

        if (!currentUser.rooms.includes(room.roomId)) {
          currentUser.rooms.push(room.roomId);
          broadcastToRoom(
            room.roomId,
            { type: "user_joined", userId, userName: currentUser.userName, roomId: room.roomId },
            userId,
          );
        }

        const roomUsers = users
          .filter((u) => u.rooms.includes(room.roomId) && u.userId !== userId)
          .map((u) => ({ userId: u.userId, userName: u.userName }));

        ws.send(
          JSON.stringify({
            type: "room_joined",
            roomId: room.roomId,
            users: roomUsers,
          }),
        );
        return;
      }

      if (parsedData.type === "leave_room") {
        const room = readRoomId(parsedData.roomId);

        if (!room) {
          sendError(ws, "Invalid room id");
          return;
        }

        currentUser.rooms = currentUser.rooms.filter(
          (roomId) => roomId !== room.roomId,
        );
        broadcastToRoom(room.roomId, {
          type: "user_left",
          userId,
          userName: currentUser.userName,
          roomId: room.roomId,
        });
        return;
      }

      if (parsedData.type === "chat" || parsedData.type === "draw") {
        const room = readRoomId(parsedData.roomId);

        if (!room) {
          sendError(ws, "Invalid room id");
          return;
        }

        if (!currentUser.rooms.includes(room.roomId)) {
          sendError(ws, "Not in room");
          return;
        }

        if (
          typeof parsedData.message !== "string" &&
          (typeof parsedData.message !== "object" ||
            parsedData.message === null)
        ) {
          sendError(ws, "Invalid message");
          return;
        }

        const storedMessage =
          typeof parsedData.message === "string"
            ? parsedData.message
            : JSON.stringify(parsedData.message);

        await prismaClient.chat.create({
          data: {
            roomId: room.numericRoomId,
            message: storedMessage,
            userId,
          },
        });

        broadcastToRoom(
          room.roomId,
          {
            type: parsedData.type,
            message: parsedData.message,
            roomId: room.roomId,
            userId,
          },
          parsedData.type === "draw" ? userId : undefined,
        );
        return;
      }

      if (parsedData.type === "cursor_move") {
        const room = readRoomId(parsedData.roomId);

        if (
          !room ||
          !currentUser.rooms.includes(room.roomId) ||
          typeof parsedData.x !== "number" ||
          typeof parsedData.y !== "number"
        ) {
          sendError(ws, "Invalid cursor update");
          return;
        }

        broadcastToRoom(
          room.roomId,
          {
            type: "cursor_move",
            userId,
            x: parsedData.x,
            y: parsedData.y,
            roomId: room.roomId,
          },
          userId,
        );
        return;
      }

      sendError(ws, "Unknown message type");
    } catch (error) {
      console.error("WebSocket message error:", error);
      sendError(ws, "Unable to process message");
    }
  });

  ws.on("close", () => {
    user.rooms.forEach((roomId) => {
      broadcastToRoom(roomId, { type: "user_left", userId, userName: user.userName, roomId });
    });

    const index = users.findIndex((candidate) => candidate.ws === ws);

    if (index !== -1) {
      users.splice(index, 1);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

wss.on("listening", () => {
  console.log(`WebSocket Server running on port ${WS_PORT}`);
});

wss.on("error", (error) => {
  console.error("WebSocket server error:", error);
});
