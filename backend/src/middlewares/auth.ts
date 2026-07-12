import { validateToken } from "../service/auth.js";
import express from "express";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function protect(...allowedRoles: string[]) {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    const tokenUser = validateToken(token);

    if (!tokenUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const dbUser = await prisma.users.findUnique({
      where: { user_id: Number(tokenUser.user_id) },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (allowedRoles.length > 0) {
      const userRole = dbUser.role.toLowerCase();
      const hasRole = allowedRoles.some((role) => role.toLowerCase() === userRole);
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: "Access denied: insufficient permissions",
        });
      }
    }

    req.user = dbUser;
    next();
  };
}
