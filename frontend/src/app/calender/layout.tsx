import type { Metadata } from "next";
import AppLayout from "@/components/helpers/AppLayout";
import { getSeoMetadata, getBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = getSeoMetadata({
  title: "Academic Calendar & Semester Schedule",
  description: "Track key semester start dates, course registration deadlines, mid/end semester exam schedules, recess, and holidays for IIT Gandhinagar on META IITGN.",
  path: "/calender",
  keywords: ["IITGN Academic Calendar", "IIT Gandhinagar Semester Schedule", "IITGN Registration Deadlines"],
});

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: "Academic Calendar", item: "/calender" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AppLayout>{children}</AppLayout>
    </>
  );
}