"use client";

import { useState, useEffect, useRef } from "react";
import { X, MapPin, ExternalLink, MessageCircle, Send, Menu, Clock, UtensilsCrossed } from "lucide-react";
import {
  getCategoryEmoji,
  getCurrentWeekdayZh,
  getPriceLabel,
  getStoreImageSrc,
  isStoreOpenNow,
  parseStoreOpeningHours,
  WEEK_DAYS_ZH,
} from "@/modules/shared/lib/utils";
import PromotionBanner from "./PromotionBanner";
import type { Promotion, Store } from "@/modules/shared/types";

interface LocalComment {
  id: string;
  author: string;
  store_id: string;
  text: string;
  rating: number;
  created_at: string;
}

interface StoreCardProps {
  store: Store;
  onClose?: () => void;
  className?: string;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="star-plain text-xl leading-none transition-transform hover:scale-110"
        >
          <span
            className={`text-base ${n <= (hovered || value) ? "text-[var(--apricot-cream)]" : "text-[var(--lavender)]/45"}`}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

export default function StoreCard({ store, onClose, className = "" }: StoreCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);
  const [failedImageKeys, setFailedImageKeys] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [storePromotions, setStorePromotions] = useState<Promotion[]>([]);
  const [newText, setNewText] = useState("");
  const [newRating, setNewRating] = useState(5);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;
  const openNow = isStoreOpenNow(store.hours);
  const parsedHours = parseStoreOpeningHours(store.hours);
  const now = new Date();
  const todayDay = getCurrentWeekdayZh(now);
  const todaySlots = parsedHours[todayDay] ?? [];
  const hasOpeningHours = WEEK_DAYS_ZH.some((day) => (parsedHours[day] ?? []).length > 0);
  const todayHoursText = todaySlots.length > 0 ? todaySlots.map((slot) => slot.label).join("、") : "今日休息";
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const currentTimeDotLeft = Math.max(0, Math.min(100, (currentMinute / (24 * 60)) * 100));
  const imageKey = `${store.id}:${store.image_url ?? ""}`;
  const imageSrc = getStoreImageSrc(store.image_url);
  const showImage = Boolean(imageSrc) && !failedImageKeys[imageKey];
  const firstComment = comments[0] ?? null;

  const getDaySegments = (day: (typeof WEEK_DAYS_ZH)[number]) => {
    const index = WEEK_DAYS_ZH.indexOf(day);
    const prevDay = WEEK_DAYS_ZH[(index + 6) % 7];
    const currentDaySlots = parsedHours[day] ?? [];
    const prevDaySlots = parsedHours[prevDay] ?? [];

    const carryOverSegments = prevDaySlots
      .filter((slot) => slot.endMinute > 24 * 60)
      .map((slot) => ({ start: 0, end: Math.min(24 * 60, slot.endMinute - 24 * 60) }))
      .filter((seg) => seg.end > seg.start);

    const sameDaySegments = currentDaySlots
      .map((slot) => ({
        start: Math.max(0, Math.min(24 * 60, slot.startMinute)),
        end: Math.max(0, Math.min(24 * 60, slot.endMinute)),
      }))
      .filter((seg) => seg.end > seg.start);

    return [...carryOverSegments, ...sameDaySegments];
  };

