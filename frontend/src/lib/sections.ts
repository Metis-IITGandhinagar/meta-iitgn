import { BookOpen, Briefcase, Home, Library, MessageSquare, Trophy, type LucideIcon } from "lucide-react";

export interface AppSection {
  label: string;
  href: string;
  hint: string;
  icon: LucideIcon;
}

/** The app's top-level places. One list powers the menu, breadcrumb and ⌘K palette. */
export const SECTIONS: AppSection[] = [
  { label: "Home", href: "/", hint: "Start here", icon: Home },
  { label: "Wiki", href: "/wiki/categories", hint: "Hostels, mess, clubs, how things work", icon: Library },
  { label: "Blogs", href: "/blog", hint: "Longer reads from campus", icon: BookOpen },
  { label: "Stories", href: "/interviews", hint: "Interviews, internships, advice", icon: MessageSquare },
  { label: "PrepMat", href: "/prepmat", hint: "Company notes for placements", icon: Briefcase },
  { label: "Contests", href: "/competitions", hint: "Contests, hackathons, resources", icon: Trophy },
];

export function sectionForPath(pathname: string | null): AppSection | null {
  if (!pathname || pathname === "/") return null;
  const match = SECTIONS.filter((s) => s.href !== "/" && pathname.startsWith(s.href.split("/").slice(0, 2).join("/")))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (pathname.startsWith("/wiki")) return SECTIONS[1];
  return match ?? null;
}
