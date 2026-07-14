import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { google } from "googleapis";
import { createToken } from '../service/auth.js';
import { oauth2client } from '../config/googleConfig.js';
import axios from 'axios';
import { userCache } from '../utils/userCache.js';
import { invalidateSyncCache } from './page.controller.js';

export const devBypass = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev bypass is disabled in production' });
  }

  try {
    const { name, email, avatar_url, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const validRoles = ['normal', 'moderator', 'admin'];
    const chosenRole = role && validRoles.includes(role.toLowerCase()) ? role.toLowerCase() : null;

    let user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.users.create({
        data: {
          name: name || email.split('@')[0],
          email,
          avatar_url: avatar_url || null,
          role: (chosenRole || 'normal') as any,
          points: 0,
        },
      });
    } else if (chosenRole && user.role !== chosenRole) {
      user = await prisma.users.update({
        where: { email },
        data: { role: chosenRole as any }
      });
    }
    userCache.delete(user.user_id);
    invalidateSyncCache('contributors');

    const token = createToken({
      user_id: user.user_id,
      name: user.name,
      email: user.email
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Dev login bypass successful",
      user
    });
  } catch (error: any) {
    console.error('Error in devBypass:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const usersList = await prisma.users.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    return res.json(usersList);
  } catch (error: any) {
    console.error('Error in getUsers:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const handleMe = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    return res.json({
      success: true,
      user: req.user
    });
  } catch (error: any) {
    console.error("Error in handleMe:", error);
    return res.status(500).json({
      success: false,
      message: "error occurred",
      error: "Internal Server Error"
    });
  }
};

export const clearUser = async (req: Request, res: Response) => {
  try {
    if (req.user && req.user.user_id) {
      userCache.delete(Number(req.user.user_id));
    }
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.json({
      success: true,
      message: "Logged out",
    });
  } catch (error: any) {
    console.error("Error in clearUser:", error);
    return res.status(500).json({
      success: false,
      message: "error occurred",
      error: "Internal Server Error"
    });
  }
};

export const handleGoogleAuth = async (req: Request, res: Response) => {
  const code = (req.query.code || req.body.code) as string;
  try {
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required"
      });
    }

    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);

    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );
    const { email, name, picture } = userRes.data;

    let user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.users.create({
        data: {
          name: name || email.split('@')[0],
          email,
          avatar_url: picture || null,
          role: 'normal',
          points: 0,
        }
      });
    } else {
      user = await prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          last_login_at: new Date(),
        }
      });
    }
    userCache.delete(user.user_id);
    invalidateSyncCache('contributors');

    const token = createToken({
      user_id: user.user_id,
      name: user.name,
      email: user.email
    });

    return res.status(200).cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }).json({
      success: true,
      message: "Login successful",
    });

  } catch (error: any) {
    console.error("Error in handleGoogleAuth:", error);
    return res.status(500).json({
      success: false,
      message: "error occurred",
      error: "Internal Server Error"
    });
  }
};
