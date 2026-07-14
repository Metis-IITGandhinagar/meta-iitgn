"use client";

import ProfileContent from "@/components/ProfileContent";

export default function ProfileTab() {
    return (
        <div className="relative w-full min-h-screen lg:min-h-dvh flex flex-col items-center justify-start overflow-y-auto bg-base-200/30 pb-28 pt-16 px-4 md:px-8">
            <div className="relative z-10 w-full max-w-6xl">
                <ProfileContent />
            </div>
        </div>
    );
}
