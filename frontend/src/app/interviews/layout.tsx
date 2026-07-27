import type { Metadata } from "next";
import AppLayout from "@/components/helpers/AppLayout";

export const metadata: Metadata = {
  title: "META IITGN-College Feed",
  description:
    "Discover what's happening at IIT Gandhinagar with the META IITGN College Feed. Browse campus news, student posts, events, announcements, club updates, and community discussions in one place.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}