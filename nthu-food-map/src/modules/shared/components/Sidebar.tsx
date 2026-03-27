"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, List, MapPin, Wallet, PlusCircle, SunMoon } from "lucide-react";
import { cn } from "@/modules/shared/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "地圖", icon: MapPin },
  { href: "/stores", label: "餐廳", icon: List },
  { href: "/spending", label: "消費", icon: Wallet },
];

function emit(name: string) {
  window.dispatchEvent(new Event(name));
}

export default function Sidebar() {
  const pathname = usePathname();
  const versionText = `v1.0.0 ${new Date().toISOString()}`;

  useEffect(() => {
    const saved = window.localStorage.getItem("theme-mode");
    document.documentElement.classList.toggle("theme-light", saved === "light");
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const nextIsLight = !root.classList.contains("theme-light");
    root.classList.toggle("theme-light", nextIsLight);
    window.localStorage.setItem("theme-mode", nextIsLight ? "light" : "dark");
  }

  return (
    <aside className="w-56 h-full bg-[var(--jet-black)] border-r border-[var(--blue-slate)] flex flex-col px-3 py-5">
      <div className="flex items-center gap-3 px-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--lilac)] to-[var(--lobster-pink)] text-[var(--platinum)] flex items-center justify-center font-bold">
          清
        </div>
        <div>
          <p className="text-[var(--platinum)] text-[15px] font-bold tracking-wide">清大美食地圖</p>
          <p className="text-[var(--lavender)]/70 text-xs">NTHU Food Map</p>
        </div>
      </div>

      <nav className="mt-6 space-y-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-[var(--jet-black)] text-[var(--apricot-cream)]"
                  : "text-[var(--lavender)]/75 hover:bg-[var(--jet-black)]/80 hover:text-[var(--platinum)]"
              )}
            >
              {active && <span className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-[var(--burnt-peach)]" />}
              <Icon size={16} />
              <span className="font-bold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => emit("open-random-picker")}
        className="mt-5 w-full h-12 rounded-xl bg-gradient-to-r from-[var(--lobster-pink)] to-[var(--burnt-peach)] text-[var(--platinum)] font-bold flex items-center justify-center gap-2 shadow-[0_0_0_1px_rgba(236,239,244,0.12),0_0_22px_rgba(191,97,106,0.55),0_0_42px_rgba(191,97,106,0.32)] animate-[pulse_2.2s_ease-in-out_infinite] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
      >
        <Dices size={18} />
        幫我選！
      </button>

      <div className="mt-auto space-y-1.5 pb-1">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--lavender)]/70 hover:text-[var(--platinum)] hover:bg-[var(--jet-black)]/80 transition-colors"
        >
          <SunMoon size={14} />
          切換主題
        </button>

        <button
          type="button"
          onClick={() => emit("open-add-store")}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--lavender)]/70 hover:text-[var(--platinum)] hover:bg-[var(--jet-black)]/80 transition-colors"
        >
          <PlusCircle size={14} />
          新增店家
        </button>
        <div
          suppressHydrationWarning
          className="w-full rounded-lg px-3 py-2 text-[11px] text-[var(--lavender)]/65 bg-[var(--jet-black)]/35 border border-[var(--blue-slate)]/80"
        >
          {versionText}
        </div>
      </div>
    </aside>
  );
}
