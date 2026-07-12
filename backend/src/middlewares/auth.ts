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

function checkAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      ok: false,
    });
  }
  const user = validateToken(token);

  if (!user) {
    return res.status(401).json({
      ok: false,
    });
  }
  req.user = user;
  next();
}

async function protect(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      ok: false,
    });
  }

  const tokenUser = validateToken(token);

  if (!tokenUser) {
    return res.status(401).json({
      ok: false,
    });
  }

  const dbUser = await prisma.users
    .findUnique({
      where: { user_id: Number(tokenUser.user_id)},
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
      },
    });

  if (!dbUser) {
    return res.status(401).json({
      ok: false,
    });
  }

  req.user = dbUser;

  next();
}

export { checkAuth, protect };
