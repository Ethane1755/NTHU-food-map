"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import type { Promotion, Store } from "@/modules/shared/types";
import { getCategoryEmoji } from "@/modules/shared/lib/utils";

const BADGE_COLORS: Record<string, string> = {
  限時: "bg-[var(--lobster-pink)]/25 text-[var(--apricot-cream)]",
  學生: "bg-[var(--lilac)]/25 text-[var(--alice-blue)]",
  新開幕: "bg-[var(--muted-olive)]/25 text-[var(--muted-olive)]",
};

type PromotionWithStore = Promotion & {
  store: Store | null;
};

export default function PromotionsBanner() {
  const [promotions, setPromotions] = useState<PromotionWithStore[]>([]);

  useEffect(() => {
    let active = true;

    async function loadPromotions() {
      try {
        const response = await fetch("/api/promotions", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { promotions?: PromotionWithStore[] };
        if (!active) return;
        setPromotions(payload.promotions ?? []);
      } catch {
        if (!active) return;
        setPromotions([]);
      }
    }

    loadPromotions();
    return () => {
      active = false;
    };
  }, []);

  if (promotions.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Tag size={15} className="text-[var(--burnt-peach)]" />
        <h2 className="text-sm font-bold text-[var(--alice-blue)]">店家優惠</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {promotions.map((promo) => {
          const store = promo.store;
          if (!store) return null;
          return (
            <div
              key={promo.id}
              className="flex-shrink-0 w-64 bg-[var(--jet-black)] border border-[var(--blue-slate)] rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryEmoji(store.category)}</span>
                  <span className="text-xs font-semibold text-[var(--alice-blue)]">{store.name}</span>
                </div>
                {promo.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      BADGE_COLORS[promo.badge] ?? "bg-[var(--blue-slate)] text-[var(--lavender)]"
                    }`}
                  >
                    {promo.badge}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-[var(--platinum)] mb-1">{promo.title}</p>
              <p className="text-xs text-[var(--lavender)]/85 leading-relaxed">{promo.description}</p>
              {promo.expires_at && (
                <p className="text-[10px] text-[var(--lavender)]/65 mt-2">
                  有效期限：{promo.expires_at}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
