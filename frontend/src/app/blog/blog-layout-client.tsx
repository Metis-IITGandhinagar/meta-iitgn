"use client";

import React from "react";
import Navbar from "@/components/navs/Navbar";

export default function BlogLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-dvh w-full bg-base-100 overflow-hidden font-sans">
      <div className="z-[10010] fixed top-0 left-0 right-0">
        <Navbar />
      </div>
      <div className="flex h-full w-full overflow-hidden relative">
        <div className="flex flex-col flex-1 h-full w-full min-w-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
