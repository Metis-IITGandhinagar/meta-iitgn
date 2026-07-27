import type { Metadata } from "next";
import AppLayout from "@/components/helpers/AppLayout";

export const metadata: Metadata = {
  title: {
    default: "META IITGN",
    template: "%s | META IITGN",
  },
  description:
    "META IITGN is the collaborative campus platform for IIT Gandhinagar featuring PYQs, campus news, articles, blogs, academic calendar, events, student resources, and more.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}