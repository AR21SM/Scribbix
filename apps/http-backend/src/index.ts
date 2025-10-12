import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Limit auth requests to 5 per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
});

app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Signup endpoint with password hashing
app.post("/api/signup", authLimiter, async (req, res) => {
    try {
        const parsedData = CreateUserSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Invalid input data",
                errors: parsedData.error.errors
            });
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data.username,
                password: hashedPassword,
                name: parsedData.data.name
            }
        });

        // Generate token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            userId: user.id,
            token,
            message: "User created successfully"
        });
    } catch(e: any) {
        console.error('Signup error:', e);
        if (e.code === 'P2002') {
            return res.status(409).json({
                message: "User already exists with this email"
            });
        }
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

// Signin endpoint with password verification
app.post("/api/signin", authLimiter, async (req, res) => {
    try {
        const parsedData = SigninSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Invalid input data",
                errors: parsedData.error.errors
            });
        }

        const user = await prismaClient.user.findUnique({
            where: {
                email: parsedData.data.username
            }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(parsedData.data.password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            userId: user.id,
            name: user.name,
            email: user.email
        });
    } catch(e) {
        console.error('Signin error:', e);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

// Create room endpoint
app.post("/api/room", middleware, async (req, res) => {
    try {
        const parsedData = CreateRoomSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Invalid input data",
                errors: parsedData.error.errors
            });
        }
        
        // @ts-ignore: userId is added by middleware
        const userId = req.userId;

        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        });

        res.status(201).json({
            roomId: room.id,
            slug: room.slug
        });
    } catch(e: any) {
        console.error('Room creation error:', e);
        if (e.code === 'P2002') {
            return res.status(409).json({
                message: "Room already exists with this name"
            });
        }
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

// Get room shapes/data
app.get("/api/room/:roomId/shapes", async (req, res) => {
    try {
        const roomId = req.params.roomId;
        
        const room = await prismaClient.room.findUnique({
            where: { id: parseInt(roomId) }
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: parseInt(roomId)
            },
            orderBy: {
                id: "asc"
            },
            take: 5000 // Limit to prevent memory issues
        });

        // Parse shapes from messages
        const shapes = messages
            .map(msg => {
                try {
                    return JSON.parse(msg.message);
                } catch {
                    return null;
                }
            })
            .filter(Boolean)
            .map(data => data.shape)
            .filter(Boolean);

        res.json({ shapes });
    } catch(e) {
        console.error('Get shapes error:', e);
        res.status(500).json({
            message: "Internal server error",
            shapes: []
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
                adminId: true
            }
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        res.json({ room });
    } catch(e) {
        console.error('Get room error:', e);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

// Get user's rooms
app.get("/api/user/rooms", middleware, async (req, res) => {
    try {
        // @ts-ignore: userId is added by middleware
        const userId = req.userId;

        const rooms = await prismaClient.room.findMany({
            where: { adminId: userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                slug: true,
                createdAt: true
            }
        });

        res.json({ rooms });
    } catch(e) {
        console.error('Get user rooms error:', e);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 HTTP Server running on port ${PORT}`);
});
