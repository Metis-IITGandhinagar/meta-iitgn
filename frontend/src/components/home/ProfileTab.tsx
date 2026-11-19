"use client";

import ProfileContent from "@/components/helpers/ProfileContent";

export default function ProfileTab() {
    return (
        <div className="relative w-full min-h-dvh lg:min-h-dvh flex flex-col items-center justify-start overflow-y-auto bg-base-200/30 pb-20 pt-2 px-1 md:px-8">
            <div className="relative w-full max-w-6xl">
                <ProfileContent />
            </div>
        </div>
    );
}
