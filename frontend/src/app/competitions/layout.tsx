import type { Metadata } from "next";
import AppLayout from "@/components/helpers/AppLayout";

export const metadata: Metadata = {
  title: "META IITGN-Competitive Programming & Opportunities",
  description:
    "Explore upcoming coding contests, competitive programming resources, hackathons, open-source projects, internships, scholarships, and technical learning resources for IIT Gandhinagar students.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}