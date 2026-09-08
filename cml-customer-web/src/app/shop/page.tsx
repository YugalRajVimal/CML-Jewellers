import { Suspense } from "react";
import { ShopGrid } from "@/components/shop/ShopGrid";

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopGrid title="Shop All" />
    </Suspense>
  );
}
