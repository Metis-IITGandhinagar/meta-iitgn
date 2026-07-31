import type { Metadata } from "next";
import AppLayout from "@/components/helpers/AppLayout";
import { getSeoMetadata, getBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = getSeoMetadata({
  title: "IIT Gandhinagar PYQs (Previous Year Exam Papers)",
  description: "Access IIT Gandhinagar Previous Year Question Papers (PYQs) organized by course, semester, and academic year. Prepare smarter with a searchable collection of past exam papers on META IITGN.",
  path: "/paper",
  keywords: ["IIT Gandhinagar PYQs", "IITGN Past Papers", "Previous Year Question Papers", "IITGN Exams"],
});

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: "PYQs", item: "/paper" },
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