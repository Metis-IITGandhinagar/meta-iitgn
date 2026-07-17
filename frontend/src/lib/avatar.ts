import { Style, Avatar } from "@dicebear/core";
import notionistsDefinition from "@dicebear/styles/notionists.json";

// Build the style once and reuse it for every avatar.
const style = new Style(notionistsDefinition as ConstructorParameters<typeof Style>[0]);

// Memoize generated SVGs and data URIs so repeated renders are free.
const svgCache = new Map<string, string>();
const dataUriCache = new Map<string, string>();

/** Generate the raw notionists SVG string for a given seed. */
export function generateAvatarSvg(seed: string): string {
  const cached = svgCache.get(seed);
  if (cached) return cached;
  const svg = new Avatar(style, { seed }).toString();
  svgCache.set(seed, svg);
  return svg;
}

/** Get a `data:image/svg+xml` URI suitable for an <img src>. */
export function getAvatarDataUri(seed: string): string {
  const cached = dataUriCache.get(seed);
  if (cached) return cached;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(generateAvatarSvg(seed))}`;
  dataUriCache.set(seed, uri);
  return uri;
}

// --- Client-side seed store (no DB): keyed by user email in localStorage ---

const SEED_KEY_PREFIX = "wiki_avatar_seed:";
/** Fired on window whenever a user's avatar seed changes (for live updates). */
export const AVATAR_CHANGED_EVENT = "wiki_avatar_changed";

function seedStorageKey(email: string): string {
  return `${SEED_KEY_PREFIX}${email.toLowerCase()}`;
}

/**
 * Resolve the seed for a user: a shuffled override from localStorage if present,
 * otherwise the (deterministic) email itself. SSR-safe.
 */
export function getAvatarSeed(email: string): string {
  if (typeof window === "undefined") return email;
  try {
    return window.localStorage.getItem(seedStorageKey(email)) || email;
  } catch {
    return email;
  }
}

/** Persist a seed override for a user and broadcast the change. */
export function setAvatarSeed(email: string, seed: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(seedStorageKey(email), seed);
    window.dispatchEvent(new Event(AVATAR_CHANGED_EVENT));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

/** Generate a fresh random seed for a user, persist it, and return it. */
export function shuffleAvatarSeed(email: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const seed = `${email}-${random}`;
  setAvatarSeed(email, seed);
  return seed;
}
