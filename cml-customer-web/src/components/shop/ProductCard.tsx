// The storefront has a single ProductCard implementation (BUG-08): components/ProductCard.tsx.
// This re-export only keeps the old "./ProductCard" import in ShopGrid working — you can delete this
// file if you change that import to "@/components/ProductCard".
export { ProductCard } from "@/components/ProductCard";