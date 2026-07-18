"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { apiService } from "@/api";
import { Calendar, User as UserIcon, Eye, Pencil, Trash2, ArrowLeft, History, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import BottomNavbar from "@/components/navs/BottomNavbar";
import BlogRevisionsView from "@/components/blog/BlogRevisionsView";
import BlogPendingChangesView from "@/components/blog/BlogPendingChangesView";
import ConfirmationModal from "@/components/overlays/ConfirmationModal";
import { toast } from "react-hot-toast";

const BlockNoteReader = dynamic(
  () => import("@/components/blog/BlockNoteReader"),
  { ssr: false }
);

interface BlogAuthor {
  user_id: number;
  name: string;
  avatar_url?: string | null;
}

interface BlogData {
  blog_id: number;
  title: string;
  description?: string | null;
  slug: string;
  content?: string | null;
  created_at: string;
  view_count: number;
  original_author_id: number;
  original_author: BlogAuthor;
  version?: number | null;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user } = useAuth();

  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light");
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPendingChanges, setShowPendingChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useDocumentTitle(blog?.title ?? (loading ? undefined : "Blog Post Not Found"));

  // Sync theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark") || 
                     document.documentElement.getAttribute("data-theme") === "dark";
      setEditorTheme(isDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await apiService.getBlog(slug);
        if (res && res.success) {
          setBlog(res.blog);
        }
      } catch (err: any) {
        console.error("Error loading blog details:", err);
        setError(err.response?.data?.error || err.message || "Failed to load blog post.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  const triggerDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!blog || deleting) return;
    try {
      setDeleting(true);
      const res = await apiService.deleteBlog(blog.slug);
      if (res && res.success) {
        toast.success("Blog post deleted successfully!");
        router.push("/blog");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to delete blog post.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return "Unknown Date";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] mt-16 bg-transparent">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <main className="flex-1 p-6 md:p-8 mt-16 bg-transparent">
        <div className="max-w-3xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-base-content font-serif">Blog Post Not Found</h1>
          <p className="text-base-content/60 mt-2">{error || "The requested blog post does not exist or has been deleted."}</p>
          <Link href="/blog" className="btn btn-primary inline-flex items-center gap-2 mt-6 rounded-xl text-primary-content">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Blogs</span>
          </Link>
        </div>
      </main>
    );
  }

  const isAuthor = user?.user_id === blog.original_author_id;
  const isAdminOrMod = user?.role === "admin" || user?.role === "moderator";
  const canEdit = !!user;
  const canDelete = isAuthor || isAdminOrMod;

  const tabs = [
    canDelete && {
      id: "delete",
      label: "Delete Post",
      icon: Trash2,
      onClick: triggerDelete,
      colorClass: "bg-error/10 text-error border border-error/20 hover:bg-error/20 hover:text-error",
    },
    canEdit && {
      id: "revisions",
      label: "History",
      icon: History,
      onClick: () => setShowRevisions(true),
      colorClass: "bg-base-200 text-base-content hover:bg-base-300",
    },
    canEdit && {
      id: "changes",
      label: "Pending Drafts",
      icon: FileText,
      onClick: () => setShowPendingChanges(true),
      colorClass: "bg-base-200 text-base-content hover:bg-base-300",
    },
    canEdit && {
      id: "edit",
      label: "Edit Post",
      icon: Pencil,
      onClick: () => router.push(`/blog/${blog.slug}/edit`),
      colorClass: "bg-primary text-primary-content hover:bg-primary/90",
    },
  ].filter(Boolean) as any[];

  return (
    <main className="flex-1 p-3 sm:p-6 md:p-8 mt-16 bg-transparent overflow-y-auto h-full w-full pb-32">
      <article className="md:max-w-6xl w-dvw mx-auto space-y-4 sm:space-y-6">
        
        {/* Blog Title & Meta */}
        <div className="pb-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-black text-base-content tracking-tight leading-tight">
            {blog.title}
          </h1>

          {blog.description && (
            <p className="text-base-content/70 text-sm sm:text-base md:text-lg italic font-medium leading-relaxed">
              {blog.description}
            </p>
          )}

          <div className="flex flex-col  justify-end gap-4 pt-4 border-t border-base-200">            

            {/* Read Stats */}
            <div className="flex items-center gap-4 text-xs text-base-content/50 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(blog.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {blog.view_count} views
              </span>
              {blog.version !== undefined && blog.version !== null && (
                <span className="badge badge-sm font-bold bg-neutral/20 text-base-content/80 border border-base-300 normal-case tracking-normal">
                  v{blog.version}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BlockNote Article content */}
        <div className="bg-base-100 select-text w-dvw md:w-auto -mx-6 md:m-0  mb-20">
          <BlockNoteReader contentJson={blog.content} theme={editorTheme} />
        </div>

      </article>

      {/* Floating Action Bar */}
      {canEdit && tabs.length > 0 && (
        <BottomNavbar tabs={tabs} activeTab={deleting ? "delete" : undefined} />
      )}

      {showRevisions && (
        <BlogRevisionsView setShowRevisions={setShowRevisions} slug={blog.slug} />
      )}

      {showPendingChanges && (
        <BlogPendingChangesView
          setShowPendingChanges={setShowPendingChanges}
          blogId={blog.blog_id}
          slug={blog.slug}
          title={blog.title}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Blog Post"
        message="Are you sure you want to delete this blog post? This action is permanent and cannot be undone."
        confirmText="Delete"
        cancelText="Keep Post"
        type="danger"
      />
    </main>
  );
}
