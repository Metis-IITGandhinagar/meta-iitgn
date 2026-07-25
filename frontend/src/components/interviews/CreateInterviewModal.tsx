"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
import { createInterviewPost } from "@/api/interviews";
import { uploadMedia } from "@/api/page";
import { ImagePlus, Video, Building2, Briefcase, Tag, Sparkles, AlertCircle, X, Loader2 } from "lucide-react";

interface CreateInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const PRESET_TAGS = [
  "advice",
  "google",
  "apple",
  "amazon",
  "microsoft",
  "interview-prep",
  "off-campus",
  "resume",
  "system-design",
  "dsa",
  "hr-round",
];

export default function CreateInterviewModal({ isOpen, onClose, onPostCreated }: CreateInterviewModalProps) {
  const [content, setContent] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["advice"]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const cleanTag = customTagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (cleanTag && !selectedTags.includes(cleanTag)) {
      setSelectedTags((prev) => [...prev, cleanTag]);
      setCustomTagInput("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await uploadMedia(formData);
        if (res && res.url) {
          setMediaList((prev) => [...prev, res.url]);
        }
      }
      toast.success("Images uploaded!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.error || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please provide interview post content.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createInterviewPost({
        content: content.trim(),
        company: company.trim() || undefined,
        role: role.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        media: mediaList,
        tags: selectedTags,
      });

      if (res && res.success) {
        toast.success(res.message || "Submitted for admin approval!");
        if (onPostCreated) onPostCreated();
        onClose();
        // Reset form
        setContent("");
        setCompany("");
        setRole("");
        setVideoUrl("");
        setSelectedTags(["advice"]);
        setMediaList([]);
      }
    } catch (err: any) {
      console.error("Error creating post:", err);
      toast.error(err.response?.data?.error?.message || "Failed to submit post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Interview Experience"
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sans select-text pb-6">
        {/* Notice Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-base-content/85">
          <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-bold text-primary">Admin Review Required:</strong> All posts are reviewed by campus moderators before going live on the feed to maintain community standards.
          </p>
        </div>

        {/* Company & Role Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-base-content/70 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Company Name
            </label>
            <input
              type="text"
              placeholder="e.g. Google, Apple, Microsoft"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input input-sm input-bordered w-full rounded-xl text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-base-content/70 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-secondary" /> Role / Title
            </label>
            <input
              type="text"
              placeholder="e.g. SDE Intern, Product Manager"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input input-sm input-bordered w-full rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Post Content */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-base-content/70 flex items-center justify-between">
            <span>Interview Details & Advice *</span>
            <span className="text-[10px] text-base-content/40 font-normal">Markdown supported</span>
          </label>
          <textarea
            required
            rows={5}
            placeholder="Share your interview rounds, questions asked, tips for prep, key takeaways, and difficulty level..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="textarea textarea-bordered w-full rounded-2xl text-xs leading-relaxed focus:outline-none focus:border-primary"
          />
        </div>

        {/* Tags Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-base-content/70 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-accent" /> Tags
          </label>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`btn btn-xs rounded-xl transition-all cursor-pointer font-semibold ${
                    isSelected
                      ? "btn-primary shadow-xs"
                      : "btn-outline border-base-300 text-base-content/70 hover:bg-base-200"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Add custom tag (press enter)..."
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={addCustomTag}
              className="input input-xs input-bordered rounded-xl text-xs flex-1 max-w-xs"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="btn btn-xs btn-ghost rounded-xl text-primary font-bold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Video Link */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-base-content/70 flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-error" /> Video URL (YouTube / Vimeo / Direct Link)
          </label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="input input-sm input-bordered w-full rounded-xl text-xs"
          />
        </div>

        {/* Image Attachments */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-base-content/70 flex items-center gap-1.5">
              <ImagePlus className="h-3.5 w-3.5 text-success" /> Images & Screenshots
            </label>
            <label className="btn btn-xs btn-outline btn-success rounded-xl cursor-pointer">
              {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
              <span>Upload Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploaded Media Previews */}
          {mediaList.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {mediaList.map((url, idx) => (
                <div key={idx} className="relative h-20 w-full rounded-xl overflow-hidden border border-base-300 group">
                  <Image
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    fill
                    sizes="100px"
                    className="object-cover"
                    unoptimized={true}
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-base-200">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost rounded-xl font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="btn btn-sm btn-primary rounded-xl font-bold px-6 shadow-sm gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Submit for Approval
              </>
            )}
          </button>
        </div>
      </form>
    </GenericOverlayModal>
  );
}
