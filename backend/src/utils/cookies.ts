import type { CookieOptions, Response } from "express";

// Single source of truth for the auth cookie name.
export const TOKEN_COOKIE = "token";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Base attributes for the auth cookie. These MUST be identical between the
 * Set-Cookie that creates the token and the one that clears it — browsers only
 * delete a cookie when the clearing response matches the original's
 * name + path + domain (and processes it under the same secure/sameSite rules).
 * Deriving both set and clear from this helper guarantees they never drift.
 */
export function getTokenCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  const options: CookieOptions = {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
  };
  // In cross-subdomain production deployments the cookie may be scoped to a
  // parent domain; clearing must use the same domain or the browser keeps it.
  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }
  return options;
}

/** Set the auth token cookie with the standard options + expiry. */
export function setTokenCookie(res: Response, token: string): void {
  res.cookie(TOKEN_COOKIE, token, {
    ...getTokenCookieOptions(),
    maxAge: MAX_AGE_MS,
  });
}

/**
 * Remove the auth token cookie. Uses two mechanisms so deletion is reliable
 * across browsers/proxies: clearCookie (Expires in the past) plus an explicit
 * empty, already-expired cookie with the exact same attributes.
 */
export function clearTokenCookie(res: Response): void {
  const options = getTokenCookieOptions();
  res.clearCookie(TOKEN_COOKIE, options);
  res.cookie(TOKEN_COOKIE, "", {
    ...options,
    expires: new Date(0),
    maxAge: 0,
  });
}
