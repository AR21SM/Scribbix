import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_SECRET,
} from "@repo/backend-common/config";

function unauthorized(res: Response) {
  res.setHeader("WWW-Authenticate", 'Bearer realm="scribbix"');
  res.status(401).json({ message: "Unauthorized" });
}

export function middleware(req: Request, res: Response, next: NextFunction) {
  const authorization = req.get("authorization") ?? "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  const token = match?.[1];

  if (!token) {
    unauthorized(res);
    return;
  }

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
      unauthorized(res);
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch {
    unauthorized(res);
  }
}
