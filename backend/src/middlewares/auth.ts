import { validateToken } from "../service/auth.js";
import express from "express";
import { prisma } from "../lib/prisma.js";
import { userCache } from "../utils/userCache.js";

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
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

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

    const userId = Number(tokenUser.user_id);
    let dbUser = userCache.get(userId);
    if (!dbUser) {
      dbUser = await prisma.users.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          name: true,
          email: true,
          role: true,
          avatar_url: true,
          is_banned: true,
          points: true,
          created_at: true,
          updated_at: true,
        },
      });
      if (dbUser) {
        userCache.set(userId, dbUser);
      }
    }

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

export async function checkAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

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

  const userId = Number(tokenUser.user_id);
  let dbUser = userCache.get(userId);
  if (!dbUser) {
    dbUser = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        avatar_url: true,
        is_banned: true,
        points: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (dbUser) {
      userCache.set(userId, dbUser);
    }
  }

  if (!dbUser) {
    return res.status(401).json({
      success: false,
      message: "User not found",
    });
  }

  req.user = dbUser;
  next();
}

export async function checkAuthOptional(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const tokenUser = validateToken(token);
    if (!tokenUser) {
      return next();
    }

    const userId = Number(tokenUser.user_id);
    let dbUser = userCache.get(userId);
    if (!dbUser) {
      dbUser = await prisma.users.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          name: true,
          email: true,
          role: true,
          avatar_url: true,
          is_banned: true,
          points: true,
          created_at: true,
          updated_at: true,
        },
      });
      if (dbUser) {
        userCache.set(userId, dbUser);
      }
    }

    if (dbUser) {
      req.user = dbUser;
    }
  } catch (e) {
    // ignore validation errors
  }
  next();
}


