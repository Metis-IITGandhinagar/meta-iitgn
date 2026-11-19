import Link from "next/link";
import { PageMessage, pagePrimaryAction } from "@/components/helpers/PageMessage";

export default function ArticlePage() {
  return (
    <main className="flex-1 mt-16 overflow-y-auto bg-base-100">
      <PageMessage
        eyebrow="Wiki"
        title="Pick a page to read."
        actions={
          <Link href="/wiki/categories" className={pagePrimaryAction}>
            Browse the wiki
          </Link>
        }
      >
        Open a category to find the page you&apos;re looking for.
      </PageMessage>
    </main>
  );
}
