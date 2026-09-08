import { Suspense } from "react";
import { ShopGrid } from "@/components/shop/ShopGrid";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <ShopGrid title="Search Results" />
    </Suspense>
  );
}
