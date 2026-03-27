"use client";

import { Megaphone, Clock } from "lucide-react";

interface Promotion {
  id: string;
  store_id: string;
  title: string;
  description: string;
  expires_at?: string;
  badge?: string;
}

interface PromotionBannerProps {
  promotions: Promotion[];
  className?: string;
}

const BADGE_STYLES = {
  "限時": "bg-[var(--lobster-pink)]/25 text-[var(--apricot-cream)] border-[var(--lobster-pink)]/45",
  "學生": "bg-[var(--lilac)]/25 text-[var(--alice-blue)] border-[var(--lilac)]/45", 
  "新開幕": "bg-[var(--muted-olive)]/25 text-[var(--muted-olive)] border-[var(--muted-olive)]/45",
  "default": "bg-[var(--burnt-peach)]/25 text-[var(--apricot-cream)] border-[var(--burnt-peach)]/45"
};

export default function PromotionBanner({ promotions, className = "" }: PromotionBannerProps) {
  if (!promotions || promotions.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {promotions.map((promo) => {
        const badgeStyle = BADGE_STYLES[promo.badge as keyof typeof BADGE_STYLES] || BADGE_STYLES.default;
        
        return (
          <div
            key={promo.id}
            className="relative bg-[var(--jet-black)] border border-[var(--blue-slate)] rounded-xl p-3 overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--lilac)]/30 rounded-full -translate-y-8 translate-x-8 opacity-30" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-[var(--burnt-peach)]/25 rounded-full translate-y-6 -translate-x-6 opacity-20" />
            
            <div className="relative">
              {/* Header with badge and icon */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Megaphone size={16} className="text-[var(--burnt-peach)] flex-shrink-0" />
                  <h4 className="text-sm font-bold text-[var(--platinum)] leading-tight">{promo.title}</h4>
                </div>
                {promo.badge && (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${badgeStyle} flex-shrink-0`}>
                    {promo.badge}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-[var(--lavender)]/85 leading-relaxed mb-2">
                {promo.description}
              </p>

              {/* Footer with expiry info */}
              {promo.expires_at && (
                <div className="flex items-center gap-1 text-xs">
                  <Clock size={11} className="text-[var(--lavender)]/65" />
                  <span className="text-[var(--lavender)]/70">
                    有效期至：
                    {new Date(promo.expires_at).toLocaleDateString("zh-TW")}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
