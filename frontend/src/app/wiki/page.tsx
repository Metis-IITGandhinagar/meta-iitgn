import Link from "next/link";

export default async function ArticlePage() {
  return (
    <main className="flex-1 p-6 md:p-8 lg:p-12 bg-[#FCFCFD]">
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800">Page Not Found</h1>
        <p className="text-gray-500 mt-2">
          The requested Page could not be found.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Back to Wiki
        </Link>
      </div>
    </main>
  );
}
