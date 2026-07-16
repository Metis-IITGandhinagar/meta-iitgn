/**
 * URL <-> modal-state bridge.
 *
 * Modals in this app are driven by client state (Zustand for home overlays /
 * settings, local component state for wiki modals). To make every modal
 * reflect its state in the URL (so the browser back button closes it and
 * deep links work) without a full page reload, we serialize that state into
 * query params on the current route:
 *
 *   overlay   -> home overlay type ("new" | "updated" | ... | "portal")
 *   category  -> portal category slug (only meaningful when overlay=portal)
 *   settings  -> settings tab ("appearance" | "layout" | "search" | "alerts")
 *   wmodal    -> wiki overlay type ("revisions" | "pending" | "mess" | "transport")
 *
 * Each modal owns one param; buildQuery merges into the existing query so
 * multiple modals can be reflected at once without clobbering each other.
 */

export type ModalParamKey = "overlay" | "category" | "settings" | "wmodal";

export interface ModalParams {
  overlay: string | null;
  category: string | null;
  settings: string | null;
  wmodal: string | null;
}

export function parseModalParams(sp: URLSearchParams): ModalParams {
  return {
    overlay: sp.get("overlay"),
    category: sp.get("category"),
    settings: sp.get("settings"),
    wmodal: sp.get("wmodal"),
  };
}

/**
 * Return a new query string that merges `patch` into `current`.
 * A null/undefined value deletes the key.
 */
export function buildQuery(
  current: string,
  patch: Partial<ModalParams>
): string {
  const params = new URLSearchParams(current);
  (Object.keys(patch) as ModalParamKey[]).forEach((key) => {
    const value = patch[key];
    if (value === null || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });
  return params.toString();
}
