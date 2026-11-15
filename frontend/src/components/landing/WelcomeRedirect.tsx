"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/** Signed-in users skip the landing page and go straight to the wiki. */
export function WelcomeRedirect() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);
  return null;
}
