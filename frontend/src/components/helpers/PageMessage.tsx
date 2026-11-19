import type { ReactNode } from "react";

/**
 * Shared full-page message (not found, signed out, nothing here yet).
 * One layout so every "dead end" in the app looks and reads the same.
 */
export function PageMessage({
  eyebrow,
  title,
  children,
  actions,
  icon,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto w-full max-w-xl px-5 py-20 sm:py-28 text-center ${className}`}>
      {icon && (
        <div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-base-300 bg-base-200 text-primary">
          {icon}
        </div>
      )}
      {eyebrow && <p className="t-eyebrow mb-3">{eyebrow}</p>}
      <h1 className="t-display text-balance text-4xl sm:text-5xl">{title}</h1>
      {children && <div className="mt-4 text-[16px] leading-relaxed text-base-content/70">{children}</div>}
      {actions && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </section>
  );
}

/** Button styles shared by page-level actions. */
export const pagePrimaryAction =
  "h-11 px-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-content text-[14px] font-medium hover:opacity-90 transition-opacity";
export const pageSecondaryAction =
  "h-11 px-5 inline-flex items-center justify-center gap-2 rounded-lg border border-base-300 text-[14px] font-medium hover:bg-base-200 transition-colors";
