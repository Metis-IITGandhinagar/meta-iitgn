import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found | META IITGN",
};

export default async function ArticlePage() {
  return (
    <main className="flex-1 p-6 md:p-8 lg:p-12 bg-base-100">
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800">Page Not Found</h1>
        <p className="text-gray-500 mt-2">
          The requested Page could not be found.
        </p>
        <Link
          href="/"
          className="inline-flex mt-6 p-1.5 text-base-content hover:bg-base-200 rounded-lg transition-colors"
          aria-label="Back to Wiki"
          title="Back to Wiki"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      </div>
    </main>
  );
}
