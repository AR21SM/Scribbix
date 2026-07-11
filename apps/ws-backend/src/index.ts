import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

interface DrawMessage {
  type: "draw" | "shape";
  roomId: string;
  shape: any;
  userId: string;
}

interface ChatMessage {
  type: "chat";
  roomId: string;
  message: string;
}

const users: User[] = [];

async function checkUser(token: string): Promise<string | null> {
  try {
    // Find or create default test user to satisfy foreign key relations
    let defaultUser = await prismaClient.user.findUnique({
      where: { email: "testuser@example.com" },
    });

    if (!defaultUser) {
      defaultUser = await prismaClient.user.create({
        data: {
          id: "test-user-id",
          email: "testuser@example.com",
          password: "password123",
          name: "Test User",
        },
      });
    }

    return defaultUser.id;
  } catch (e) {
    console.error("Database connection / user creation error in ws:", e);
    return null;
  }
}

function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
  users.forEach((user) => {
    if (user.rooms.includes(roomId) && user.userId !== excludeUserId) {
      try {
        user.ws.send(JSON.stringify(message));
      } catch (e) {
        console.error("Error broadcasting to user:", e);
      }
    }
  });
}

wss.on("connection", async function connection(ws, request) {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = await checkUser(token);

  if (!userId) {
    ws.close(1008, "Unauthorized");
    return;
  }

  console.log(`User ${userId} connected`);

  const user: User = {
    userId,
    rooms: [],
    ws,
  };

  users.push(user);

  // Send connection confirmation
  ws.send(
    JSON.stringify({
      type: "connected",
      userId,
    }),
  );

  ws.on("message", async function message(data) {
    try {
      let parsedData;
      if (typeof data !== "string") {
        parsedData = JSON.parse(data.toString());
      } else {
        parsedData = JSON.parse(data);
      }

      const currentUser = users.find((x) => x.ws === ws);
      if (!currentUser) {
        return;
      }

      switch (parsedData.type) {
        case "join_room": {
          const roomId = parsedData.roomId;
          if (!currentUser.rooms.includes(roomId)) {
            currentUser.rooms.push(roomId);
            console.log(`User ${userId} joined room ${roomId}`);

            // Notify others in the room
            broadcastToRoom(
              roomId,
              {
                type: "user_joined",
                userId,
                roomId,
              },
              userId,
            );

            // Send confirmation
            ws.send(
              JSON.stringify({
                type: "room_joined",
                roomId,
              }),
            );
          }
          break;
        }

        case "leave_room": {
          const roomId = parsedData.roomId;
          currentUser.rooms = currentUser.rooms.filter((x) => x !== roomId);
          console.log(`User ${userId} left room ${roomId}`);

          // Notify others in the room
          broadcastToRoom(roomId, {
            type: "user_left",
            userId,
            roomId,
          });
          break;
        }

        case "chat":
        case "draw": {
          const roomId = parsedData.roomId;
          const message = parsedData.message;

          if (!currentUser.rooms.includes(roomId)) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Not in room",
              }),
            );
            return;
          }

          // Save to database
          await prismaClient.chat.create({
            data: {
              roomId: parseInt(roomId),
              message:
                typeof message === "string" ? message : JSON.stringify(message),
              userId,
            },
          });

          // Broadcast to room (excluding sender for draw operations)
          broadcastToRoom(
            roomId,
            {
              type: parsedData.type,
              message: message,
              roomId,
              userId,
            },
            parsedData.type === "draw" ? userId : undefined,
          );

          break;
        }

        case "cursor_move": {
          const roomId = parsedData.roomId;
          if (currentUser.rooms.includes(roomId)) {
            broadcastToRoom(
              roomId,
              {
                type: "cursor_move",
                userId,
                x: parsedData.x,
                y: parsedData.y,
                roomId,
              },
              userId,
            );
          }
          break;
        }

        default:
          console.log("Unknown message type:", parsedData.type);
      }
    } catch (e) {
      console.error("Message handling error:", e);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log(`User ${userId} disconnected`);

    // Notify all rooms the user was in
    user.rooms.forEach((roomId) => {
      broadcastToRoom(roomId, {
        type: "user_left",
        userId,
        roomId,
      });
    });

    // Remove user from users array
    const index = users.findIndex((u) => u.ws === ws);
    if (index !== -1) {
      users.splice(index, 1);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("🚀 WebSocket Server running on port 8080");
