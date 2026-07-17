import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

/**
 * GET /audit-logs
 * Retrieves paginated audit logs for administrators
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              user_id: true,
              name: true,
              avatar_url: true,
              role: true,
            },
          },
        },
      }),
      prisma.audit_logs.count(),
    ]);

    const hasMore = skip + logs.length < total;

    return res.json({
      success: true,
      logs,
      total,
      hasMore,
    });
  } catch (error: any) {
    console.error("Error in getAuditLogs:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to retrieve audit logs",
      },
    });
  }
};
