import type { Metadata } from "next";
import Link from "next/link";
import HomeClient from "./home-client";
import { getSeoMetadata, getOrganizationSchema, getWebSiteSchema } from "@/lib/seo";

export const metadata: Metadata = getSeoMetadata({
  path: "/",
});

export default function HomePage() {
  const orgSchema = getOrganizationSchema();
  const websiteSchema = getWebSiteSchema();

  return (
    <>
      {/* JSON-LD Structured Data for Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <main className="relative min-h-screen w-full">
        {/* SEO Semantic Shell: Hidden from UI display but accessible to Search Crawlers */}
        <article className="sr-only absolute width-[1px] height-[1px] p-0 -m-[1px] overflow-hidden clip-[rect(0,0,0,0)] border-0 whitespace-nowrap">
          <header>
            <h1>META IITGN | IIT Gandhinagar Academic Hub, PYQs & Student Wiki</h1>
            <p>
              Welcome to META IITGN, the official student-run collaborative campus wiki and academic resource sharing platform for the Indian Institute of Technology Gandhinagar (IITGN).
            </p>
          </header>

          <section>
            <h2>Academic Resources & Previous Year Papers (PYQs)</h2>
            <p>
              Prepare for mid-semester and end-semester exams with access to previous year question papers (PYQs), course reviews, engineering studies materials, and lecture slides contributed by the student community of IIT Gandhinagar.
            </p>
            <ul>
              <li><Link href="/paper">Explore PYQs (Past Exam Papers)</Link></li>
              <li><Link href="/wiki">Browse the Campus Wiki</Link></li>
              <li><Link href="/calender">View Academic Calendar</Link></li>
            </ul>
          </section>

          <section>
            <h2>Student Community, Blogs & Campus News</h2>
            <p>
              Discover technical guides, campus life articles, internship experiences, and student life stories from across the IITGN community. Keep track of upcoming campus events, competitions, and student clubs.
            </p>
            <ul>
              <li><Link href="/blog">Read Student Blogs</Link></li>
              <li><Link href="/interviews">Student Placement & Internship Interviews</Link></li>
              <li><Link href="/competitions">Hackathons & Competitions</Link></li>
            </ul>
          </section>

          <section>
            <h2>Why Choose META IITGN?</h2>
            <p>
              META IITGN serves as a central knowledge repository of campus information, from hostel facilities and student senate updates to course planning and campus map details. Built by developers, moderated by students.
            </p>
          </section>
        </article>

        {/* Client side dashboard logic */}
        <HomeClient />
      </main>
    </>
  );
}
