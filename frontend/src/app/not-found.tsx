import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-base-100 px-6">
      <div className="max-w-3xl mx-auto w-full">
        <p className="t-eyebrow mb-5">Error 404</p>
        <h1 className="t-display text-6xl sm:text-8xl">
          This page <em className="italic text-primary">wandered off.</em>
        </h1>
        <p className="mt-6 text-base-content/65 max-w-md">
          It may have moved or never existed. Try search, or head back home.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex h-11 items-center rounded-full bg-base-content px-6 text-sm font-medium text-base-100 hover:bg-primary transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
