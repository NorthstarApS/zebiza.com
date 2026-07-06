import ProductCard from "./ProductCard";
import type { WCProduct } from "@/types/woocommerce";
import { cn } from "@/lib/utils";

function CardSkeleton() {
  return (
    <div className="border border-border bg-card">
      <div className="aspect-square skeleton" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/3 skeleton" />
        <div className="h-4 w-3/4 skeleton" />
        <div className="h-4 w-1/2 skeleton" />
        <div className="h-9 w-full skeleton" />
      </div>
    </div>
  );
}

interface Props {
  products?: WCProduct[];
  isLoading?: boolean;
  columns?: "grid-4" | "grid-5";
  skeletonCount?: number;
}

export default function ProductGrid({
  products,
  isLoading,
  columns = "grid-4",
  skeletonCount = 8,
}: Props) {
  const cols =
    columns === "grid-5"
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={cn("grid gap-3 sm:gap-4", cols)}>
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, i) => <CardSkeleton key={i} />)
        : products?.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
