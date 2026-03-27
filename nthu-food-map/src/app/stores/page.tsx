"use client";

import { useEffect, useState } from "react";
import { Search, Star, MapPin, ExternalLink, PlusCircle } from "lucide-react";
import { RandomPicker } from "@/modules/map";
import { PromotionsBanner, useStores } from "@/modules/stores";
import { SubmitStoreModal } from "@/modules/submissions";
import {
  CATEGORIES,
  getCategoryEmoji,
  getPriceLabel,
} from "@/modules/shared";

export default function StoresPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("全部");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const { stores } = useStores();

  useEffect(() => {
    const handlePicker = () => setPickerOpen(true);
    const handleAddStore = () => setSubmitOpen(true);

    window.addEventListener("open-random-picker", handlePicker);
    window.addEventListener("open-add-store", handleAddStore);

    return () => {
      window.removeEventListener("open-random-picker", handlePicker);
      window.removeEventListener("open-add-store", handleAddStore);
    };
  }, []);

  const categories = ["全部", ...CATEGORIES];

  const filtered = stores.filter((store) => {
    const matchSearch =
      store.name.includes(search) ||
      store.category.includes(search) ||
      (store.description ?? "").includes(search);
    const matchCategory =
      activeCategory === "全部" || store.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <main className="min-h-full bg-[var(--jet-black)]">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-[var(--platinum)] sm:text-3xl">
            附近餐廳 ({stores.length})
          </h1>
          <button
            onClick={() => setSubmitOpen(true)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--burnt-peach)]/45 bg-[var(--lobster-pink)]/18 px-3 py-2 text-xs font-semibold text-[var(--apricot-cream)] transition-colors hover:bg-[var(--lobster-pink)]/28 sm:w-auto"
          >
            <PlusCircle size={13} />
            加入未收錄店家
          </button>
        </div>

        {/* Promotions */}
        <PromotionsBanner />

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lavender)]/65"
          />
          <input
            type="text"
            placeholder="搜尋餐廳名稱、類型..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--alice-blue)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[var(--lilac)] text-[var(--platinum)]"
                  : "bg-[var(--jet-black)] text-[var(--lavender)] border border-[var(--blue-slate)] hover:border-[var(--burnt-peach)]/80"
              }`}
            >
              {cat !== "全部" && getCategoryEmoji(cat)} {cat}
            </button>
          ))}
        </div>

        {/* Store list */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length === 0 && (
            <div className="py-16 text-center text-[var(--lavender)]/60 md:col-span-2 xl:col-span-3">
              <p className="text-4xl mb-2">🔍</p>
              <p>找不到符合的餐廳</p>
            </div>
          )}
          {filtered.map((store) => (
            <div
              key={store.id}
              className="overflow-hidden rounded-2xl border border-[var(--blue-slate)] bg-[var(--jet-black)] shadow-[0_12px_28px_rgba(38,42,49,0.32)]"
            >
              <div className="flex h-full flex-col">
                <div className="relative h-40 w-full border-b border-[var(--blue-slate)] bg-[var(--charcoal-blue)]/55 sm:h-44">
                  {store.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.image_url}
                      alt={store.name}
                      loading="lazy"
                      decoding="async"
                      className="block h-full w-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--lavender)]/60">無圖</div>
                  )}
                  <div className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--alice-blue)]/25 bg-[var(--jet-black)]/80 text-3xl backdrop-blur-sm">
                    {getCategoryEmoji(store.category)}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-bold text-[var(--platinum)] truncate">{store.name}</h2>
                    {store.rating && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star size={12} className="text-[var(--apricot-cream)] fill-[var(--apricot-cream)]" />
                        <span className="text-xs font-medium text-[var(--alice-blue)]">{store.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-[var(--lobster-pink)]/22 text-[var(--apricot-cream)] rounded-full font-medium">
                      {store.category}
                    </span>
                    {store.price_range && (
                      <span className="text-xs text-[var(--muted-olive)] font-semibold">
                        {getPriceLabel(store.price_range)}
                      </span>
                    )}
                  </div>
                  {store.description && (
                    <p className="mt-2 text-xs text-[var(--lavender)]/80 line-clamp-3">{store.description}</p>
                  )}

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    {store.address && (
                      <div className="min-w-0 flex items-center gap-1 text-xs text-[var(--lavender)]/60">
                        <MapPin size={11} className="flex-shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--alice-blue)] bg-[var(--lavender)] px-2.5 py-1.5 text-xs font-semibold text-[var(--jet-black)] shadow-[0_4px_12px_rgba(216,222,233,0.35)] hover:brightness-105 sm:ml-auto sm:w-auto"
                    >
                      <ExternalLink size={10} />
                      Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RandomPicker
        stores={stores}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectStore={() => setPickerOpen(false)}
      />
      <SubmitStoreModal isOpen={submitOpen} onClose={() => setSubmitOpen(false)} />
    </main>
  );
}
