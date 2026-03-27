"use client";

import { useState } from "react";
import { X, CheckCircle, PlusCircle, Loader2, LocateFixed } from "lucide-react";
import { CATEGORIES, getCategoryEmoji } from "@/modules/shared/lib/utils";
import type { Category } from "@/modules/shared/types";

interface SubmitStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM = {
  name: "",
  category: "中式" as Category,
  address: "",
  phone: "",
  description: "",
  lat: null as number | null,
  lng: null as number | null,
};

export default function SubmitStoreModal({ isOpen, onClose }: SubmitStoreModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("目前瀏覽器不支援定位功能");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        let resolvedAddress = `定位座標：${lat}, ${lng}`;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { Accept: "application/json" } }
          );
          if (response.ok) {
            const payload = (await response.json()) as { display_name?: string };
            if (payload.display_name) {
              resolvedAddress = payload.display_name;
            }
          }
        } catch {
          // Keep coordinate fallback text when reverse geocoding fails.
        }

        setForm((f) => ({
          ...f,
          address: resolvedAddress,
          lat,
          lng,
        }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("無法取得目前定位，請確認定位權限");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/store-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          address: form.address.trim(),
          phone: form.phone.trim() || null,
          description: form.description.trim() || null,
          lat: form.lat,
          lng: form.lng,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }

      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? `送出失敗：${e.message}` : "送出失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm(INITIAL_FORM);
    setSubmitted(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-sm bg-[var(--jet-black)] border border-[var(--blue-slate)] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle size={20} className="text-[var(--burnt-peach)]" />
            <h2 className="text-xl font-bold text-[var(--platinum)]">加入未收錄店家</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-[var(--jet-black)] text-[var(--lavender)]/80">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 pb-8 pt-4 flex flex-col items-center gap-3 text-center">
            <CheckCircle size={56} className="text-[var(--muted-olive)]" />
            <h3 className="text-lg font-bold text-[var(--platinum)]">感謝你的回報！</h3>
            <p className="text-sm text-[var(--lavender)]/75">
              我們會盡快審核並將 <span className="font-semibold text-[var(--alice-blue)]">{form.name}</span> 加入地圖。
            </p>
            <button
              onClick={handleClose}
              className="mt-2 w-full py-3 bg-[var(--lobster-pink)] hover:bg-[var(--burnt-peach)] text-[var(--platinum)] font-bold rounded-xl transition-all active:scale-95"
            >
              關閉
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-3">
            {/* Name */}
            <div>
                <label className="text-xs font-semibold text-[var(--lavender)]/80 mb-1 block">
                店家名稱 <span className="text-[var(--lobster-pink)]">*</span>
              </label>
              <input
                type="text"
                placeholder="例：好吃便當店"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--alice-blue)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-[var(--lavender)]/80 mb-1 block">類型</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: cat }))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      form.category === cat
                        ? "bg-[var(--lilac)] text-[var(--platinum)]"
                        : "bg-[var(--jet-black)] text-[var(--lavender)] border border-[var(--blue-slate)] hover:bg-[var(--lobster-pink)]/14 hover:text-[var(--apricot-cream)]"
                    }`}
                  >
                    {getCategoryEmoji(cat)} {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--lavender)]/80 block">
                  地址 <span className="text-[var(--lobster-pink)]">*</span>
                </label>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--alice-blue)] hover:text-[var(--platinum)] disabled:text-[var(--lavender)]/45"
                >
                  <LocateFixed size={12} />
                  {locating ? "定位中" : "使用當前定位"}
                </button>
              </div>
              <input
                type="text"
                placeholder="例：光復路二段101號"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value, lat: null, lng: null }))}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--alice-blue)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-[var(--lavender)]/80 mb-1 block">電話（選填）</label>
              <input
                type="tel"
                placeholder="例：03-5731234"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--alice-blue)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-[var(--lavender)]/80 mb-1 block">簡介（選填）</label>
              <textarea
                placeholder="簡單介紹這家店..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--alice-blue)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70 resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-[var(--lobster-pink)] text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={!form.name.trim() || !form.address.trim() || loading}
              className="w-full py-3 bg-[var(--lobster-pink)] hover:bg-[var(--burnt-peach)] disabled:bg-[var(--blue-slate)] text-[var(--platinum)] font-bold rounded-xl transition-all active:scale-95 mt-1 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "送出中..." : "送出申請"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
