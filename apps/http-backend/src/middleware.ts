import { NextFunction, Request, Response } from "express";
import { prismaClient } from "@repo/db/client";

export async function middleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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

    // @ts-ignore
    req.userId = defaultUser.id;
    next();
  } catch (error) {
    console.error("Auth bypass error:", error);
    res.status(500).json({
      message: "Internal server error during auth bypass",
    });
  }
}
