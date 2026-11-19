"use client";

import { Suspense } from "react";
import Navbar from "@/components/navs/Navbar";
import ProfileContent from "@/components/helpers/ProfileContent";

export default function ProfilePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-base-100 font-sans">
      <Navbar />
      <main id="main-content" className="min-w-0 flex-1 py-6 pb-16">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg" aria-label="Loading profile" />
            </div>
          }
        >
          <ProfileContent />
        </Suspense>
      </main>
    </div>
  );
}
