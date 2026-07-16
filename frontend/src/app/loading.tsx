import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-base-100 z-[99999]">
      <div className="flex-1 flex items-center justify-center">
        <h1 className="font-semibold tracking-wide text-base-content animate-loading-zoom whitespace-nowrap">
          META IITGN
        </h1>
      </div>

      <p className="mb-8 text-xs tracking-widest text-base-content/50 uppercase animate-pulse">
        by metis
      </p>
    </div>
  );
}