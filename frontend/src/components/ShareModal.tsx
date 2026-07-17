"use client";

import { useEffect, useState } from "react";
import { X, Link2, Check, Copy, Mail, MessageCircle, Send, Share2 } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export default function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Reset the copied state whenever the modal is (re)opened.
  useEffect(() => {
    if (isOpen) setCopied(false);
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for insecure contexts / older browsers.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareTargets = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      Icon: MessageCircle,
      className: "text-green-600 hover:bg-green-500/10 border-green-500/20",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: Share2,
      className: "text-sky-600 hover:bg-sky-500/10 border-sky-500/20",
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: Send,
      className: "text-blue-500 hover:bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      Icon: Mail,
      className: "text-amber-600 hover:bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-base-content/40 backdrop-blur-xs flex items-center justify-center z-[21000] p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col overflow-hidden bg-base-100 border border-base-200 w-full max-w-md rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-200 bg-base-200 text-base-content select-none shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Link2 className="h-5 w-5" />
            <span>Share Page</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-red-400 hover:text-red-500"
            aria-label="Close"
          >
            <X className="h-5 w-5 shrink-0" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-bold text-base-content truncate" title={title}>
              {title}
            </p>
            <p className="text-xs text-base-content/60">
              Anyone with this link can view the page.
            </p>
          </div>

          {/* Copy link */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-base-content/70 uppercase">
              Page Link
            </label>
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                value={url}
                readOnly
                onFocus={(e) => e.target.select()}
                className="input input-bordered flex-1 text-sm text-base-content/80 bg-base-200/50 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`btn btn-sm gap-1.5 shrink-0 ${
                  copied ? "btn-success text-success-content" : "btn-primary text-primary-content"
                }`}
                aria-label="Copy link"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share targets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-base-content/70 uppercase block">
              Share Via
            </label>
            <div className="grid grid-cols-4 gap-2">
              {shareTargets.map(({ label, href, Icon, className }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border bg-base-100 transition-colors cursor-pointer ${className}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] font-semibold text-base-content/70">
                    {label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
