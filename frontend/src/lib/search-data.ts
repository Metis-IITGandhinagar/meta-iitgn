import {
  Building2,
  BookOpen,
  Users2,
  Trophy,
  FlaskConical,
  Shield,
  Sparkles,
  HelpCircle,
  LucideIcon
} from "lucide-react";

export interface SearchableItem {
  title: string;
  category: string;
  path: string;
  description: string;
}

export const allSearchableItems: SearchableItem[] = [
  {
    title: "IIT Gandhinagar Campus & Architecture",
    category: "Campus",
    path: "/wiki/page/1",
    description:
      "Information about Palaj campus facilities, design, architecture, and construction.",
  },
  {
    title: "Amalthea Technical Summit",
    category: "Fests",
    path: "/wiki/page/1",
    description: "The student-organized technical summit of IIT Gandhinagar.",
  },
  {
    title: "Hostels and Student Life",
    category: "Campus",
    path: "/wiki/page/1",
    description:
      "Everything about hostels, Mess dining, and student council rules.",
  },
  {
    title: "Technical Council & Clubs",
    category: "Clubs",
    path: "/wiki/page/1",
    description:
      "Explore robotics, coding, animanga, astronomy, and developer clubs.",
  },
  {
    title: "Computer Science Curriculum",
    category: "Academics",
    path: "/wiki/page/1",
    description: "Undergraduate curriculum and course plans for CS major.",
  },
  {
    title: "Research Labs & Facilities",
    category: "Research",
    path: "/wiki/page/1",
    description:
      "Directory of advanced research instrumentation and centers.",
  },
];

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Campus: Building2,
  Academics: BookOpen,
  Clubs: Users2,
  Fests: Trophy,
  Research: FlaskConical,
  Policies: Shield,
  All: Sparkles,
};
