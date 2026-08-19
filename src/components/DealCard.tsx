"use client";

import { ExternalLink } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { DealBadge } from "@/components/DealBadge";
import { TrustBadge } from "@/components/TrustBadge";
import { cn, formatPrice, formatPricePerMg, timeAgo } from "@/lib/utils";
import type { Deal } from "@/lib/deals";

interface DealCardProps {
  deal: Deal;
  className?: string;
}

export function DealCard({ deal, className }: DealCardProps) {
  const { recordAction, isAuthenticated, isGuestLocked } = useAuth();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isAuthenticated) return;

    if (isGuestLocked) {
      e.preventDefault();
      return;
    }

    const allowed = recordAction("outbound_click", String(deal.product_id));
    if (!allowed) {
      e.preventDefault();
    }
  }

  return (
    <a
      href={deal.product_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "glass rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-accent/30 transition-all group",
        className
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0",
            "bg-surface-elevated text-muted"
          )}
        >
          {deal.peptide_label.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
              {deal.name}
            </h3>
            <DealBadge type={deal.deal_type} savingsPct={deal.savingsPct} />
          </div>
          <p className="text-sm text-muted mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{deal.provider_name}</span>
            <TrustBadge score={8.0} size="sm" />
            {deal.dosage_mg > 0 && <span>· {deal.dosage_mg}mg</span>}
          </p>
          {deal.description && (
            <p className="text-xs text-muted/70 mt-1 line-clamp-1">
              {deal.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 shrink-0 pl-14 sm:pl-0">
        <div className="text-right">
          <div className="text-xl font-bold font-mono">
            {formatPrice(deal.price)}
          </div>
          <div className="text-xs text-muted">
            {formatPricePerMg(deal.price_per_mg)}
          </div>
          <div className="text-xs text-muted/60 mt-0.5">
            {timeAgo(deal.scraped_at)}
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" />
      </div>
    </a>
  );
}
