import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  FRONTEND_URL,
  HTTP_PORT,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_SECRET,
} from "@repo/backend-common/config";
import { registerOAuthRoutes } from "./oauth";
import { middleware } from "./middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";

const app = express();

function createAccessToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

function parseRoomId(value: string | undefined) {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const roomId = Number(value);
  return Number.isSafeInteger(roomId) ? roomId : null;
}

// Security middleware
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit auth requests to 5 per 15 minutes
  message: "Too many authentication attempts, please try again later.",
});

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many social sign-in attempts, please try again later.",
});

app.use("/api", limiter);
registerOAuthRoutes(app, oauthLimiter, createAccessToken);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/ready", async (req, res) => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    res.json({ status: "ready", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Readiness check error:", error);
    res.status(503).json({
      status: "unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});

// Signup endpoint with password hashing
app.post("/api/signup", authLimiter, async (req, res) => {
  try {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({
        message: "Invalid input data",
        errors: parsedData.error.errors,
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(parsedData.data.password, 12);
    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data.username,
        password: hashedPassword,
        name: parsedData.data.name,
      },
    });
    const token = createAccessToken(user.id);

    res.status(201).json({
      userId: user.id,
      token,
      name: user.name,
      email: user.email,
      message: "User created successfully",
    });
  } catch (e: any) {
    console.error("Signup error:", e);
    if (e?.code === "P2002") {
      res.status(409).json({
        message: "User already exists with this email",
      });
      return;
    }
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Signin endpoint with password verification
app.post("/api/signin", authLimiter, async (req, res) => {
  try {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({
        message: "Invalid input data",
        errors: parsedData.error.errors,
      });
      return;
    }

    const user = await prismaClient.user.findUnique({
      where: { email: parsedData.data.username },
    });

    if (!user?.password) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      parsedData.data.password,
      user.password,
    );

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = createAccessToken(user.id);

    res.json({
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (e) {
    console.error("Signin error:", e);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Create room endpoint
app.post("/api/room", middleware, async (req, res) => {
  try {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({
        message: "Invalid input data",
        errors: parsedData.error.errors,
      });
      return;
    }

    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId,
        members: {
          create: { userId },
        },
      },
    });

    res.status(201).json({
      roomId: room.id,
      slug: room.slug,
    });
  } catch (e: any) {
    console.error("Room creation error:", e);
    if (e.code === "P2002") {
      res.status(409).json({
        message: "Room already exists with this name",
      });
      return;
    }
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/api/room/:roomId/join", middleware, async (req, res) => {
  try {
    const roomId = parseRoomId(req.params.roomId);
    const userId = req.userId;

    if (!roomId || !userId) {
      res.status(400).json({ message: "A valid room and user are required" });
      return;
    }

    const room = await prismaClient.room.findUnique({
      where: { id: roomId },
      select: { id: true, slug: true, adminId: true },
    });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    await prismaClient.roomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: {},
      create: { roomId, userId },
    });

    res.json({
      roomId: room.id,
      slug: room.slug,
      ownership: room.adminId === userId ? "owned" : "shared",
    });
  } catch (error) {
    console.error("Room join error:", error);
    res.status(500).json({ message: "Unable to join room" });
  }
});

app.patch("/api/room/:roomId", middleware, async (req, res) => {
  try {
    const roomId = parseRoomId(req.params.roomId);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    if (!roomId || name.length < 1 || name.length > 80) {
      res
        .status(400)
        .json({ message: "Canvas name must be between 1 and 80 characters" });
      return;
    }

    const room = await prismaClient.room.findUnique({
      where: { id: roomId },
      select: { adminId: true },
    });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    if (room.adminId !== req.userId) {
      res.status(403).json({ message: "Only the canvas owner can rename it" });
      return;
    }

    const updated = await prismaClient.room.update({
      where: { id: roomId },
      data: { slug: name },
      select: { id: true, slug: true },
    });

    res.json({ roomId: updated.id, slug: updated.slug });
  } catch (error: any) {
    if (error?.code === "P2002") {
      res
        .status(409)
        .json({ message: "A canvas with this name already exists" });
      return;
    }
    console.error("Room rename error:", error);
    res.status(500).json({ message: "Unable to rename canvas" });
  }
});

app.delete("/api/room/:roomId", middleware, async (req, res) => {
  try {
    const roomId = parseRoomId(req.params.roomId);

    if (!roomId) {
      res.status(400).json({ message: "Room ID must be a positive integer" });
      return;
    }

    const room = await prismaClient.room.findUnique({
      where: { id: roomId },
      select: { adminId: true },
    });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    if (room.adminId !== req.userId) {
      res.status(403).json({ message: "Only the canvas owner can delete it" });
      return;
    }

    await prismaClient.$transaction([
      prismaClient.chat.deleteMany({ where: { roomId } }),
      prismaClient.roomMember.deleteMany({ where: { roomId } }),
      prismaClient.room.delete({ where: { id: roomId } }),
    ]);

    res.status(204).send();
  } catch (error) {
    console.error("Room deletion error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get room shapes/data
app.get("/api/room/:roomId/shapes", middleware, async (req, res) => {
  try {
    const roomId = parseRoomId(req.params.roomId);

    if (!roomId) {
      res.status(400).json({ message: "Room ID must be a positive integer" });
      return;
    }

    const room = await prismaClient.room.findFirst({
      where: {
        id: roomId,
        OR: [
          { adminId: req.userId },
          { members: { some: { userId: req.userId } } },
        ],
      },
      select: { id: true },
    });

    if (!room) {
      res.status(404).json({
        message: "Room not found",
      });
      return;
    }

    const messages = await prismaClient.chat.findMany({
      where: {
        roomId,
      },
      orderBy: {
        id: "asc",
      },
      take: 5000, // Limit to prevent memory issues
    });

    const shapesById = new Map<string, Record<string, unknown>>();

    for (const message of messages) {
      try {
        const data = JSON.parse(message.message) as {
          action?: string;
          shapeId?: string;
          locked?: boolean;
          shape?: Record<string, unknown>;
        };

        if (data.action === "delete" && data.shapeId) {
          shapesById.delete(data.shapeId);
          continue;
        }

        if (data.action === "lock" && data.shapeId) {
          const shape = shapesById.get(data.shapeId);
          if (shape) {
            shapesById.set(data.shapeId, {
              ...shape,
              locked: Boolean(data.locked),
            });
          }
          continue;
        }

        if (data.action === "update" && data.shapeId && data.shape) {
          shapesById.set(data.shapeId, { ...data.shape, id: data.shapeId });
          continue;
        }

        if (data.shape) {
          const shapeId =
            typeof data.shape.id === "string"
              ? data.shape.id
              : String(message.id);
          shapesById.set(shapeId, { ...data.shape, id: shapeId });
        }
      } catch {
        // Ignore non-drawing messages in the canvas history.
      }
    }

    res.json({ shapes: [...shapesById.values()] });
  } catch (e) {
    console.error("Get shapes error:", e);
    res.status(500).json({
      message: "Internal server error",
      shapes: [],
    });
  }
});

// Get room by slug
app.get("/api/room/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const room = await prismaClient.room.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        createdAt: true,
        adminId: true,
      },
    });

    if (!room) {
      res.status(404).json({
        message: "Room not found",
      });
      return;
    }

    res.json({ room });
  } catch (e) {
    console.error("Get room error:", e);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Get user's rooms
app.get("/api/user/rooms", middleware, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const rooms = await prismaClient.room.findMany({
      where: {
        OR: [{ adminId: userId }, { members: { some: { userId } } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        createdAt: true,
        adminId: true,
        admin: {
          select: { name: true },
        },
        members: {
          orderBy: { joinedAt: "desc" },
          take: 5,
          select: {
            user: {
              select: { id: true, name: true, photo: true },
            },
          },
        },
      },
    });

    res.json({
      rooms: rooms.map(({ members, admin, adminId, ...room }) => ({
        ...room,
        ownership: adminId === userId ? "owned" : "shared",
        ownerName: admin.name,
        collaborators: members.map(({ user }) => user),
      })),
    });
  } catch (e) {
    console.error("Get user rooms error:", e);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

const PORT = HTTP_PORT;

app.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on port ${PORT}`);
});
