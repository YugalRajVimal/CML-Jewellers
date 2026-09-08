import { Suspense } from "react";
import { ShopGrid } from "@/components/shop/ShopGrid";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <Suspense fallback={null}>
      <ShopGrid category={slug} title={title} />
    </Suspense>
  );
}
