"use client";

import { useEffect, useState } from "react";
import {
  getAvatarDataUri,
  getAvatarSeed,
  AVATAR_CHANGED_EVENT,
} from "@/lib/avatar";

interface AvatarProps {
  /** Preferred seed source: the user's email (used for the localStorage override). */
  email?: string | null;
  /** Display name, used as the alt text and as a seed fallback when no email. */
  name?: string | null;
  /** Explicit seed override; wins over email/name when provided. */
  seed?: string;
  className?: string;
  alt?: string;
}

/**
 * Always renders a generated DiceBear (notionists) avatar. Never uses an uploaded
 * photo. Seeds by the resolved localStorage override -> email -> name, and
 * re-renders live when the user shuffles their avatar.
 */
export default function Avatar({ email, name, seed, className, alt }: AvatarProps) {
  // Deterministic base seed shared by server and first client render.
  const baseSeed = seed ?? email ?? name ?? "";
  const [resolvedSeed, setResolvedSeed] = useState(baseSeed);

  useEffect(() => {
    // If an explicit seed is passed, it always wins — nothing to resolve.
    if (seed) {
      setResolvedSeed(seed);
      return;
    }
    const compute = () => {
      if (email) setResolvedSeed(getAvatarSeed(email));
      else setResolvedSeed(name ?? "");
    };
    compute();
    window.addEventListener(AVATAR_CHANGED_EVENT, compute);
    window.addEventListener("storage", compute);
    return () => {
      window.removeEventListener(AVATAR_CHANGED_EVENT, compute);
      window.removeEventListener("storage", compute);
    };
  }, [seed, email, name]);

  return (
    // Inline data-URI SVG — next/image can't optimize it, so <img> is correct here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getAvatarDataUri(resolvedSeed)}
      alt={alt ?? name ?? "User avatar"}
      className={className}
    />
  );
}
