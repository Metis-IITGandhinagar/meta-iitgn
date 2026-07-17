"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { apiService } from "@/api";
import Link from "next/link";
import {
  X,
  Check,
  ArrowLeft,
  PanelRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import BottomNavbar from "@/components/BottomNavbar";

// Dynamically import BlockNoteEditor to disable SSR
const BlockNoteEditor = dynamic(
  () => import("@/components/blog/BlockNoteEditor"),
  { ssr: false }
);

export default function BlogEditPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const isNew = slug === "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // BlockNote integration states
  const [initialContent, setInitialContent] = useState<string | undefined>(undefined);
  const [isContentReady, setIsContentReady] = useState(false);
  const contentRef = useRef<string>("");

  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light");

  useDocumentTitle(isNew ? "New Blog Post" : title ? `Editing: ${title}` : "Edit Blog Post");

  // Sync theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark") || 
                     document.documentElement.getAttribute("data-theme") === "dark";
      setEditorTheme(isDark ? "dark" : "light");
    }
  }, []);

  // Fetch / Initialize
  useEffect(() => {
    if (isNew) {
      setIsContentReady(true);
      return;
    }

    if (!slug) return;

    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await apiService.getBlog(slug);
        if (res && res.success) {
          setTitle(res.blog.title);
          setDescription(res.blog.description || "");

          // Check permissions
          const isAuthor = res.blog.original_author_id === user?.user_id;
          const isAdminOrMod = user?.role === "admin" || user?.role === "moderator";
          if (!isAuthor && !isAdminOrMod) {
            router.push(`/blog/${slug}`);
            return;
          }

          if (res.blog.content) {
            setInitialContent(res.blog.content);
            contentRef.current = res.blog.content;
          }
          setIsContentReady(true);
        }
      } catch (err: any) {
        console.error("Error fetching blog for edit:", err);
        setError("Failed to load blog post.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug, isNew, user, router]);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] mt-16 bg-transparent">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const handleUploadFile = async (file: File): Promise<string> => {
    if (file.type.startsWith("video/")) {
      alert("Direct video uploads are disabled to save cloud space. Please use a YouTube or other video link!");
      throw new Error("Direct video uploads are disabled");
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File size cannot exceed 2MB.");
      throw new Error("File size cannot exceed 2MB");
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiService.uploadMedia(formData);
      if (res && res.url) {
        return res.url;
      }
      throw new Error("Upload response did not contain URL");
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to upload file.");
      throw err;
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required (configure in right settings panel)");
      setRightSidebarOpen(true);
      return;
    }

    try {
      setError("");
      setSaving(true);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        content: contentRef.current,
      };

      if (isNew) {
        const res = await apiService.createBlog(payload);
        if (res && res.success) {
          router.push(`/blog/${res.blog.slug}`);
        }
      } else {
        const res = await apiService.updateBlog(slug, payload);
        if (res && res.success) {
          router.push(`/blog/${res.blog.slug}`);
        }
      }
    } catch (err: any) {
      console.error("Error saving blog:", err);
      setError(err.response?.data?.error || err.message || "Failed to save blog post.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      id: "cancel",
      label: "Cancel",
      icon: X,
      onClick: () => {
        if (confirm("Are you sure you want to discard your changes?")) {
          router.push(isNew ? "/blog" : `/blog/${slug}`);
        }
      },
      colorClass: "bg-error text-error-content hover:bg-error/90",
    },
    {
      id: "save",
      label: saving ? "Publishing..." : "Publish Blog",
      icon: Check,
      onClick: handleSave,
      colorClass: "bg-success text-success-content hover:bg-success/90",
    },
    {
      id: "sidebar",
      label: "Sidebar",
      icon: PanelRight,
      onClick: () => setRightSidebarOpen(!rightSidebarOpen),
      colorClass: rightSidebarOpen 
        ? "bg-primary text-primary-content hover:bg-primary/90" 
        : "text-base-content/70 hover:bg-base-200 hover:text-base-content",
    },
  ];

  return (
    <main className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)] w-full mt-16 bg-transparent relative">
      {/* Editor Main Workspace */}
      <div className="flex-1 flex flex-col overflow-y-auto  sm:p-6 md:p-8 pb-32">
        <div className="max-w-5xl w-full mx-auto space-y-3 sm:space-y-6">
                    {/* Header */}
          <div className="flex justify-between items-start gap-4 p-2">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-base-content tracking-tight">
                {isNew ? "Write a New Blog Post" : "Edit Blog Post"}
              </h1>
              <p className="text-[10px] sm:text-xs text-base-content/50 font-bold uppercase tracking-wider mt-1">
                Write structured, media-rich content using a Notion-style editor.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 text-xs bg-error/10 text-error border border-error/20 rounded-2xl font-semibold">
              {error}
            </div>
          )}

          {/* BlockNote editor container */}
          <div className="border border-base-200 hover:border-base-300 sm:rounded-3xl overflow-hidden focus-within:border-primary/40 transition-colors select-text bg-base-100 pl-8 sm:p-6 min-h-[500px]">
            {isContentReady ? (
              <BlockNoteEditor
                initialContent={initialContent}
                onChange={(json) => {
                  contentRef.current = json;
                }}
                uploadFile={handleUploadFile}
                theme={editorTheme}
              />
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Settings Sidebar */}
      {rightSidebarOpen && (
        <aside className="w-80 border-l border-base-200 bg-base-100 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 select-none animate-in slide-in-from-right duration-200 h-full fixed lg:relative top-16 lg:top-0 bottom-0 right-0 z-[999] shadow-2xl lg:shadow-none">
          <div className="flex items-center justify-between border-b border-base-200 pb-4">
            <h3 className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
              Blog Settings
            </h3>
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
              title="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
              Blog Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
              className="input input-bordered w-full text-base-content text-sm rounded-xl focus:outline-none focus:border-primary font-semibold"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 font-sans">
            <label className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
              Short Description / Summary
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a brief overview..."
              className="textarea textarea-bordered w-full text-base-content text-xs rounded-xl min-h-[140px] focus:outline-none focus:border-primary resize-none leading-relaxed"
            />
          </div>
        </aside>
      )}

      {/* Floating Action Bar */}
      <BottomNavbar tabs={tabs} activeTab={saving ? "save" : undefined} />
    </main>
  );
}
