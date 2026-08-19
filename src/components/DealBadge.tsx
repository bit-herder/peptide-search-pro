import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/deals";

export type DealType = Deal["deal_type"];

interface DealBadgeProps {
  type: DealType;
  savingsPct?: number;
  className?: string;
}

const badgeConfig: Record<
  DealType,
  { label: string; className: string }
> = {
  best_value: {
    label: "Best Value",
    className: "bg-success/20 text-success",
  },
  price_drop: {
    label: "Price Drop",
    className: "bg-warning/20 text-warning",
  },
  bulk_discount: {
    label: "Bulk Deal",
    className: "bg-accent/20 text-accent",
  },
  free_shipping: {
    label: "Free Shipping",
    className: "bg-accent/20 text-accent",
  },
  trusted_lowest: {
    label: "Deal",
    className: "bg-purple-500/20 text-purple-300",
  },
};

export function DealBadge({ type, savingsPct, className }: DealBadgeProps) {
  const config = badgeConfig[type] ?? badgeConfig.best_value;
  const suffix =
    savingsPct !== undefined && type !== "free_shipping"
      ? type === "price_drop"
        ? ` ${savingsPct}% \u2193`
        : ` ${savingsPct}%`
      : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium",
        config.className,
        className
      )}
    >
      {config.label}
      {suffix}
    </span>
  );
}
