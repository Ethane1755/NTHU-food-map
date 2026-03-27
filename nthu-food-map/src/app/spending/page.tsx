"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, Wallet, TrendingUp, Calendar, Trash2, BarChart2, List, Trophy, Utensils, Zap } from "lucide-react";
import { RandomPicker } from "@/modules/map";
import { useStores } from "@/modules/stores";
import { getCategoryEmoji } from "@/modules/shared";

interface LocalSpend {
  id: string;
  store_id: string;
  custom_name?: string;
  amount: number;
  visited_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  中式: "bg-red-400",
  早餐: "bg-yellow-400",
  飲料: "bg-blue-400",
  速食: "bg-orange-400",
  日式: "bg-pink-400",
  便當: "bg-green-400",
  小吃: "bg-purple-400",
  其他: "bg-gray-400",
};

export default function SpendingPage() {
  const { stores } = useStores();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<"records" | "analysis">("records");
  const [spends, setSpends] = useState<LocalSpend[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formStoreId, setFormStoreId] = useState<string>("");
  const [formCustomName, setFormCustomName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const handlePicker = () => setPickerOpen(true);
    window.addEventListener("open-random-picker", handlePicker);
    return () => {
      window.removeEventListener("open-random-picker", handlePicker);
    };
  }, []);

  const selectedFormStoreId = formStoreId || stores[0]?.id || "other";

  const getStoreInfo = useCallback((spend: LocalSpend) => {
    if (spend.store_id === "other") {
      return { name: spend.custom_name ?? "其他", category: "其他", emoji: "🍽️" };
    }
    const store = stores.find((s) => s.id === spend.store_id);
    return store
      ? { name: store.name, category: store.category, emoji: getCategoryEmoji(store.category) }
      : { name: "未知店家", category: "其他", emoji: "🍽️" };
  }, [stores]);

  const now = new Date();
  const thisMonthSpends = spends.filter((s) => new Date(s.visited_at).getMonth() === now.getMonth());
  const total = spends.reduce((sum, s) => sum + s.amount, 0);
  const thisMonth = thisMonthSpends.reduce((sum, s) => sum + s.amount, 0);
  const avgPerMeal = spends.length > 0 ? Math.round(total / spends.length) : 0;
  const maxSpend = spends.reduce((max, s) => (s.amount > max.amount ? s : max), spends[0]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    spends.forEach((s) => {
      const { category } = getStoreInfo(s);
      map[category] = (map[category] ?? 0) + s.amount;
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount, pct: Math.round((amount / total) * 100) }))
      .sort((a, b) => b.amount - a.amount);
  }, [spends, total, getStoreInfo]);

  // Most visited store
  const visitCounts = useMemo(() => {
    const map: Record<string, number> = {};
    spends.forEach((s) => {
      const key = s.store_id === "other" ? `other:${s.custom_name}` : s.store_id;
      map[key] = (map[key] ?? 0) + 1;
    });
    const topKey = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    if (!topKey) return null;
    const [key, count] = topKey;
    const dummySpend: LocalSpend = { id: "", store_id: key.startsWith("other:") ? "other" : key, custom_name: key.startsWith("other:") ? key.slice(6) : undefined, amount: 0, visited_at: "" };
    return { ...getStoreInfo(dummySpend), count };
  }, [spends, getStoreInfo]);

  function addSpend() {
    if (!formAmount || isNaN(Number(formAmount))) return;
    if (selectedFormStoreId === "other" && !formCustomName.trim()) return;
    setSpends((prev) => [
      {
        id: `s${Date.now()}`,
        store_id: selectedFormStoreId,
        custom_name: selectedFormStoreId === "other" ? formCustomName.trim() : undefined,
        amount: Number(formAmount),
        visited_at: new Date(formDate).toISOString(),
      },
      ...prev,
    ]);
    setFormAmount("");
    setFormCustomName("");
    setShowForm(false);
  }

  function removeSpend(id: string) {
    setSpends((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <main className="min-h-full bg-[var(--jet-black)]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-[var(--platinum)]">消費紀錄</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--lobster-pink)] hover:bg-[var(--burnt-peach)] text-[var(--platinum)] text-sm font-semibold rounded-full shadow transition-all active:scale-95"
          >
            <Plus size={16} />
            新增
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-[var(--jet-black)] rounded-2xl p-4 shadow-sm border border-[var(--blue-slate)]">
            <div className="flex items-center gap-1.5 text-[var(--lavender)]/75 text-xs mb-1">
              <Wallet size={13} /> 本月消費
            </div>
            <p className="text-xl font-bold text-[var(--burnt-peach)]">NT${thisMonth}</p>
          </div>
          <div className="bg-[var(--jet-black)] rounded-2xl p-4 shadow-sm border border-[var(--blue-slate)]">
            <div className="flex items-center gap-1.5 text-[var(--lavender)]/75 text-xs mb-1">
              <TrendingUp size={13} /> 平均每餐
            </div>
            <p className="text-xl font-bold text-[var(--platinum)]">NT${avgPerMeal}</p>
          </div>
          <div className="bg-[var(--jet-black)] rounded-2xl p-4 shadow-sm border border-[var(--blue-slate)]">
            <div className="flex items-center gap-1.5 text-[var(--lavender)]/75 text-xs mb-1">
              <Zap size={13} /> 最貴一餐
            </div>
            <p className="text-xl font-bold text-[var(--platinum)]">
              NT${maxSpend?.amount ?? 0}
            </p>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-[var(--jet-black)] rounded-2xl p-4 shadow-sm border border-[var(--lilac)]/45 mb-5">
            <h2 className="font-semibold text-[var(--platinum)] mb-3">新增消費</h2>
            <div className="flex flex-col gap-3">
              <select
                value={selectedFormStoreId}
                onChange={(e) => setFormStoreId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--alice-blue)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {getCategoryEmoji(s.category)} {s.name}
                  </option>
                ))}
                <option value="other">🍽️ 其他（自行輸入）</option>
              </select>

              {selectedFormStoreId === "other" && (
                <input
                  type="text"
                  placeholder="店家名稱"
                  value={formCustomName}
                  onChange={(e) => setFormCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--alice-blue)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70"
                />
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lavender)]/60 text-sm">NT$</span>
                  <input
                    type="number"
                    placeholder="金額"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--alice-blue)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70"
                  />
                </div>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--blue-slate)] bg-[var(--jet-black)] text-[var(--alice-blue)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lilac)]/70"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addSpend}
                  className="flex-1 py-2 bg-[var(--lobster-pink)] hover:bg-[var(--burnt-peach)] text-[var(--platinum)] font-semibold rounded-xl text-sm transition-colors"
                >
                  確認新增
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 bg-[var(--blue-slate)]/60 hover:bg-[var(--blue-slate)] text-[var(--alice-blue)] font-semibold rounded-xl text-sm transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--jet-black)] rounded-xl p-1 mb-5 border border-[var(--blue-slate)]">
          <button
            onClick={() => setTab("records")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === "records" ? "bg-[var(--jet-black)] shadow text-[var(--platinum)]" : "text-[var(--lavender)]/75 hover:text-[var(--platinum)]"
            }`}
          >
            <List size={14} /> 紀錄
          </button>
          <button
            onClick={() => setTab("analysis")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === "analysis" ? "bg-[var(--jet-black)] shadow text-[var(--platinum)]" : "text-[var(--lavender)]/75 hover:text-[var(--platinum)]"
            }`}
          >
            <BarChart2 size={14} /> 分析
          </button>
        </div>

        {/* Records tab */}
        {tab === "records" && (
          <div className="flex flex-col gap-3">
            {spends.length === 0 && (
              <div className="text-center py-16 text-[var(--lavender)]/60">
                <p className="text-4xl mb-2">💸</p>
                <p>還沒有消費紀錄，點擊新增吧！</p>
              </div>
            )}
            {[...spends]
              .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime())
              .map((spend) => {
                const info = getStoreInfo(spend);
                return (
                  <div
                    key={spend.id}
                    className="bg-[var(--jet-black)] rounded-2xl p-4 shadow-sm border border-[var(--blue-slate)] flex items-center gap-3"
                  >
                    <div className="text-3xl w-11 h-11 flex items-center justify-center bg-[var(--burnt-peach)]/20 rounded-xl flex-shrink-0">
                      {info.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--platinum)] truncate">{info.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-1.5 py-0.5 bg-[var(--blue-slate)]/55 text-[var(--alice-blue)] rounded-full">{info.category}</span>
                        <span className="flex items-center gap-1 text-xs text-[var(--lavender)]/60">
                          <Calendar size={10} />
                          {new Date(spend.visited_at).toLocaleDateString("zh-TW")}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-[var(--platinum)]">NT${spend.amount}</p>
                    <button
                      onClick={() => removeSpend(spend.id)}
                      className="p-1.5 rounded-full hover:bg-[var(--lobster-pink)]/20 text-[var(--lavender)]/60 hover:text-[var(--burnt-peach)] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        {/* Analysis tab */}
        {tab === "analysis" && (
          <div className="flex flex-col gap-4">
            {spends.length === 0 && (
              <div className="text-center py-16 text-[var(--lavender)]/60">
                <p className="text-4xl mb-2">📊</p>
                <p>新增消費紀錄後即可查看分析</p>
              </div>
            )}

            {spends.length > 0 && (
              <>
                {/* Insights */}
                <div className="grid grid-cols-2 gap-3">
                  {visitCounts && (
                    <div className="bg-[var(--jet-black)] rounded-2xl p-4 shadow-sm border border-[var(--blue-slate)] col-span-2">
                      <div className="flex items-center gap-2 text-[var(--lavender)]/75 text-xs mb-2">
                        <Trophy size={13} className="text-[var(--apricot-cream)]" />
                        最常光顧
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{visitCounts.emoji}</span>
                        <div>
                          <p className="font-bold text-[var(--platinum)]">{visitCounts.name}</p>
                          <p className="text-xs text-[var(--lavender)]/75">共去了 {visitCounts.count} 次</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {maxSpend && (
                    <div className="bg-[var(--jet-black)] rounded-2xl p-4 shadow-sm border border-[var(--blue-slate)]">
                      <div className="flex items-center gap-1.5 text-[var(--lavender)]/75 text-xs mb-2">
                        <Zap size={13} className="text-[var(--burnt-peach)]" />
                        最貴一餐
                      </div>
                      <p className="font-bold text-lg text-[var(--platinum)]">NT${maxSpend.amount}</p>
                      <p className="text-xs text-[var(--lavender)]/75 mt-0.5 truncate">{getStoreInfo(maxSpend).name}</p>
                    </div>
                  )}

                  <div className="bg-[var(--jet-black)] rounded-2xl p-4 shadow-sm border border-[var(--blue-slate)]">
                    <div className="flex items-center gap-1.5 text-[var(--lavender)]/75 text-xs mb-2">
                      <Utensils size={13} className="text-[var(--muted-olive)]" />
                      共記錄
                    </div>
                    <p className="font-bold text-lg text-[var(--platinum)]">{spends.length} 餐</p>
                    <p className="text-xs text-[var(--lavender)]/75 mt-0.5">總計 NT${total}</p>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="bg-[var(--jet-black)] rounded-2xl p-4 shadow-sm border border-[var(--blue-slate)]">
                  <div className="flex items-center gap-2 text-[var(--alice-blue)] font-semibold text-sm mb-4">
                    <BarChart2 size={15} />
                    消費類型分析
                  </div>
                  <div className="flex flex-col gap-3">
                    {categoryBreakdown.map(({ category, amount, pct }) => (
                      <div key={category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-1.5 text-[var(--alice-blue)] font-medium">
                            {getCategoryEmoji(category)} {category}
                          </span>
                          <span className="text-[var(--lavender)] text-xs">
                            NT${amount} <span className="text-[var(--lavender)]/60">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--blue-slate)]/45 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${CATEGORY_COLORS[category] ?? "bg-gray-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly spending note */}
                <div className="bg-[var(--burnt-peach)]/14 rounded-2xl p-4 border border-[var(--burnt-peach)]/40">
                  <p className="text-sm text-[var(--apricot-cream)] font-semibold mb-1">📅 本月小結</p>
                  <p className="text-xs text-[var(--alice-blue)]">
                    本月共消費 <span className="font-bold">NT${thisMonth}</span>，
                    吃了 <span className="font-bold">{thisMonthSpends.length}</span> 餐，
                    平均每餐 <span className="font-bold">NT${thisMonthSpends.length > 0 ? Math.round(thisMonth / thisMonthSpends.length) : 0}</span>。
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <RandomPicker
        stores={stores}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectStore={() => setPickerOpen(false)}
      />
    </main>
  );
}
