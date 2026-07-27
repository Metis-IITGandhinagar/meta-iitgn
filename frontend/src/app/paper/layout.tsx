import type { Metadata } from "next";
import AppLayout from "@/components/helpers/AppLayout";

export const metadata: Metadata = {
  title: "META IITGN-Previous Year Question Papers (PYQs)",
  description:
    "Access IIT Gandhinagar Previous Year Question Papers (PYQs) organized by course, semester, and academic year. Prepare smarter with a searchable collection of past exam papers on META IITGN.",
  keywords: [
    "IIT Gandhinagar PYQs",
    "IITGN Previous Year Question Papers",
    "PYQ",
    "Past Papers",
    "Exam Papers",
    "Semester Exams",
    "Course-wise PYQs",
    "META IITGN",
  ],
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}