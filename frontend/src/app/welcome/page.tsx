import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, Library, Search, Users } from "lucide-react";
import { BrandMark } from "@/components/helpers/BrandMark";
import { ThemeToggle } from "@/components/helpers/ThemeToggle";
import { WelcomeRedirect } from "@/components/landing/WelcomeRedirect";
import { Reveal } from "@/components/landing/Reveal";
import { TypingDemo } from "@/components/landing/TypingDemo";
import { InstituteLogo } from "@/components/helpers/InstituteLogo";

export const metadata: Metadata = {
  title: "Meta IITGN | The student knowledge base for IIT Gandhinagar",
  description:
    "Hostels, mess, courses, clubs and placement prep, written by IITGN students. Free to read, open to edit.",
};

const TOPICS = ["Hostels", "Mess", "Courses", "Clubs", "Placements", "Fests", "Labs", "Off-campus", "Contests", "Research"];

const FEATURES = [
  { icon: Search, title: "Search that finds it", text: "One search across every page, from mess timings to course notes." },
  { icon: Library, title: "Guides by topic", text: "Pages are grouped the way students actually look for things." },
  { icon: Briefcase, title: "PrepMat for placements", text: "Company notes and interview experiences from seniors." },
  { icon: Users, title: "Written by students", text: "Anyone at IITGN can fix a page or add what they know." },
];

export default function WelcomePage() {
  return (
    <div className="min-h-dvh bg-base-100 text-base-content font-sans">
      <WelcomeRedirect />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-base-content focus:px-4 focus:py-2 focus:text-sm focus:text-base-100">
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-base-300/70 bg-base-100/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2 shrink-0" aria-label="Meta IITGN">
            <BrandMark size={24} />
            <span className="text-[14px] font-semibold tracking-tight whitespace-nowrap" translate="no">Meta IITGN</span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1 text-[14px]">
            <Link href="/wiki/categories" className="hidden sm:inline-flex min-h-11 items-center px-3 text-base-content/70 hover:text-base-content">Wiki</Link>
            <Link href="/blog" className="hidden sm:inline-flex min-h-11 items-center px-3 text-base-content/70 hover:text-base-content">Blogs</Link>
            <Link href="/prepmat" className="hidden sm:inline-flex min-h-11 items-center px-3 text-base-content/70 hover:text-base-content">PrepMat</Link>
            <Link href="/login" className="hidden sm:inline-flex min-h-11 items-center px-3 text-base-content/70 hover:text-base-content whitespace-nowrap">Sign in</Link>
            <ThemeToggle />
            <Link href="/wiki/categories" className="ml-1 h-9 inline-flex items-center whitespace-nowrap rounded-md bg-base-content px-3.5 font-medium text-base-100 hover:opacity-90">
              Open wiki
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-5 pt-16 sm:pt-24 pb-14 text-center">
          <h1 className="text-[34px] sm:text-[48px] lg:text-[60px] font-bold tracking-[-0.04em] leading-[1.04] rise">
            Everything about IITGN,
            <br />
            <span className="text-primary">one search away.</span>
          </h1>
          <p className="mt-5 mx-auto max-w-xl text-[16px] leading-relaxed text-base-content/70 rise" style={{ "--i": 1 } as React.CSSProperties}>
            The student-written knowledge base for IIT Gandhinagar. Hostels, mess, courses, clubs and placements, free to read and open to edit.
          </p>
          <div className="mt-9 flex justify-center gap-3 rise" style={{ "--i": 2 } as React.CSSProperties}>
            <Link href="/wiki/categories" className="h-11 px-5 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-content text-[14px] font-medium hover:opacity-90 transition-opacity">
              Open the wiki <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/login" className="h-11 px-5 inline-flex items-center rounded-lg border border-base-300 text-[14px] font-medium hover:bg-base-200 transition-colors">
              Sign in to contribute
            </Link>
          </div>
        </section>

        {/* Product preview */}
        <section aria-label="Product preview" className="max-w-3xl mx-auto px-5 pb-16">
          <TypingDemo />
        </section>

        {/* Topic marquee */}
        <div className="marquee border-y border-base-300/70 py-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]" aria-hidden>
          <div className="marquee-track">
            {[0, 1].map((k) => (
              <ul key={k} className="flex shrink-0 items-center">
                {TOPICS.map((t, i) => (
                  <li key={`${k}-${t}`} className="flex items-center">
                    <span className={`px-6 text-[32px] sm:text-[44px] font-bold tracking-[-0.04em] leading-none ${i % 2 ? "text-base-content/20" : "text-base-content"}`}>{t}</span>
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* Features */}
        <section aria-labelledby="why-h" className="border-t border-base-300/70">
          <div className="max-w-5xl mx-auto px-5 py-16">
            <Reveal>
              <h2 id="why-h" className="text-[26px] sm:text-[36px] font-bold tracking-[-0.035em] leading-[1.1] text-balance max-w-xl">
                Built for the questions <span className="text-primary">every batch asks.</span>
              </h2>
            </Reveal>
            <Reveal delay={120} className="mt-10">
            <div className="grid sm:grid-cols-2 gap-px bg-base-300 border border-base-300 rounded-2xl overflow-hidden">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="bg-base-100 p-6">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                    <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-base-content/70">{f.text}</p>
                  </div>
                );
              })}
            </div>
            </Reveal>
          </div>
        </section>

        {/* Campus */}
        <section aria-label="The campus" className="max-w-5xl mx-auto px-5 pb-16">
          <Reveal><div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-base-300">
            <Image
              src="/homepage_bg.webp"
              alt="The red-brick amphitheatre at IIT Gandhinagar at dusk, with stepped lawns under a glowing sky"
              fill
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover object-[50%_72%]"
            />
          </div></Reveal>
        </section>

        {/* Close */}
        <section className="border-t border-base-300/70">
          <div className="max-w-5xl mx-auto px-5 py-16 text-center">
            <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.04em] leading-tight">Know something? <span className="text-primary">Add it.</span></h2>
            <p className="mt-3 text-[16px] text-base-content/70">Every page started with one student writing down what they wished they had known.</p>
            <Link href="/login" className="mt-7 h-11 px-5 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-content text-[14px] font-medium hover:opacity-90">
              Sign in to contribute <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-base-300/70 overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 py-10 grid sm:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="flex items-center gap-4">
            <BrandMark size={44} />
            <div>
              <p className="text-[16px] font-semibold tracking-tight" translate="no">Meta IITGN</p>
              <p className="text-[14px] text-primary">Ask the ones who&apos;ve been here.</p>
            </div>
          </div>
          <a href="https://iitgn.ac.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[13px] text-base-content/70 hover:text-base-content">
            <span className="rounded-full bg-white p-0.5 inline-flex"><InstituteLogo size={36} /></span>
            <span className="leading-tight" translate="no">
              A student project at
              <span className="block font-medium text-base-content">IIT Gandhinagar</span>
            </span>
          </a>
        </div>
        <p className="select-none whitespace-nowrap text-center font-bold tracking-[-0.06em] leading-[0.8] text-base-content/[0.07] text-[18vw] sm:text-[13vw] mt-2 -mb-[4.5vw]" aria-hidden translate="no">
          Meta IITGN
        </p>
      </footer>
    </div>
  );
}
