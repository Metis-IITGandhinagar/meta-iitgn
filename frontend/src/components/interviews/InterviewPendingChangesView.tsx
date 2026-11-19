"use client";

import { confirmDialog } from "@/components/helpers/confirmDialog";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
import { getPendingInterviews, approveInterviewPost, toggleFeatureInterviewPost, deleteInterviewPost, InterviewPost } from "@/api/interviews";
import InterviewPostCard from "./InterviewPostCard";
import { Shield, CheckCircle2, Star, Trash2, Loader2 } from "lucide-react";

interface InterviewPendingChangesViewProps {
  setShowPendingChanges: (show: boolean) => void;
}

export default function InterviewPendingChangesView({ setShowPendingChanges }: InterviewPendingChangesViewProps) {
  const [pendingPosts, setPendingPosts] = useState<InterviewPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await getPendingInterviews();
      if (res && res.success) {
        setPendingPosts(res.posts || []);
      }
    } catch (err: any) {
      console.error("Error fetching pending interviews:", err);
      toast.error("Failed to load pending interview posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (postId: number) => {
    try {
      await approveInterviewPost(postId, true);
      toast.success("Post approved!");
      setPendingPosts((prev) => prev.filter((p) => p.post_id !== postId));
    } catch {
      toast.error("Failed to approve post.");
    }
  };

  const handleApproveAndFeature = async (postId: number) => {
    try {
      await approveInterviewPost(postId, true);
      await toggleFeatureInterviewPost(postId, true);
      toast.success("Post approved & marked as Featured!");
      setPendingPosts((prev) => prev.filter((p) => p.post_id !== postId));
    } catch {
      toast.error("Failed to approve/feature post.");
    }
  };

  const handleReject = async (postId: number) => {
    if (!(await confirmDialog({ title: "Reject this post?", message: "The post will be rejected and deleted. This can't be undone.", confirmText: "Reject", type: "danger" }))) return;
    try {
      await deleteInterviewPost(postId);
      toast.success("Post rejected and deleted.");
      setPendingPosts((prev) => prev.filter((p) => p.post_id !== postId));
    } catch {
      toast.error("Failed to reject post.");
    }
  };

  return (
    <GenericOverlayModal
      isOpen={true}
      onClose={() => setShowPendingChanges(false)}
      title="Pending Interview Posts Approvals"
      maxWidthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-6 font-sans select-text pb-10">
        <div className="flex items-center justify-between border-b border-base-300 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-warning/10 text-warning">
              <Shield className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-serif font-black text-base-content tracking-tight">Review Submitted Posts</h2>
              <p className="text-xs text-base-content/60 font-medium">
                {pendingPosts.length} posts waiting for admin approval
              </p>
            </div>
          </div>

          <button onClick={fetchPending} className="btn btn-xs btn-outline rounded-xl">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pendingPosts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-base-300 rounded-3xl bg-base-100">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success/60 mb-2" />
            <h3 className="text-base font-black text-base-content">No Pending Posts</h3>
            <p className="text-xs text-base-content/50 mt-1">All community interview posts have been reviewed!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingPosts.map((post) => (
              <div key={post.post_id} className="space-y-3 p-4 rounded-3xl border border-warning/30 bg-warning/5">
                <InterviewPostCard post={post} />

                {/* Approval Control Bar */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-warning/20">
                  <button
                    onClick={() => handleReject(post.post_id)}
                    className="btn btn-sm btn-ghost text-error hover:bg-error/10 rounded-xl font-bold gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" /> Reject & Delete
                  </button>
                  <button
                    onClick={() => handleApprove(post.post_id)}
                    className="btn btn-sm btn-success text-success-content rounded-xl font-bold gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve & Publish
                  </button>
                  <button
                    onClick={() => handleApproveAndFeature(post.post_id)}
                    className="btn btn-sm btn-accent text-accent-content rounded-xl font-bold gap-1.5 cursor-pointer"
                  >
                    <Star className="h-4 w-4 fill-current" /> Approve & Feature
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GenericOverlayModal>
  );
}
