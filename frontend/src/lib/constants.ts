import {
  Home,
  Map,
  BookOpen,
  Users,
  Award,
  Crown,
  Shield,
  Gem,
  Sparkles,
  Zap
} from "lucide-react";

export interface Tier {
  name: string;
  icon: string;
  gradient: string;
  avatarGradient: string;
  roleTitle: string;
  benefits: string[];
}

export const TIERS: Record<string, Tier> = {
  bronze: {
    name: "Bronze",
    icon: "🥉",
    gradient: "from-amber-800 via-amber-600 to-amber-700 text-white",
    avatarGradient: "from-amber-905 via-amber-800 to-amber-700",
    roleTitle: "Bronze Contributor",
    benefits: ["Can only read articles", "Post comments on discussion pages"]
  },
  silver: {
    name: "Silver",
    icon: "🥈",
    gradient: "from-zinc-400 via-slate-200 to-zinc-500 text-zinc-900",
    avatarGradient: "from-zinc-600 via-slate-400 to-zinc-500",
    roleTitle: "Silver Editor",
    benefits: ["Edit unprotected articles", "Upload images to pages"]
  },
  gold: {
    name: "Gold",
    icon: "🥇",
    gradient: "from-yellow-500 via-amber-400 to-yellow-600 text-amber-950",
    avatarGradient: "from-yellow-600 via-amber-500 to-yellow-400",
    roleTitle: "Gold Editor",
    benefits: ["Edit semi-protected pages", "Approve pending drafts"]
  },
  platinum: {
    name: "Platinum",
    icon: "🛡️",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500 text-white",
    avatarGradient: "from-cyan-600 via-blue-500 to-cyan-400",
    roleTitle: "Platinum Mod",
    benefits: ["Lock pages & delete files", "Revert vandalism edits"]
  },
  diamond: {
    name: "Diamond",
    icon: "💎",
    gradient: "from-cyan-400 via-teal-300 to-indigo-500 text-slate-800",
    avatarGradient: "from-cyan-500 via-teal-400 to-indigo-500",
    roleTitle: "Diamond Admin",
    benefits: ["Ban problem users", "Change wiki's visual theme"]
  },
  stardust: {
    name: "Stardust",
    icon: "✨",
    gradient: "from-fuchsia-600 via-purple-600 to-pink-500 text-white",
    avatarGradient: "from-fuchsia-700 via-purple-600 to-pink-500",
    roleTitle: "Stardust Archon",
    benefits: ["Ultimate active control of extensions", "Promote / demote site administrators"]
  },
  singularity: {
    name: "Singularity",
    icon: "🌀",
    gradient: "from-gray-950 via-slate-900 to-violet-950 text-amber-300 border border-amber-400/30",
    avatarGradient: "from-black via-slate-950 to-violet-950",
    roleTitle: "Singularity Admin",
    benefits: ["Root administrative override control", "Absolute permissions over wiki configurations"]
  }
};

export const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bronze: Award,
  silver: Award,
  gold: Crown,
  platinum: Shield,
  diamond: Gem,
  stardust: Sparkles,
  singularity: Zap,
};

export const menuItems = [
  { title: "Home", icon: Home, link: "/" },
  { title: "Campus Map", icon: Map, link: "#" },
  { title: "Academics", icon: BookOpen, link: "#" },
  { title: "Student Life", icon: Users, link: "#" },
];
