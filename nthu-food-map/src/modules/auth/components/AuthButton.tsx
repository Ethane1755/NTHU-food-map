"use client";

import { HardDrive } from "lucide-react";

export default function AuthButton() {
  return (
    <div
      title="本地模式"
      aria-label="本地模式"
      className="flex items-center justify-center w-9 h-9 bg-white border border-gray-200 text-gray-400 rounded-full"
    >
      <HardDrive size={14} />
    </div>
  );
}
