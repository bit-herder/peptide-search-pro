import { Shield } from "lucide-react";

interface TrustBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export function TrustBadge({ score, size = "md" }: TrustBadgeProps) {
  const tier =
    score >= 8.5 ? "text-success" : score >= 7 ? "text-accent" : score >= 5.5 ? "text-muted" : "text-danger";

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono ${tier} ${size === "sm" ? "text-xs" : "text-sm"}`}
      title="Computed trust score"
    >
      <Shield className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {score.toFixed(1)}
    </span>
  );
}