  async function submitComment() {
    if (!newText.trim()) return;

    setCommentSubmitting(true);
    setCommentsError(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          text: newText.trim(),
          rating: newRating,
          author: "我",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }

      const payload = (await response.json()) as { comment?: LocalComment };
      const createdComment = payload.comment;
      if (createdComment) {
        setComments((prev) => [createdComment, ...prev]);
      }
      setNewText("");
      setNewRating(5);
    } catch (e) {
      setCommentsError(e instanceof Error ? `送出評論失敗：${e.message}` : "送出評論失敗");
    } finally {
      setCommentSubmitting(false);
    }
  }

  const avgRating =
    comments.length > 0
      ? (comments.reduce((s, c) => s + c.rating, 0) / comments.length).toFixed(1)
      : store.rating?.toFixed(1);

  useEffect(() => {
    let active = true;

    async function loadStorePromotions() {
      try {
        const response = await fetch(`/api/promotions?store_id=${encodeURIComponent(store.id)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { promotions?: Promotion[] };
        if (!active) return;
        setStorePromotions(payload.promotions ?? []);
      } catch {
        if (!active) return;
        setStorePromotions([]);
      }
    }

    loadStorePromotions();

    return () => {
      active = false;
    };
  }, [store.id]);

  useEffect(() => {
    let active = true;

    async function loadComments() {
      setCommentsLoading(true);
      setCommentsError(null);

      try {
        const response = await fetch(`/api/comments?store_id=${encodeURIComponent(store.id)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? `HTTP ${response.status}`);
        }

        const payload = (await response.json()) as { comments?: LocalComment[] };
        if (!active) return;
        setComments(payload.comments ?? []);
      } catch (e) {
        if (!active) return;
        setComments([]);
        setCommentsError(e instanceof Error ? `載入評論失敗：${e.message}` : "載入評論失敗");
      } finally {
        if (!active) return;
        setCommentsLoading(false);
      }
    }

    loadComments();

    return () => {
      active = false;
    };
  }, [store.id]);

  useEffect(() => {
    if (!showComments) return;
    const timer = setTimeout(() => commentInputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [showComments]);

  return (
    <div className={`bg-[var(--jet-black)]/82 backdrop-blur-md border border-[var(--blue-slate)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden ${className}`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryEmoji(store.category)}</span>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--platinum)] truncate">{store.name}</h2>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2.5 py-0.5 text-xs font-medium bg-[var(--lobster-pink)]/22 text-[var(--apricot-cream)] rounded-full">
                    {store.category}
                  </span>
                  {store.price_range && (
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-[var(--muted-olive)]/22 text-[var(--muted-olive)] rounded-full">
                      {getPriceLabel(store.price_range)}
                    </span>
                  )}
                  {openNow !== undefined && (
                    <span
                      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        openNow ? "bg-[var(--muted-olive)]/22 text-[var(--muted-olive)]" : "bg-[var(--blue-slate)]/70 text-[var(--lavender)]/80"
                      }`}
                    >
                      {openNow ? "營業中" : "休息中"}
                    </span>
                  )}
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-[var(--jet-black)] text-[var(--lavender)]/75 transition-colors flex-shrink-0"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="mt-2.5 flex gap-2 flex-wrap">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--lavender)] text-[var(--jet-black)] border border-[var(--alice-blue)] text-xs font-semibold rounded-full shadow-[0_4px_12px_rgba(216,222,233,0.35)] hover:brightness-105"
              >
                <ExternalLink size={12} />
                Google Maps
              </a>
              <button
                onClick={() => setShowComments((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  showComments
                    ? "bg-[var(--lobster-pink)]/24 text-[var(--apricot-cream)]"
                    : "bg-[var(--jet-black)] hover:bg-[var(--blue-slate)] text-[var(--lavender)]"
                }`}
              >
                <MessageCircle size={12} />
                評論
              </button>
            </div>

            {store.description && (
              <p className="mt-3 text-sm text-[var(--lavender)]/85 leading-relaxed">{store.description}</p>
            )}

              {firstComment && (
                <div className="mt-3 rounded-xl border border-[var(--blue-slate)]/70 bg-[var(--charcoal-blue)]/55 px-3 py-2">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--lavender)]/70">
                    <span>最新評論</span>
                    <span className="text-[var(--alice-blue)]">{firstComment.author}</span>
                    <span className="text-[var(--apricot-cream)]">★ {firstComment.rating}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--alice-blue)] line-clamp-2">{firstComment.text}</p>
                </div>
              )}
          </div>

          <div className="w-28 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden border border-[var(--blue-slate)] bg-[var(--jet-black)] flex-shrink-0">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt={store.name}
                loading="lazy"
                decoding="async"
                className="block w-full h-full object-cover object-center"
                onError={() => setFailedImageKeys((prev) => ({ ...prev, [imageKey]: true }))}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--charcoal-blue)] via-[var(--charcoal-blue-2)] to-[var(--jet-black)] flex items-center justify-center text-[var(--burnt-peach)]">
                <UtensilsCrossed size={18} />
              </div>
            )}
          </div>
        </div>

        {/* Promotions */}
        {storePromotions.length > 0 && (
          <div className="mt-3">
            <PromotionBanner promotions={storePromotions} />
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--lavender)]/75">
          <div className="flex items-center gap-4 flex-wrap">
            {avgRating && (
              <div className="flex items-center gap-x-1.5">
                <span className="text-[13px] text-[var(--apricot-cream)] leading-none">★</span>
                <span className="font-medium text-[var(--alice-blue)]">{avgRating}</span>
                {comments.length > 0 && (
                  <span className="text-[var(--lavender)]/60 text-xs">({comments.length}則)</span>
                )}
              </div>
            )}
            {store.address && (
              <div className="flex items-center gap-x-1.5">
                <MapPin size={14} className="text-[var(--burnt-peach)]" />
                <span>{store.address}</span>
              </div>
            )}
          </div>
          {store.hours && (
            <div className="flex items-center gap-x-1.5 text-[var(--alice-blue)]">
              <Clock size={14} />
              <span className="text-xs font-medium">營業資訊</span>
            </div>
          )}
        </div>

        {store.hours && hasOpeningHours && (
          <div className="mt-3 rounded-xl border border-[var(--blue-slate)] p-3 bg-[var(--jet-black)]">
            <div className="flex items-center justify-between mb-2 gap-3">
              <p className="text-xs font-semibold text-[var(--alice-blue)] truncate">
                今日營業時間：<span className="text-[var(--apricot-cream)]">{todayHoursText}</span>
              </p>
              <button
                type="button"
                onClick={() => setShowAllHours((v) => !v)}
                className="solid-light-btn shrink-0 px-2 py-1 rounded-md text-[11px] font-semibold text-[var(--alice-blue)] bg-[var(--jet-black)] hover:bg-[var(--blue-slate)]"
              >
                {showAllHours ? "收合" : "展開"}
              </button>
            </div>
            <div className="flex items-center justify-between mb-2">
              {openNow !== undefined && (
                <p className={`text-[11px] font-semibold ${openNow ? "text-[var(--muted-olive)]" : "text-[var(--lavender)]/60"}`}>
                  {openNow ? "目前營業中" : "目前休息中"}
                </p>
              )}
            </div>
            <div
              className={`grid transition-all duration-300 ease-out ${
                showAllHours ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
            <div className="grid grid-cols-[40px_1fr] items-center gap-2 text-[10px] text-[var(--lavender)]/60 mb-1.5">
              <span />
              <div className="flex justify-between px-0.5">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {WEEK_DAYS_ZH.map((day) => {
                const segments = getDaySegments(day);
                return (
                  <div key={day} className="grid grid-cols-[40px_1fr] items-center gap-2 text-[11px]">
                    <span className={`font-medium ${day === todayDay ? "text-[#a3be8c]" : "text-[var(--lavender)]/60"}`}>
                      {day.slice(2)}
                    </span>
                    <div className="relative h-2 rounded-full bg-[var(--blue-slate)]/55 overflow-hidden">
                      {segments.map((segment, idx) => {
                        const left = Math.max(0, Math.min(100, (segment.start / (24 * 60)) * 100));
                        const width = Math.max(
                          1,
                          Math.min(100, ((segment.end - segment.start) / (24 * 60)) * 100)
                        );
                        return (
                          <div
                            key={`${day}-${idx}`}
                            title={`${day} ${Math.floor(segment.start / 60)
                              .toString()
                              .padStart(2, "0")}:${(segment.start % 60)
                              .toString()
                              .padStart(2, "0")}-${Math.floor(segment.end / 60)
                              .toString()
                              .padStart(2, "0")}:${(segment.end % 60)
                              .toString()
                              .padStart(2, "0")}`}
                            className={`absolute top-0 h-full rounded-full ${
                              day === todayDay ? "bg-[#a3be8c]" : "bg-[#bf616a]"
                            }`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                          />
                        );
                      })}
                      {day === todayDay && (
                        <span
                          className="absolute w-2 h-2 rounded-full bg-[#ffffff] border border-[#ffffff] shadow-[0_0_0_2px_rgba(255,255,255,0.35)]"
                          style={{ top: "50%", left: `${currentTimeDotLeft}%`, transform: "translate(-50%, -50%)" }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2 flex-wrap items-center">
          {store.menu_items && store.menu_items.length > 0 && (
            <button
              onClick={() => setShowMenu((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                showMenu
                  ? "bg-[var(--muted-olive)]/22 text-[var(--muted-olive)]"
                    : "bg-[var(--jet-black)] hover:bg-[var(--blue-slate)] text-[var(--lavender)]"
              }`}
            >
              <Menu size={12} />
              菜單 ({store.menu_items.length})
            </button>
          )}
          {comments.length === 0 && (
            <button
              type="button"
              onClick={() => setShowComments(true)}
              className="no-outline-btn text-xs text-[var(--lavender)]/70 py-1 hover:text-[var(--alice-blue)] transition-colors"
            >
              目前還沒有評價，點我發表第一則評論
            </button>
          )}
        </div>
      </div>

      {/* Menu section */}
      {showMenu && store.menu_items && (
        <div className="border-t border-[var(--blue-slate)] px-5 pb-4 pt-3 bg-[var(--jet-black)]">
          <h3 className="text-sm font-semibold text-[var(--alice-blue)] mb-3 flex items-center gap-2">
            <Menu size={14} />
            菜單
          </h3>
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {store.menu_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-[var(--blue-slate)]/65 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--alice-blue)]">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-[var(--lavender)]/75 mt-0.5">{item.description}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-[var(--burnt-peach)] ml-3">
                  NT${item.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-[var(--blue-slate)] px-5 pb-4 pt-3 bg-[var(--jet-black)] flex flex-col gap-3 max-h-64 overflow-y-auto">
          {/* Add comment */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StarInput value={newRating} onChange={setNewRating} />
              <span className="text-xs text-[var(--lavender)]/75">評分</span>
            </div>
            <div className="flex gap-2">
              <input
                ref={commentInputRef}
                type="text"
                placeholder="寫下你的評論..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-sm text-[var(--alice-blue)] placeholder:text-[var(--lavender)]/55 focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70"
              />
              <button
                onClick={submitComment}
                disabled={!newText.trim() || commentSubmitting}
                className="px-3 py-2 bg-[var(--lobster-pink)] hover:bg-[var(--burnt-peach)] disabled:bg-[var(--blue-slate)] disabled:text-[var(--lavender)]/60 text-[var(--platinum)] rounded-xl transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
            {commentsError && <p className="text-xs text-[var(--lobster-pink)]">{commentsError}</p>}
          </div>

          {/* Comment list */}
          {commentsLoading && (
            <p className="text-xs text-[var(--lavender)]/60 text-center py-2">評論載入中...</p>
          )}
          {comments.length === 0 && (
            <p className="text-xs text-[var(--lavender)]/60 text-center py-2">還沒有評論，第一個留言吧！</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--alice-blue)]">{c.author}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`text-[11px] leading-none ${n <= c.rating ? "text-[var(--apricot-cream)]" : "text-[var(--lavender)]/45"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs text-[var(--lavender)]/60 ml-auto">{new Date(c.created_at).toLocaleDateString("zh-TW")}</span>
              </div>
              <p className="text-xs text-[var(--lavender)]/85">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
