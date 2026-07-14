"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  Award,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileEdit,
  FilePlus2,
  Flame,
  Heart,
  MapPin,
  Medal,
  MessageSquare,
  MoreHorizontal,
  PenLine,
  Settings,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const activity = [
  { icon: FileEdit, tone: "text-primary bg-primary/10", action: "edited", article: "Academic Calendar", detail: "Clarified the monsoon semester registration window", time: "2 hours ago" },
  { icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50", action: "reviewed", article: "Student Wellness Centre", detail: "Approved 3 suggested changes", time: "Yesterday" },
  { icon: FilePlus2, tone: "text-indigo-600 bg-indigo-50", action: "created", article: "Inter-IIT Sports Meet", detail: "Added a new campus guide", time: "Jun 18" },
  { icon: MessageSquare, tone: "text-amber-600 bg-amber-50", action: "commented on", article: "Hostel Allotment", detail: "Asked for the latest allotment notice", time: "Jun 15" },
];

const interests = ["Academics", "Campus life", "Student clubs", "Research"];
const badges = [
  { icon: PenLine, title: "First edit", description: "Made your first improvement", tone: "text-primary bg-primary/10" },
  { icon: Flame, title: "On a roll", description: "Contributed 5 days in a row", tone: "text-orange-600 bg-orange-50" },
  { icon: UsersRound, title: "Helpful reviewer", description: "Reviewed 10 suggestions", tone: "text-purple-600 bg-purple-50" },
];

const profileReadme = `## Hello, campus community! 👋

I enjoy making IITGN information easier to find, understand, and keep current. My focus is on **academics**, **campus life**, and resources that help new students get oriented.

### What I contribute to

- Clearer guides for students and visitors
- Updates to campus events, clubs, and facilities
- Thoughtful reviews of community suggestions

> Recent edits, reviews, and new pages appear in the Activity section below.`;

export default function ProfileContent() {
  const { user, activeTier, setSettingsTab } = useAuth();
  const name = user?.name || "Campus Contributor";
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const joined = user?.created_at
    ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(user.created_at))
    : "this semester";
  const role = user?.role || "member";
  const tierLabel = activeTier === "gold" ? "Gold contributor" : activeTier === "silver" ? "Silver contributor" : "Bronze contributor";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-28 border-b border-primary/10 bg-primary/10" />
        <div className="relative px-5 pb-6 pt-16 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-base-100 bg-base-200 text-xl font-black text-base-content shadow-lg">
                {user?.avatar_url ? <img src={user.avatar_url} alt={name} className="h-full w-full object-cover" /> : initials}
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-black tracking-tight text-base-content">{name}</h1>
                  <span className="badge badge-sm border-primary/20 bg-primary/10 font-bold text-primary">{tierLabel}</span>
                </div>
                <p className="text-sm text-base-content/60">{role} · contributing since {joined}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {interests.map((interest) => <span key={interest} className="rounded-full bg-base-200 px-3 py-1 text-xs font-semibold text-base-content/70">{interest}</span>)}
                </div>
              </div>
            </div>
            <button onClick={() => setSettingsTab("appearance")} className="btn btn-outline btn-sm rounded-xl border-base-300 bg-base-100/90 self-start sm:self-auto">
              <Settings className="h-4 w-4" /> Edit profile
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Contribution points", value: user?.points?.toLocaleString() || "0", icon: Sparkles, tone: "text-primary" },
          { label: "Articles improved", value: "28", icon: FileEdit, tone: "text-secondary" },
          { label: "Edits this month", value: "12", icon: TrendingUp, tone: "text-accent" },
          { label: "Current streak", value: "5 days", icon: Flame, tone: "text-warning" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
            <Icon className={`mb-3 h-5 w-5 ${tone}`} />
            <p className="text-xl font-black text-base-content">{value}</p>
            <p className="mt-1 text-xs font-medium text-base-content/55">{label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-base-200 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Profile README</p>
            <h2 className="mt-1 text-lg font-black text-base-content">A little about {name.split(" ")[0]}</h2>
          </div>
          <Link href="/wiki/profile/readme?edit=true" className="btn btn-outline btn-sm rounded-xl shrink-0">
            <PenLine className="h-4 w-4" /> Edit
          </Link>
        </div>
        <div className="prose prose-sm max-w-none text-base-content/75 prose-headings:font-display prose-headings:text-base-content prose-h2:mb-2 prose-h2:text-xl prose-h3:mb-2 prose-h3:mt-5 prose-h3:text-base prose-p:leading-7 prose-li:my-1 prose-blockquote:border-primary prose-blockquote:text-base-content/60">
          <ReactMarkdown>{profileReadme}</ReactMarkdown>
        </div>
      </section>

      <div className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
        <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-black text-base-content">Recent activity</h2><p className="mt-1 text-sm text-base-content/55">A record of your work across META IITGN.</p></div>
            <Link href="/user/contributions" className="btn btn-ghost btn-sm rounded-xl text-primary">View all <ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className="space-y-1">
            {activity.map(({ icon: Icon, tone, action, article, detail, time }) => (
              <Link href="/user/contributions" key={`${action}-${article}`} className="group flex gap-3 rounded-2xl p-3 transition-colors hover:bg-base-200/70">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm text-base-content"><span className="font-semibold">You {action}</span> <span className="font-bold text-primary group-hover:underline">{article}</span></span><span className="mt-0.5 block truncate text-xs text-base-content/55">{detail}</span></span>
                <span className="shrink-0 text-xs text-base-content/45">{time}</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black text-base-content">Contribution goal</h2><Medal className="h-5 w-5 text-warning" /></div>
            <p className="mt-3 text-sm text-base-content/65">Make 8 more improvements to reach the next contributor milestone.</p>
            <progress className="progress progress-primary mt-4 h-2 w-full" value="65" max="100">65%</progress>
            <div className="mt-2 flex justify-between text-xs font-semibold text-base-content/50"><span>28 edits</span><span>36 edits</span></div>
            <Link href="/wiki" className="btn btn-primary btn-sm mt-4 w-full rounded-xl"><BookOpen className="h-4 w-4" /> Find an article to improve</Link>
          </section>

          <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 className="font-black text-base-content">Profile details</h2>
            <div className="mt-4 space-y-3 text-sm"><div className="flex items-center gap-3 text-base-content/65"><MapPin className="h-4 w-4 text-secondary" /> IIT Gandhinagar community</div><div className="flex items-center gap-3 text-base-content/65"><CalendarDays className="h-4 w-4 text-accent" /> Joined {joined}</div><div className="flex items-center gap-3 text-base-content/65"><Heart className="h-4 w-4 text-error" /> {interests.length} areas of interest</div></div>
          </section>
        </aside>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-black text-base-content">Achievements</h2><p className="mt-1 text-sm text-base-content/55">Recognition earned through contribution.</p></div><Award className="h-5 w-5 text-warning" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{badges.map(({ icon: Icon, title, description, tone }) => <div key={title} className="rounded-2xl bg-base-200/70 p-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span><p className="mt-3 text-sm font-bold text-base-content">{title}</p><p className="mt-1 text-xs leading-relaxed text-base-content/55">{description}</p></div>)}</div></section>
        <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-black text-base-content">Your workspace</h2><p className="mt-1 text-sm text-base-content/55">Quick entry points for work in progress.</p></div><MoreHorizontal className="h-5 w-5 text-neutral" /></div><div className="mt-4 divide-y divide-base-200"><Link href="/user/contributions" className="flex items-center gap-3 py-3 text-sm font-semibold text-base-content hover:text-primary"><Clock3 className="h-4 w-4 text-primary" />Drafts and review queue <span className="ml-auto text-xs font-bold text-base-content/45">2 open</span></Link><Link href="/" className="flex items-center gap-3 py-3 text-sm font-semibold text-base-content hover:text-primary"><Bookmark className="h-4 w-4 text-secondary" />Saved articles <span className="ml-auto text-xs font-bold text-base-content/45">6 saved</span></Link><Link href="/user/contributions" className="flex items-center gap-3 py-3 text-sm font-semibold text-base-content hover:text-primary"><UsersRound className="h-4 w-4 text-accent" />People you collaborate with <ChevronRight className="ml-auto h-4 w-4 text-base-content/40" /></Link></div></section>
      </div>
    </div>
  );
}
