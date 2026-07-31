import type { Metadata } from "next";
import AppLayout from "@/components/helpers/AppLayout";
import { getSeoMetadata, getBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = getSeoMetadata({
  title: "Placement Interviews & Preparation Feed",
  description: "Read interview experiences, placement guides, internship experiences, and preparation tips shared by the IIT Gandhinagar student community on META IITGN.",
  path: "/interviews",
  keywords: ["IITGN placement interviews", "IIT Gandhinagar internship preparation", "IITGN student advice"],
});

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: "Interview Feed", item: "/interviews" },
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