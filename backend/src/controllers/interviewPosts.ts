import express from "express";
import { prisma } from "../lib/prisma.js";
import { markUrlsAsUsed, extractUrlsFromText } from "../utils/cleanup.js";

// Helper to check if a JSON tags field includes a target tag
function matchesTag(tagsJson: any, targetTag: string): boolean {
  if (!targetTag) return true;
  if (!tagsJson) return false;
  let arr: string[] = [];
  if (Array.isArray(tagsJson)) {
    arr = tagsJson;
  } else if (typeof tagsJson === "string") {
    try {
      arr = JSON.parse(tagsJson);
    } catch {
      arr = [tagsJson];
    }
  }
  return arr.some(
    (t) => String(t).toLowerCase() === targetTag.toLowerCase()
  );
}

export async function getFeedPosts(req: express.Request, res: express.Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 12));
    const tag = req.query.tag ? String(req.query.tag).trim() : null;
    const search = req.query.search ? String(req.query.search).trim() : null;
    const cursor = req.query.cursor ? Number(req.query.cursor) : null;

    const whereCondition: any = {
      approved: true,
      deleted_at: null,
    };

    if (search) {
      whereCondition.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch posts from database
    const rawPosts = await prisma.interview_posts.findMany({
      where: whereCondition,
      include: {
        owner: {
          select: {
            user_id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Filter by tag if requested
    let filteredPosts = rawPosts;
    if (tag && tag.toLowerCase() !== "all") {
      filteredPosts = rawPosts.filter((post) => matchesTag(post.tags, tag));
    }

    const total = filteredPosts.length;
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = filteredPosts.findIndex((p) => p.post_id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    } else {
      startIndex = (page - 1) * limit;
    }
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);

    // Attach isLiked status if user is authenticated
    let likedPostIds = new Set<number>();
    if (req.user?.user_id) {
      const userLikes = await prisma.interview_post_likes.findMany({
        where: {
          user_id: Number(req.user.user_id),
          post_id: { in: paginatedPosts.map((p) => p.post_id) },
        },
        select: { post_id: true },
      });
      userLikes.forEach((l) => likedPostIds.add(l.post_id));
    }

    const posts = paginatedPosts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.post_id),
    }));

    const hasMore = startIndex + limit < total;
    const nextCursor = paginatedPosts.length > 0 ? paginatedPosts[paginatedPosts.length - 1].post_id : null;

    return res.json({
      success: true,
      posts,
      total,
      page,
      limit,
      hasMore,
      cursor: nextCursor,
    });
  } catch (err: any) {
    console.error("Error in getFeedPosts:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getFeaturedPosts(req: express.Request, res: express.Response) {
  try {
    const rawPosts = await prisma.interview_posts.findMany({
      where: {
        approved: true,
        featured: true,
        deleted_at: null,
      },
      include: {
        owner: {
          select: {
            user_id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    let likedPostIds = new Set<number>();
    if (req.user?.user_id) {
      const userLikes = await prisma.interview_post_likes.findMany({
        where: {
          user_id: Number(req.user.user_id),
          post_id: { in: rawPosts.map((p) => p.post_id) },
        },
        select: { post_id: true },
      });
      userLikes.forEach((l) => likedPostIds.add(l.post_id));
    }

    const posts = rawPosts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.post_id),
    }));

    return res.json({
      success: true,
      posts,
    });
  } catch (err: any) {
    console.error("Error in getFeaturedPosts:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getUserStats(req: express.Request, res: express.Response) {
  try {
    const userId = Number(req.user.user_id);

    const totalPosts = await prisma.interview_posts.count({
      where: { owner_id: userId, deleted_at: null },
    });

    const approvedPosts = await prisma.interview_posts.count({
      where: { owner_id: userId, approved: true, deleted_at: null },
    });

    const pendingPosts = await prisma.interview_posts.count({
      where: { owner_id: userId, approved: false, deleted_at: null },
    });

    const likesSum = await prisma.interview_posts.aggregate({
      where: { owner_id: userId, deleted_at: null },
      _sum: { likes_count: true },
    });

    return res.json({
      success: true,
      stats: {
        totalPosts,
        approvedPosts,
        pendingPosts,
        totalLikes: likesSum._sum.likes_count || 0,
      },
    });
  } catch (err: any) {
    console.error("Error in getUserStats:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getMyPosts(req: express.Request, res: express.Response) {
  try {
    const userId = Number(req.user.user_id);

    const rawPosts = await prisma.interview_posts.findMany({
      where: {
        owner_id: userId,
        deleted_at: null,
      },
      include: {
        owner: {
          select: {
            user_id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const userLikes = await prisma.interview_post_likes.findMany({
      where: {
        user_id: userId,
        post_id: { in: rawPosts.map((p) => p.post_id) },
      },
      select: { post_id: true },
    });
    const likedPostIds = new Set(userLikes.map((l) => l.post_id));

    const posts = rawPosts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.post_id),
    }));

    return res.json({
      success: true,
      posts,
    });
  } catch (err: any) {
    console.error("Error in getMyPosts:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function createPost(req: express.Request, res: express.Response) {
  try {
    const userId = Number(req.user.user_id);
    const { content, media, video_url, company, role, tags } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Post content is required" },
      });
    }

    const formattedMedia = Array.isArray(media) ? media : [];
    const formattedTags = Array.isArray(tags) ? tags : [];

    const newPost = await prisma.interview_posts.create({
      data: {
        owner_id: userId,
        content: content.trim(),
        media: formattedMedia,
        video_url: video_url ? String(video_url).trim() : null,
        company: company ? String(company).trim() : null,
        role: role ? String(role).trim() : null,
        tags: formattedTags,
        approved: false, // Must be approved by admin
        featured: false,
      },
      include: {
        owner: {
          select: {
            user_id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });

    // Mark media URLs as used in media_assets so garbage collector preserves them
    const allUrls = [...formattedMedia, ...extractUrlsFromText(content)];
    await markUrlsAsUsed(allUrls);

    return res.status(201).json({
      success: true,
      post: newPost,
      message: "Interview post submitted successfully! It will go live after admin approval.",
    });
  } catch (err: any) {
    console.error("Error in createPost:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function toggleLikePost(req: express.Request, res: express.Response) {
  try {
    const userId = Number(req.user.user_id);
    const postId = Number(req.params.id);

    const post = await prisma.interview_posts.findUnique({
      where: { post_id: postId },
    });

    if (!post || post.deleted_at) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Post not found" },
      });
    }

    const existingLike = await prisma.interview_post_likes.findUnique({
      where: {
        unique_interview_post_user_like: {
          post_id: postId,
          user_id: userId,
        },
      },
    });

    let isLiked = false;
    let updatedLikesCount = post.likes_count;

    if (existingLike) {
      // Remove like
      await prisma.$transaction([
        prisma.interview_post_likes.delete({
          where: { id: existingLike.id },
        }),
        prisma.interview_posts.update({
          where: { post_id: postId },
          data: { likes_count: { decrement: 1 } },
        }),
      ]);
      isLiked = false;
      updatedLikesCount = Math.max(0, post.likes_count - 1);
    } else {
      // Add like
      await prisma.$transaction([
        prisma.interview_post_likes.create({
          data: {
            post_id: postId,
            user_id: userId,
          },
        }),
        prisma.interview_posts.update({
          where: { post_id: postId },
          data: { likes_count: { increment: 1 } },
        }),
      ]);
      isLiked = true;
      updatedLikesCount = post.likes_count + 1;
    }

    return res.json({
      success: true,
      isLiked,
      likesCount: updatedLikesCount,
    });
  } catch (err: any) {
    console.error("Error in toggleLikePost:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getPendingPosts(req: express.Request, res: express.Response) {
  try {
    const pendingPosts = await prisma.interview_posts.findMany({
      where: {
        approved: false,
        deleted_at: null,
      },
      include: {
        owner: {
          select: {
            user_id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return res.json({
      success: true,
      posts: pendingPosts,
    });
  } catch (err: any) {
    console.error("Error in getPendingPosts:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function approvePost(req: express.Request, res: express.Response) {
  try {
    const postId = Number(req.params.id);
    const { approved = true } = req.body;

    const updatedPost = await prisma.interview_posts.update({
      where: { post_id: postId },
      data: { approved: Boolean(approved) },
      include: {
        owner: {
          select: {
            user_id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      post: updatedPost,
      message: approved ? "Post approved and published to feed." : "Post approval revoked.",
    });
  } catch (err: any) {
    console.error("Error in approvePost:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function toggleFeaturePost(req: express.Request, res: express.Response) {
  try {
    const postId = Number(req.params.id);
    const { featured } = req.body;

    const post = await prisma.interview_posts.findUnique({
      where: { post_id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Post not found" },
      });
    }

    const newFeaturedState = typeof featured === "boolean" ? featured : !post.featured;

    const updatedPost = await prisma.interview_posts.update({
      where: { post_id: postId },
      data: { featured: newFeaturedState },
      include: {
        owner: {
          select: {
            user_id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      post: updatedPost,
    });
  } catch (err: any) {
    console.error("Error in toggleFeaturePost:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function deletePost(req: express.Request, res: express.Response) {
  try {
    const postId = Number(req.params.id);
    const userId = Number(req.user.user_id);
    const userRole = req.user.role?.toLowerCase();

    const post = await prisma.interview_posts.findUnique({
      where: { post_id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Post not found" },
      });
    }

    // Only post owner or admin/moderator can delete
    if (post.owner_id !== userId && userRole !== "admin" && userRole !== "moderator") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Insufficient permissions to delete this post" },
      });
    }

    await prisma.interview_posts.update({
      where: { post_id: postId },
      data: { deleted_at: new Date() },
    });

    return res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err: any) {
    console.error("Error in deletePost:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getFeedSyncCheck(req: express.Request, res: express.Response) {
  try {
    const stats = await prisma.interview_posts.aggregate({
      where: {
        approved: true,
        deleted_at: null,
      },
      _max: {
        post_id: true,
        updated_at: true,
      },
      _count: {
        post_id: true,
      },
    });

    const totalPosts = stats._count.post_id || 0;
    const latestPostId = stats._max.post_id || 0;
    const updatedAt = stats._max.updated_at ? stats._max.updated_at.toISOString() : new Date(0).toISOString();
    const version = `${new Date(updatedAt).getTime()}_${totalPosts}_${latestPostId}`;

    return res.json({
      success: true,
      version,
      latestPostId,
      totalPosts,
      updatedAt,
      data: {
        version,
        latestPostId,
        totalPosts,
        updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error in getFeedSyncCheck:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message },
    });
  }
}
