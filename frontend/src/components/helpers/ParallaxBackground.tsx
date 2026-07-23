"use client";

import React, { useState, useEffect } from "react";

interface ParallaxBackgroundProps {
  imageSrc: string; // Left for backwards compatibility, will be used as the first slide
  overlayClass?: string;
}

const SLIDESHOW_IMAGES = [
  "/homepage_bg.png",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1600&auto=format&fit=crop",
  "https://plus.unsplash.com/premium_photo-1661761077411-d50cba031848?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1536925155833-43e9c2b2f499?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1600&auto=format&fit=crop",
];

export default function ParallaxBackground({
  imageSrc,
  overlayClass = "bg-linear-to-b via-slate-900/45 to-slate-950/65",
}: ParallaxBackgroundProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Rotate background images every 10 seconds (10000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Use the imageSrc prop as the fallback/first slide if provided, otherwise default
  const slides = [imageSrc || SLIDESHOW_IMAGES[0], ...SLIDESHOW_IMAGES.slice(1)];

  return (
    <>
      {/* Container holding all slideshow layers */}
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
        {slides.map((src, index) => {
          const isActive = currentSlide === index;
          return (
            <div
              key={`${src}-${index}`}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out transform scale-105"
              style={{
                backgroundImage: `url('${src}')`,
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 1 : 0,
              }}
            />
          );
        })}
      </div>
      {/* Dark Wash Overlay */}
      <div className={`absolute inset-0 z-10 ${overlayClass}`} />
    </>
  );
}
