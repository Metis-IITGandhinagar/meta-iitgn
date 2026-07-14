import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-base-100 flex flex-col items-center justify-center z-[99999]">
      {/* Top glowing progress line loader */}
      <div className="fixed top-0 left-0 right-0 h-[3px] w-full overflow-hidden bg-base-200">
        <div className="h-full bg-primary animate-loading-bar w-full origin-left" />
      </div>
      
      {/* Centered premium loading state */}
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin opacity-80" />
        <span className="text-xs font-bold tracking-widest text-base-content/40 uppercase animate-pulse">
          Loading Meta IITGN
        </span>
      </div>
    </div>
  );
}
