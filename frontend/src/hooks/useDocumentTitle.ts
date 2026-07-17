"use client";

import { useEffect } from "react";

export const SITE_NAME = "META IITGN";

/**
 * Sets the browser tab title for client components.
 *
 * Pass the page/content name and it becomes `"<name> | META IITGN"`.
 * Pass a nullish/empty value (e.g. while content is still loading) to fall
 * back to the bare site name.
 *
 * Server components should use Next's `generateMetadata` instead.
 */
export function useDocumentTitle(name?: string | null) {
  useEffect(() => {
    const trimmed = name?.trim();
    document.title = trimmed ? `${trimmed} | ${SITE_NAME}` : SITE_NAME;
  }, [name]);
}
