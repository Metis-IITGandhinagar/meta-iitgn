"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

interface InterviewMediaSliderProps {
  media: string[];
}

export default function InterviewMediaSlider({ media }: InterviewMediaSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Touch swipe states
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!fullscreenImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImage]);

  if (!media || media.length === 0) return null;

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  // Touch swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40; // minimum distance in px to trigger swipe

    if (distance > minSwipeDistance) {
      // Swiped left -> Go next
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> Go prev
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black/5 dark:bg-black/40 border border-base-200 shadow-inner group my-2 select-none">
      {/* Slide Container with Touch Support */}
      <div
        className="relative h-64 sm:h-80 w-full overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {media.map((url, idx) => (
            <div
              key={idx}
              className="relative h-full w-full flex-shrink-0 cursor-pointer overflow-hidden flex items-center justify-center bg-base-300/20"
              onClick={() => setFullscreenImage(url)}
            >
              <Image
                src={url}
                alt={`Post image ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                unoptimized={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen view trigger button */}
      <button
        type="button"
        onClick={() => setFullscreenImage(media[currentIndex])}
        className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white backdrop-blur-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer z-10"
        title="Enlarge Image"
      >
        <Maximize2 className="h-4 w-4" />
      </button>

      {/* Prev / Next Controls (only if > 1 image) */}
      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-base-100/90 text-base-content shadow-lg backdrop-blur-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-base-100/90 text-base-content shadow-lg backdrop-blur-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer z-10"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md z-10">
            {media.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? "w-5 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Fullscreen Lightbox Modal rendered via Portal directly onto document.body */}
      {fullscreenImage && mounted && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/15 text-white hover:bg-white/30 transition-colors cursor-pointer z-50 shadow-lg"
            aria-label="Close image preview"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[95vw] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={fullscreenImage}
              alt="Enlarged media view"
              width={1920}
              height={1080}
              className="max-h-[85vh] max-w-[90vw] w-auto h-auto rounded-xl object-contain shadow-2xl"
              unoptimized={true}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

