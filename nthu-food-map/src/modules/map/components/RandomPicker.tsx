"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Shuffle, X, Navigation, SlidersHorizontal, LocateFixed, ChevronUp, ChevronDown } from "lucide-react";
import { Star } from "lucide-react";
import type { Store } from "@/modules/shared/types";
import {
  getCategoryEmoji,
  getPriceLabel,
  CATEGORIES,
  haversineDistance,
  isStoreOpenNow,
} from "@/modules/shared/lib/utils";

const NTHU_LAT = 24.7963;
const NTHU_LNG = 120.9964;

const BUDGET_OPTIONS = [
  { label: "無限制", value: 0 },
  { label: "$ ≤80元", value: 1 },
  { label: "$$ ≤150元", value: 2 },
  { label: "$$$ 150元+", value: 3 },
];

const DISTANCE_OPTIONS = [
  { label: "無限制", value: 0 },
  { label: "500m 以內", value: 500 },
  { label: "1km 以內", value: 1000 },
];

const PEOPLE_OPTIONS = [
  { label: "無限制", value: 0 },
  { label: "1人", value: 1 },
  { label: "2–4人", value: 4 },
  { label: "5人以上", value: 5 },
];

interface RandomPickerProps {
  stores: Store[];
  isOpen: boolean;
  onClose: () => void;
  onSelectStore?: (store: Store) => void;
}

