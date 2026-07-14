import CategoryPage from "@/components/CategoryPage";
interface ArticlePageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category } = await params;
  return <CategoryPage categorySlug={category} />;
}