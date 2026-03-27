"use client";

import { MapPin, Shuffle, List, Wallet, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/modules/shared/lib/utils";
import AuthButton from "@/modules/auth/components/AuthButton";

const navItems = [
  { href: "/", icon: MapPin, label: "地圖" },
  { href: "/stores", icon: List, label: "餐廳" },
  { href: "/spending", icon: Wallet, label: "消費" },
];

export default function Navbar({
  onPickerOpen,
  onAddStoreOpen,
}: {
  onPickerOpen?: () => void;
  onAddStoreOpen?: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-14 max-w-5xl mx-auto">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-base shadow-sm">
            🍜
          </div>
          <span className="font-bold text-[15px] text-gray-900 hidden sm:block tracking-tight">
            清大美食地圖
          </span>
        </Link>

        {/* Nav tabs */}
        <nav className="flex items-end h-full gap-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 h-full text-sm font-medium transition-colors border-b-2",
                  active
                    ? "text-orange-600 border-orange-500"
                    : "text-gray-500 hover:text-gray-800 border-transparent hover:border-gray-200"
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Auth + CTA */}
        <div className="flex items-center gap-2">
          <AuthButton />
          <button
            onClick={onAddStoreOpen}
            title="加入未收錄店家"
            aria-label="加入未收錄店家"
            className="flex items-center justify-center w-9 h-9 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 text-sm rounded-full transition-all active:scale-95"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={onPickerOpen}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-500 hover:to-red-600 active:scale-[0.97] text-white text-sm font-semibold rounded-full shadow-[0_10px_20px_rgba(249,115,22,0.35)] transition-all"
          >
            <Shuffle size={15} />
            <span className="hidden sm:block">幫我選！</span>
            <span className="sm:hidden">選</span>
          </button>
        </div>
      </div>
    </header>
  );
}
