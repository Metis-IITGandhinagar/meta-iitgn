import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { processAndMarkMediaUsed } from "../utils/cleanup.js";

/**
   GET /blogs
   Fetch paginated list of live blogs (public)
 */
export const getBlogs = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const [blogsList, totalCount] = await Promise.all([
      prisma.blogs.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          original_author: {
            select: {
              user_id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.blogs.count({
        where: { deleted_at: null },
      }),
    ]);

    const hasMore = skip + blogsList.length < totalCount;

    return res.json({
      success: true,
      blogs: blogsList,
      totalCount,
      hasMore,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Error in getBlogs:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

/**
   GET /blogs/:slug
   Fetch a single blog by slug (public). Increments view_count.
 */
export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await prisma.blogs.findFirst({
      where: {
        slug: String(slug),
        deleted_at: null,
      },
      include: {
        original_author: {
          select: {
            user_id: true,
            name: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Increment view count asynchronously
    prisma.blogs
      .update({
        where: { blog_id: blog.blog_id },
        data: { view_count: { increment: 1 } },
      })
      .catch((err) => console.error("Failed to increment blog view count:", err));

    return res.json({
      success: true,
      blog: {
        ...blog,
        view_count: blog.view_count + 1,
      },
    });
  } catch (error: any) {
    console.error("Error in getBlogBySlug:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

/**
   POST /blogs
   Create a new blog post (authenticated user). Normal users' blogs go to pending_blogs drafts.
 */
export const createBlog = async (req: any, res: Response) => {
  try {
    const { title, description, content } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const authorId = Number(req.user.user_id);
    const userRole = req.user.role;
    const isAdminOrMod = userRole === "admin" || userRole === "moderator";

    // Generate unique slug
    let baseSlug = title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "-");
    if (!baseSlug) baseSlug = "untitled-blog";

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.blogs.findFirst({
        where: { slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    if (isAdminOrMod) {
      const newBlog = await prisma.blogs.create({
        data: {
          title,
          description: description || null,
          slug,
          content: content || null,
          original_author_id: authorId,
          version: 1,
        },
        include: {
          original_author: {
            select: {
              user_id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      });

      await processAndMarkMediaUsed(content);

      return res.status(201).json({
        success: true,
        is_draft: false,
        blog: newBlog,
      });
    } else {
      // Create draft in pending_blogs
      const newDraft = await prisma.pending_blogs.create({
        data: {
          blog_id: null,
          title,
          description: description || null,
          slug,
          content: content || null,
          editor_id: authorId,
          version: 1,
          status: "in_review",
        },
      });

      await processAndMarkMediaUsed(content);

      return res.status(201).json({
        success: true,
        is_draft: true,
        message: "Blog submitted for approval",
        draft: newDraft,
      });
    }
  } catch (error: any) {
    console.error("Error in createBlog:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

/**
   PUT /blogs/:slug
   Update a blog post. Normal users' edits create a draft in pending_blogs.
 */
export const updateBlog = async (req: any, res: Response) => {
  try {
    const { slug } = req.params;
    const { title, description, content } = req.body;

    const blog = await prisma.blogs.findFirst({
      where: {
        slug: String(slug),
        deleted_at: null,
      },
    });

    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const userId = Number(req.user.user_id);
    const userRole = req.user.role;
    const isAdminOrMod = userRole === "admin" || userRole === "moderator";
    const isAuthor = blog.original_author_id === userId;

    // Generate unique slug if title has changed
    let updatedSlug = blog.slug;
    if (title && title.trim() !== blog.title) {
      let baseSlug = title
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "-");
      if (!baseSlug) baseSlug = "untitled-blog";

      updatedSlug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await prisma.blogs.findFirst({
          where: {
            slug: updatedSlug,
            NOT: { blog_id: blog.blog_id },
          },
        });
        if (!existing) break;
        updatedSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    if (isAdminOrMod) {
      const currentVersion = blog.version ?? 1;

      // Direct update for admin/mod, and create backup in revision_blogs
      const result = await prisma.$transaction(async (tx) => {
        await tx.revision_blogs.create({
          data: {
            blog_id: blog.blog_id,
            created_by_user_id: blog.updated_by ?? blog.original_author_id,
            commit_message: `Backup prior to update by admin/moderator`,
            title: blog.title,
            description: blog.description,
            slug: blog.slug,
            content: blog.content,
            original_author_id: blog.original_author_id,
            version: currentVersion,
            created_at: blog.created_at,
            updated_at: blog.updated_at,
            deleted_at: blog.deleted_at,
          },
        });

        const updated = await tx.blogs.update({
          where: { blog_id: blog.blog_id },
          data: {
            title: title !== undefined ? title : blog.title,
            description: description !== undefined ? description : blog.description,
            content: content !== undefined ? content : blog.content,
            slug: updatedSlug,
            updated_by: userId,
            version: currentVersion + 1,
            updated_at: new Date(),
          },
          include: {
            original_author: {
              select: {
                user_id: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        });

        return updated;
      });

      await processAndMarkMediaUsed(content !== undefined ? content : blog.content);

      return res.json({
        success: true,
        is_draft: false,
        blog: result,
      });
    } else {
      // Normal user edit workflow: version check and draft creation in pending_blogs
      const currentVersion = blog.version ?? 1;

      const activeDraft = await prisma.pending_blogs.findFirst({
        where: {
          blog_id: blog.blog_id,
          status: { in: ["draft", "in_review"] },
        },
      });

      if (activeDraft) {
        const activeDraftVersion = activeDraft.version ?? 1;
        const reqVersion = req.body.base_version !== undefined ? Number(req.body.base_version) : activeDraftVersion - 1;
        if (reqVersion < activeDraftVersion - 1) {
          return res.status(409).json({
            success: false,
            error: {
              code: "VERSION_CONFLICT",
              message: "Another user has edited this draft. Please resolve the conflict.",
            },
            currentVersion: activeDraftVersion,
            currentContent: activeDraft.content,
          });
        }

        const updatedDraft = await prisma.pending_blogs.update({
          where: { pending_id: activeDraft.pending_id },
          data: {
            title: title !== undefined ? title : activeDraft.title,
            description: description !== undefined ? description : activeDraft.description,
            content: content !== undefined ? content : activeDraft.content,
            editor_id: userId,
            version: activeDraftVersion + 1,
            status: "in_review",
          },
        });

        await processAndMarkMediaUsed(content !== undefined ? content : activeDraft.content);

        return res.json({
          success: true,
          is_draft: true,
          message: "Blog draft updated and submitted for review",
          draft: updatedDraft,
        });
      } else {
        const reqVersion = req.body.base_version !== undefined ? Number(req.body.base_version) : currentVersion;
        if (reqVersion < currentVersion) {
          return res.status(409).json({
            success: false,
            error: {
              code: "VERSION_CONFLICT",
              message: "Another user has edited this blog post. Please resolve the conflict.",
            },
            currentVersion,
            currentContent: blog.content,
          });
        }

        const newDraft = await prisma.pending_blogs.create({
          data: {
            blog_id: blog.blog_id,
            title: title !== undefined ? title : blog.title,
            description: description !== undefined ? description : blog.description,
            content: content !== undefined ? content : blog.content,
            editor_id: userId,
            version: currentVersion + 1,
            status: "in_review",
          },
        });

        await processAndMarkMediaUsed(content !== undefined ? content : blog.content);

        return res.json({
          success: true,
          is_draft: true,
          message: "Blog edit submitted for review",
          draft: newDraft,
        });
      }
    }
  } catch (error: any) {
    console.error("Error in updateBlog:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

/**
   DELETE /blogs/:slug
   Delete a blog post (authenticated user, soft delete)
 */
export const deleteBlog = async (req: any, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await prisma.blogs.findFirst({
      where: {
        slug: String(slug),
        deleted_at: null,
      },
    });

    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const userId = Number(req.user.user_id);
    const userRole = req.user.role;

    // Only original author, moderator or admin can delete
    const isAuthor = blog.original_author_id === userId;
    const isAdminOrMod = userRole === "admin" || userRole === "moderator";

    if (!isAuthor && !isAdminOrMod) {
      return res.status(403).json({ error: "You do not have permission to delete this blog post" });
    }

    await prisma.blogs.update({
      where: { blog_id: blog.blog_id },
      data: {
        deleted_at: new Date(),
        updated_by: userId,
      },
    });

    return res.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in deleteBlog:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

/**
 * GET /blogs/drafts/pending
 * Fetch pending drafts. Admins/mods can see all pending, normal users only their own drafts.
 */
export const listBlogDrafts = async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const userId = Number(req.user.user_id);
    const userRole = req.user.role;
    const isAdminOrMod = userRole === "admin" || userRole === "moderator";

    const whereClause: any = {};
    if (!isAdminOrMod) {
      whereClause.editor_id = userId;
    } else {
      whereClause.status = "in_review";
    }

    const [drafts, total] = await Promise.all([
      prisma.pending_blogs.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          editor: {
            select: {
              user_id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.pending_blogs.count({
        where: whereClause,
      }),
    ]);

    return res.json({
      success: true,
      drafts,
      total,
      page,
      limit,
      hasMore: skip + drafts.length < total,
    });
  } catch (error: any) {
    console.error("Error in listBlogDrafts:", error);
    return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
};

/**
 * GET /blogs/drafts/:pending_id
 * Fetch a single blog draft by ID (with protection).
 */
export const getBlogDraftById = async (req: any, res: Response) => {
  try {
    const pending_id = parseInt(req.params.pending_id as string, 10);
    const userId = Number(req.user.user_id);
    const userRole = req.user.role;
    const isAdminOrMod = userRole === "admin" || userRole === "moderator";

    const draft = await prisma.pending_blogs.findUnique({
      where: { pending_id },
      include: {
        editor: {
          select: {
            user_id: true,
            name: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!draft) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Draft not found" } });
    }

    if (draft.editor_id !== userId && !isAdminOrMod) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    return res.json({ success: true, draft });
  } catch (error: any) {
    console.error("Error in getBlogDraftById:", error);
    return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
};

/**
 * DELETE /blogs/drafts/:pending_id
 * Delete or cancel a blog draft (only owner or admin).
 */
export const deleteBlogDraft = async (req: any, res: Response) => {
  try {
    const pending_id = parseInt(req.params.pending_id as string, 10);
    const userId = Number(req.user.user_id);
    const userRole = req.user.role;
    const isAdmin = userRole === "admin";

    const draft = await prisma.pending_blogs.findUnique({
      where: { pending_id },
    });

    if (!draft) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Draft not found" } });
    }

    if (draft.editor_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    await prisma.pending_blogs.delete({
      where: { pending_id },
    });

    return res.json({ success: true, message: "Draft deleted successfully" });
  } catch (error: any) {
    console.error("Error in deleteBlogDraft:", error);
    return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
};

/**
 * POST /blogs/drafts/:pending_id/review
 * Approve or reject a blog draft. Admins/moderators only.
 */
export const reviewBlogDraft = async (req: any, res: Response) => {
  try {
    const pending_id = parseInt(req.params.pending_id as string, 10);
    const { reviewer_id, action } = req.body;

    if (!reviewer_id || !action) {
      return res.status(400).json({ error: "reviewer_id and action are required" });
    }

    if (action !== "approve" && action !== "reject") {
      return res.status(400).json({ error: "action must be approve or reject" });
    }

    if (action === "reject") {
      const updatedDraft = await prisma.pending_blogs.update({
        where: { pending_id },
        data: {
          status: "rejected",
          reviewer_id: Number(reviewer_id),
        },
      });
      return res.json({ success: true, message: "Draft rejected", draft: updatedDraft });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch pending draft
      const draft = await tx.pending_blogs.findUnique({
        where: { pending_id },
      });

      if (!draft) {
        throw new Error("Pending draft not found");
      }

      if (draft.blog_id === null) {
        // --- New Blog Workflow ---
        let baseSlug = (draft.title || "untitled-blog")
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "-");

        if (!baseSlug) baseSlug = "untitled-blog";

        let slug = baseSlug;
        let counter = 1;
        while (true) {
          const existing = await tx.blogs.findUnique({
            where: { slug },
          });
          if (!existing) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        const now = new Date();

        // Insert into blogs
        const newBlog = await tx.blogs.create({
          data: {
            title: draft.title || "Untitled Blog",
            description: draft.description,
            slug,
            content: draft.content,
            original_author_id: draft.editor_id,
            version: 1,
            created_at: now,
            updated_at: now,
          },
        });

        // Update draft to approved
        await tx.pending_blogs.update({
          where: { pending_id },
          data: {
            status: "approved",
            reviewer_id: Number(reviewer_id),
          },
        });

        // Audit log
        await tx.audit_logs.create({
          data: {
            actor_id: Number(reviewer_id),
            action: "APPROVE_NEW_BLOG",
            table_name: "pending_blogs",
            record_id: pending_id,
            ip_address: "127.0.0.1",
          },
        });

        return { message: "Draft approved and published.", blog: newBlog };
      } else {
        // --- Edit Blog Workflow ---
        const liveBlog = await tx.blogs.findUnique({
          where: { blog_id: draft.blog_id },
        });

        if (!liveBlog) {
          throw new Error("Original live blog not found");
        }

        // Backup current live state to revision_blogs
        await tx.revision_blogs.create({
          data: {
            blog_id: liveBlog.blog_id,
            created_by_user_id: liveBlog.updated_by ?? liveBlog.original_author_id,
            commit_message: `Backup prior to draft #${pending_id} approval`,
            title: liveBlog.title,
            description: liveBlog.description,
            slug: liveBlog.slug,
            content: liveBlog.content,
            original_author_id: liveBlog.original_author_id,
            version: liveBlog.version,
            created_at: liveBlog.created_at,
            updated_at: liveBlog.updated_at,
            deleted_at: liveBlog.deleted_at,
          },
        });

        const currentVersion = liveBlog.version ?? 1;

        // Update live blog
        const updatedLiveBlog = await tx.blogs.update({
          where: { blog_id: draft.blog_id },
          data: {
            title: draft.title || liveBlog.title,
            description: draft.description,
            content: draft.content,
            version: currentVersion + 1,
            updated_by: draft.editor_id,
            updated_at: new Date(),
          },
        });

        // Update draft status
        await tx.pending_blogs.update({
          where: { pending_id },
          data: {
            status: "approved",
            reviewer_id: Number(reviewer_id),
          },
        });

        // Reject competing drafts
        await tx.pending_blogs.updateMany({
          where: {
            blog_id: draft.blog_id,
            status: "in_review",
            NOT: { pending_id },
          },
          data: {
            status: "rejected",
            reviewer_id: Number(reviewer_id),
          },
        });

        // Audit log
        await tx.audit_logs.create({
          data: {
            actor_id: Number(reviewer_id),
            action: "APPROVE_EDIT_BLOG",
            table_name: "pending_blogs",
            record_id: pending_id,
            ip_address: "127.0.0.1",
          },
        });

        return { message: "Draft approved and published.", blog: updatedLiveBlog };
      }
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error in reviewBlogDraft:", error);
    return res.status(500).json({ success: false, error: { code: "TRANSACTION_FAILED", message: error.message } });
  }
};

/**
 * GET /blogs/:slug/revisions
 * Fetch revision history for a blog post
 */
export const getBlogRevisions = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const liveBlog = await prisma.blogs.findUnique({
      where: { slug: String(slug), deleted_at: null },
    });

    if (!liveBlog) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Blog post not found" } });
    }

    const [revisions, total] = await Promise.all([
      prisma.revision_blogs.findMany({
        where: { blog_id: liveBlog.blog_id },
        orderBy: { version: "desc" },
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              user_id: true,
              name: true,
              avatar_url: true,
              role: true,
            },
          },
        },
      }),
      prisma.revision_blogs.count({
        where: { blog_id: liveBlog.blog_id },
      }),
    ]);

    return res.json({
      success: true,
      revisions,
      total,
      page,
      limit,
      hasMore: skip + revisions.length < total,
    });
  } catch (error: any) {
    console.error("Error in getBlogRevisions:", error);
    return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
};

/**
 * POST /blogs/:slug/revisions/:revision_id/revert
 * Revert a live blog post to a previous revision
 */
export const revertBlogToRevision = async (req: any, res: Response) => {
  try {
    const { slug } = req.params;
    const revision_id = parseInt(req.params.revision_id as string, 10);
    const userId = Number(req.user.user_id);

    const liveBlog = await prisma.blogs.findUnique({
      where: { slug: String(slug), deleted_at: null },
    });

    if (!liveBlog) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Blog post not found" } });
    }

    const revision = await prisma.revision_blogs.findUnique({
      where: { revision_id },
    });

    if (!revision || revision.blog_id !== liveBlog.blog_id) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Revision not found" } });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create a backup revision of the current live state
      await tx.revision_blogs.create({
        data: {
          blog_id: liveBlog.blog_id,
          created_by_user_id: liveBlog.updated_by ?? liveBlog.original_author_id,
          commit_message: `Automatic backup before revert to revision #${revision_id}`,
          title: liveBlog.title,
          description: liveBlog.description,
          slug: liveBlog.slug,
          content: liveBlog.content,
          original_author_id: liveBlog.original_author_id,
          version: liveBlog.version,
          created_at: liveBlog.created_at,
          updated_at: liveBlog.updated_at,
          deleted_at: liveBlog.deleted_at,
        },
      });

      const nextVersion = (liveBlog.version ?? 1) + 1;

      // 2. Update the live blog with revision data
      const updated = await tx.blogs.update({
        where: { blog_id: liveBlog.blog_id },
        data: {
          title: revision.title ?? liveBlog.title,
          description: revision.description,
          content: revision.content,
          version: nextVersion,
          updated_by: userId,
          updated_at: new Date(),
        },
      });

      // Audit log
      await tx.audit_logs.create({
        data: {
          actor_id: userId,
          action: "REVERT_BLOG",
          table_name: "blogs",
          record_id: liveBlog.blog_id,
          ip_address: "127.0.0.1",
        },
      });

      return updated;
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error in revertBlogToRevision:", error);
    return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
};
