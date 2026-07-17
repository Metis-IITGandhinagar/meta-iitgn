import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { google } from "googleapis";
import { createToken } from '../service/auth.js';
import { oauth2client } from '../config/googleConfig.js';
import axios from 'axios';
import { userCache } from '../utils/userCache.js';
import { invalidateSyncCache } from './page.controller.js';
import { countUserEdits, fibonacciPoints } from '../utils/points.js';
import { setTokenCookie, clearTokenCookie } from '../utils/cookies.js';

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

    const token = createToken({
      user_id: user.user_id,
      name: user.name,
      email: user.email
    });

    setTokenCookie(res, token);

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
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const [usersList, total] = await Promise.all([
      prisma.users.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.users.count({
        where: { deleted_at: null },
      }),
    ]);

    const hasMore = skip + usersList.length < total;

    return res.json({
      success: true,
      users: usersList,
      total,
      hasMore,
    });
  } catch (error: any) {
    console.error('Error in getUsers:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

export const getUsersCount = async (req: Request, res: Response) => {
  try {
    const count = await prisma.users.count({
      where: { deleted_at: null },
    });
    return res.json({ success: true, count });
  } catch (error: any) {
    console.error('Error in getUsersCount:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userIdToUpdate = parseInt(String(req.params.user_id), 10);
    const { role } = req.body;
    const adminUser = req.user;

    if (!role || !['admin', 'moderator', 'normal'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid user role specified.' });
    }

    const targetUser = await prisma.users.findUnique({
      where: { user_id: userIdToUpdate, deleted_at: null },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.users.update({
        where: { user_id: userIdToUpdate },
        data: { role },
      });

      await tx.audit_logs.create({
        data: {
          actor_id: adminUser.user_id,
          action: `Change role of user ${targetUser.name} (#${targetUser.user_id}) from ${targetUser.role} to ${role}`,
          table_name: 'users',
          record_id: targetUser.user_id,
          ip_address: req.ip || null,
        },
      });

      return updated;
    });

    return res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error in updateUserRole:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { user_id: Number(req.params.user_id), deleted_at: null }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ success: true, user });
  } catch (error: any) {
    console.error('Error in getUserById:', error);
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
    clearTokenCookie(res);
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

    const token = createToken({
      user_id: user.user_id,
      name: user.name,
      email: user.email
    });

    setTokenCookie(res, token);
    return res.status(200).json({
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

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.user_id || req.user.user_id);
    const userObj = await prisma.users.findUnique({
      where: { user_id: userId }
    });

    if (!userObj) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const userName = userObj.name;

    // Articles improved (pages where they are a contributor)
    const articlesImproved = await prisma.live_pages.count({
      where: {
        deleted_at: null,
        contributors: {
          path: [],
          array_contains: userName
        }
      }
    });

    // Edits this month (revisions in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const editsThisMonth = await prisma.revision_pages.count({
      where: {
        created_by_user_id: userId,
        created_at: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Streak calculation from revisions
    const revisions = await prisma.revision_pages.findMany({
      where: { created_by_user_id: userId },
      select: { created_at: true },
      orderBy: { created_at: 'desc' }
    });

    let streak = 0;
    if (revisions.length > 0) {
      const uniqueDates = Array.from(new Set(revisions.map(r => r.created_at.toISOString().split('T')[0])))
        .map(d => new Date(d));
      uniqueDates.sort((a, b) => b.getTime() - a.getTime());

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const latestDate = uniqueDates[0];
      const diffTime = today.getTime() - latestDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streak = 1;
        let currentCheck = latestDate;
        for (let i = 1; i < uniqueDates.length; i++) {
          const nextDate = uniqueDates[i];
          const diff = currentCheck.getTime() - nextDate.getTime();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (days === 1) {
            streak++;
            currentCheck = nextDate;
          } else if (days > 1) {
            break;
          }
        }
      }
    }

    // Contribution points derived from the user's edit count (Fibonacci Scale).
    const totalEdits = await countUserEdits(userId);
    const points = fibonacciPoints(totalEdits);

    return res.json({
      success: true,
      data: {
        points,
        articlesImproved,
        editsThisMonth,
        streak
      }
    });
  } catch (error: any) {
    console.error('Error in getUserStats:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' }
    });
  }
};

export const getUserBookmarks = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.user_id);

    const userObj = await prisma.users.findUnique({
      where: { user_id: userId, deleted_at: null }
    });
    if (!userObj) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const items = await prisma.bookmarks.findMany({
      where: { user_id: userId },
      include: { live_page: true }
    });

    return res.json(items.map((item: any) => {
      let snippet = "";
      if (item.live_page?.content) {
        const clean = item.live_page.content.replace(/^---[\s\S]*?---/, "").trim();
        snippet = clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
      }
      return {
        bookmark_id: item.bookmark_id,
        id: String(item.live_page?.page_id),
        title: item.live_page?.title,
        category: (item.live_page?.metadata as any)?.category || "General",
        slug: item.live_page?.slug,
        description: snippet
      };
    }));
  } catch (error: any) {
    console.error('Error in getUserBookmarks:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