export default function RandomPicker({
  stores,
  isOpen,
  onClose,
  onSelectStore,
}: RandomPickerProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [displayStore, setDisplayStore] = useState<Store | null>(null);
  const [picked, setPicked] = useState<Store | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filterCategory, setFilterCategory] = useState<string>("全部");
  const [filterBudget, setFilterBudget] = useState(0);
  const [filterDistance, setFilterDistance] = useState(0);
  const [radiusMeters, setRadiusMeters] = useState(300);
  const [filterPeople, setFilterPeople] = useState(0);
  const [onlyOpenNow, setOnlyOpenNow] = useState(true);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAttemptedLocateRef = useRef(false);

  const storesCenter = useMemo(() => {
    if (stores.length === 0) return { lat: NTHU_LAT, lng: NTHU_LNG };
    const { latSum, lngSum } = stores.reduce(
      (acc, store) => ({ latSum: acc.latSum + store.lat, lngSum: acc.lngSum + store.lng }),
      { latSum: 0, lngSum: 0 }
    );
    return {
      lat: latSum / stores.length,
      lng: lngSum / stores.length,
    };
  }, [stores]);

  const isUserLocationOutOfRange =
    userLocation !== null &&
    haversineDistance(userLocation.lat, userLocation.lng, storesCenter.lat, storesCenter.lng) > 20000;

  const distanceCenter = isUserLocationOutOfRange
    ? { lat: NTHU_LAT, lng: NTHU_LNG }
    : userLocation ?? { lat: NTHU_LAT, lng: NTHU_LNG };

  const effectiveDistance = filterDistance > 0 ? filterDistance : Math.max(0, radiusMeters);

  function requestUserLocation() {
    if (!navigator.geolocation) {
      setLocationError("目前瀏覽器不支援定位功能");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError("無法取得定位，將改用清大中心點");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const filteredStores = stores.filter((s) => {
    if (filterCategory !== "全部" && s.category !== filterCategory) return false;
    if (filterBudget > 0 && (s.price_range ?? 1) > filterBudget) return false;
    if (effectiveDistance > 0) {
      const dist = haversineDistance(distanceCenter.lat, distanceCenter.lng, s.lat, s.lng);
      if (dist > effectiveDistance) return false;
    }
    if (filterPeople === 5 && (s.category === "飲料" || s.category === "小吃")) return false;
    if (onlyOpenNow && isStoreOpenNow(s.hours) === false) return false;
    return true;
  });

  useEffect(() => {
    if (isOpen) return;

    const resetTimer = setTimeout(() => {
      setPicked(null);
      setDisplayStore(null);
      setIsPicking(false);
    }, 0);

    return () => clearTimeout(resetTimer);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || hasAttemptedLocateRef.current) return;
    hasAttemptedLocateRef.current = true;

    const locateTimer = setTimeout(() => {
      requestUserLocation();
    }, 0);

    return () => clearTimeout(locateTimer);
  }, [isOpen]);

  function startPicking() {
    if (filteredStores.length === 0) return;
    setPicked(null);
    setIsPicking(true);
    setShowFilters(false);

    let speed = 50;
    let elapsed = 0;
    const total = 800;

    function runCycle() {
      if (elapsed >= total) {
        const winner = filteredStores[Math.floor(Math.random() * filteredStores.length)];
        setDisplayStore(winner);
        setPicked(winner);
        setIsPicking(false);
        return;
      }
      setDisplayStore(filteredStores[Math.floor(Math.random() * filteredStores.length)]);
      elapsed += speed;
      speed = Math.min(speed * 1.1, 350);
      timeoutRef.current = setTimeout(runCycle, speed);
    }

    runCycle();
  }

  if (!isOpen) return null;

  const activeFilterCount = [
    filterCategory !== "全部",
    filterBudget > 0,
    filterDistance > 0,
    filterPeople > 0,
    onlyOpenNow,
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[var(--jet-black)] border border-[var(--blue-slate)] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--platinum)]">隨機選餐廳</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              disabled={isPicking}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isPicking ? "opacity-50 cursor-not-allowed" : ""
              } ${
                showFilters || activeFilterCount > 0
                    ? "bg-[var(--lobster-pink)]/24 text-[var(--apricot-cream)]"
                    : "bg-[var(--jet-black)] text-[var(--lavender)] hover:bg-[var(--blue-slate)]"
              }`}
            >
              <SlidersHorizontal size={14} />
              條件
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--lobster-pink)] text-[var(--platinum)] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--jet-black)] text-[var(--lavender)]/80">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Filter panel */}
          {showFilters && (
            <div className="mb-3 p-4 bg-[var(--jet-black)] border border-[var(--blue-slate)] rounded-2xl flex flex-col gap-4">
            {/* 偏好 */}
            <div>
              <p className="text-xs font-semibold text-[var(--lavender)]/75 mb-2">偏好類型</p>
              <div className="flex flex-wrap gap-1.5">
                {["全部", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterCategory === cat
                        ? "bg-[var(--lobster-pink)] text-[var(--platinum)] border border-[var(--lobster-pink)] border-opacity-60 scale-[1.02] drop-shadow-sm"
                        : "bg-[var(--jet-black)] border border-[var(--blue-slate)] text-[var(--lavender)] hover:border-[var(--burnt-peach)]"
                    }`}
                  >
                    {cat !== "全部" && getCategoryEmoji(cat)} {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 預算 */}
            <div>
              <p className="text-xs font-semibold text-[var(--lavender)]/75 mb-2">預算上限</p>
              <div className="flex gap-1.5 flex-wrap">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterBudget(opt.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterBudget === opt.value
                        ? "bg-[var(--lobster-pink)] text-[var(--platinum)] border border-[var(--lobster-pink)] border-opacity-60 scale-[1.02] drop-shadow-sm"
                        : "bg-[var(--jet-black)] border border-[var(--blue-slate)] text-[var(--lavender)] hover:border-[var(--burnt-peach)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 距離 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[var(--lavender)]/75">
                  距離（{isUserLocationOutOfRange ? "清大中心（定位超出20km）" : userLocation ? "目前定位" : "清大中心"}）
                </p>
                <button
                  type="button"
                  onClick={requestUserLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--alice-blue)] hover:text-[var(--platinum)] disabled:text-[var(--lavender)]/45"
                >
                  <LocateFixed size={12} />
                  {isLocating ? "定位中" : "使用定位"}
                </button>
              </div>
              <div className="flex gap-1.5">
                {DISTANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterDistance(opt.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterDistance === opt.value
                        ? "bg-[var(--lobster-pink)] text-[var(--platinum)] border border-[var(--lobster-pink)] border-opacity-60 scale-[1.02] drop-shadow-sm"
                        : "bg-[var(--jet-black)] border border-[var(--blue-slate)] text-[var(--lavender)] hover:border-[var(--burnt-peach)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {locationError && <p className="mt-1 text-[11px] text-[var(--lobster-pink)]">{locationError}</p>}
              {isUserLocationOutOfRange && (
                <p className="mt-1 text-[11px] text-[var(--burnt-peach)]">定位距離店家群中心超過 20km，已改用清大中心抽選。</p>
              )}
            </div>

            {/* 人數 */}
            <div>
              <p className="text-xs font-semibold text-[var(--lavender)]/75 mb-2">用餐人數</p>
              <div className="flex gap-1.5">
                {PEOPLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterPeople(opt.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterPeople === opt.value
                        ? "bg-[var(--lobster-pink)] text-[var(--platinum)] border border-[var(--lobster-pink)] border-opacity-60 scale-[1.02] drop-shadow-sm"
                        : "bg-[var(--jet-black)] border border-[var(--blue-slate)] text-[var(--lavender)] hover:border-[var(--burnt-peach)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 營業狀態 */}
            <div>
              <p className="text-xs font-semibold text-[var(--lavender)]/75 mb-2">營業中篩選</p>
              <button
                type="button"
                onClick={() => setOnlyOpenNow((v) => !v)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  onlyOpenNow
                    ? "bg-[var(--muted-olive)] text-[var(--jet-black)] border border-[var(--muted-olive)] border-opacity-60 scale-[1.02] drop-shadow-sm"
                    : "bg-[var(--jet-black)] border border-[var(--blue-slate)] text-[var(--lavender)] hover:border-[var(--muted-olive)]"
                }`}
              >
                {onlyOpenNow ? "僅營業中" : "包含休息中"}
              </button>
            </div>

            <p className="text-xs text-[var(--lavender)]/60">
              符合條件：{filteredStores.length} 間餐廳
            </p>
            </div>
          )}

          {/* Slot display */}
          <div className="mb-4">
          <div
            className={`relative flex flex-col items-center justify-center min-h-[180px] rounded-2xl border-2 transition-all duration-200 ${
              isPicking
                ? "border-[var(--burnt-peach)] bg-[var(--burnt-peach)]/14"
                : picked
                ? "border-[var(--muted-olive)] bg-[var(--muted-olive)]/14"
                : "border-dashed border-[var(--blue-slate)] bg-[var(--jet-black)]"
            }`}
          >
            {!displayStore && !isPicking && (
              <div className="text-center text-[var(--lavender)]/60">
                <Shuffle size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {filteredStores.length === 0
                    ? "沒有符合條件的餐廳"
                    : "按下按鈕開始抽選"}
                </p>
              </div>
            )}

            {displayStore && (
              <div
                className={`text-center px-4 transition-all duration-100 ${
                  isPicking ? "scale-95 opacity-80" : "scale-100 opacity-100"
                }`}
              >
                <div className="text-6xl mb-3">{getCategoryEmoji(displayStore.category)}</div>
                <h3 className={`text-2xl font-bold mb-1 ${picked ? "text-[var(--muted-olive)]" : "text-[var(--platinum)]"}`}>
                  {displayStore.name}
                </h3>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-[var(--lobster-pink)]/24 text-[var(--apricot-cream)] rounded-full font-medium">
                    {displayStore.category}
                  </span>
                  {displayStore.price_range && (
                    <span className="text-xs text-[var(--muted-olive)] font-semibold">
                      {getPriceLabel(displayStore.price_range)}
                    </span>
                  )}
                  {displayStore.rating && (
                    <span className="flex items-center gap-0.5 text-xs text-[var(--alice-blue)]">
                      <Star size={11} className="text-[var(--apricot-cream)] fill-[var(--apricot-cream)]" />
                      {displayStore.rating}
                    </span>
                  )}
                </div>
                {picked && displayStore.description && (
                  <p className="mt-2 text-xs text-[var(--lavender)]/75 leading-relaxed">{displayStore.description}</p>
                )}
                {picked && (
                  <p className={`mt-1 text-xs font-semibold ${isStoreOpenNow(displayStore.hours) ? "text-[var(--muted-olive)]" : "text-[var(--lavender)]/60"}`}>
                    {isStoreOpenNow(displayStore.hours) ? "目前營業中" : "目前休息中"}
                  </p>
                )}
              </div>
            )}

            {picked && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[var(--muted-olive)] text-[var(--jet-black)] border border-[var(--muted-olive)] border-opacity-60 scale-[1.02] drop-shadow-sm text-xs font-bold px-3 py-1 rounded-full shadow">
                  就決定是你了！
                </span>
              </div>
            )}
          </div>
          </div>

          {/* Actions */}
          <div className="p-3 rounded-2xl border border-[var(--blue-slate)] bg-[var(--jet-black)] flex flex-col gap-2">
          <button
            onClick={startPicking}
            disabled={isPicking || filteredStores.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--lobster-pink)] hover:bg-[var(--burnt-peach)] disabled:bg-[var(--blue-slate)] text-[var(--platinum)] font-bold rounded-xl transition-all active:scale-95"
          >
            <Shuffle size={18} className={isPicking ? "animate-spin" : ""} />
            {isPicking ? "抽選中..." : picked ? "再抽一次" : "開始抽選！"}
          </button>

          <div className="rounded-xl border border-[var(--blue-slate)] bg-[var(--charcoal-blue)]/20 px-3 py-3">
            <label className="block text-[12px] font-semibold text-[var(--alice-blue)] mb-2">
              依定位抽選半徑（公尺）
            </label>
            <div className="flex items-center gap-2 overflow-hidden">
              <button
                type="button"
                onClick={() => setRadiusMeters((v) => Math.max(0, v - 50))}
                className="h-14 w-14 shrink-0 rounded-xl bg-[var(--jet-black)] hover:bg-[var(--blue-slate)] border border-[var(--blue-slate)] text-[var(--alice-blue)] flex items-center justify-center"
                aria-label="減少半徑"
              >
                <ChevronDown size={24} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={5000}
                step={50}
                value={radiusMeters}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isNaN(next)) {
                    setRadiusMeters(0);
                    return;
                  }
                  setRadiusMeters(Math.min(5000, Math.max(0, Math.round(next))));
                }}
                className="h-14 min-w-0 w-0 flex-1 text-center text-xl font-bold rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--platinum)] placeholder:text-[var(--lavender)]/55 focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70 [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="300"
              />
              <button
                type="button"
                onClick={() => setRadiusMeters((v) => v + 50)}
                className="h-14 w-14 shrink-0 rounded-xl bg-[var(--jet-black)] hover:bg-[var(--blue-slate)] border border-[var(--blue-slate)] text-[var(--alice-blue)] flex items-center justify-center"
                aria-label="增加半徑"
              >
                <ChevronUp size={24} />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[var(--lavender)]/65">每次調整 50m，以上下按鈕為主要操作。</p>
          </div>

          {picked && onSelectStore && (
            <button
              onClick={() => { onSelectStore(picked); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--jet-black)] hover:bg-[var(--blue-slate)] text-[var(--alice-blue)] font-semibold rounded-xl transition-all active:scale-95"
            >
              <Navigation size={16} />
              在地圖上查看
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
