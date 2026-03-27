"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { RandomPicker } from "@/modules/map";
import { StoreCard, useStores } from "@/modules/stores";
import { SubmitStoreModal } from "@/modules/submissions";
import { type Store } from "@/modules/shared";

const MapClient = dynamic(() => import("@/modules/map").then((mod) => mod.MapClient), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[var(--jet-black)] animate-pulse flex items-center justify-center">
      <span className="text-[var(--lavender)]/70 text-sm">載入地圖中...</span>
    </div>
  ),
});

export default function Home() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [area1Signal, setArea1Signal] = useState(0);
  const { stores } = useStores();

  useEffect(() => {
    const handlePicker = () => setPickerOpen(true);
    const handleAddStore = () => setSubmitOpen(true);
    const handleAreaFocus = (event: Event) => {
      const customEvent = event as CustomEvent<{ areaId?: string }>;
      if (customEvent.detail?.areaId === "area-1") {
        setArea1Signal((v) => v + 1);
      }
    };

    window.addEventListener("open-random-picker", handlePicker);
    window.addEventListener("open-add-store", handleAddStore);
    window.addEventListener("focus-area", handleAreaFocus as EventListener);

    return () => {
      window.removeEventListener("open-random-picker", handlePicker);
      window.removeEventListener("open-add-store", handleAddStore);
      window.removeEventListener("focus-area", handleAreaFocus as EventListener);
    };
  }, []);

  return (
    <main className="h-full relative overflow-hidden bg-[var(--jet-black)]">
      <div className="h-full">
        <MapClient
          stores={stores}
          selectedStore={selectedStore}
          onStoreSelect={setSelectedStore}
          area1Signal={area1Signal}
        />
      </div>

      {/* Store detail panel */}
      {selectedStore && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] flex justify-center pointer-events-none">
          <StoreCard
            store={selectedStore}
            className="pointer-events-auto"
            onClose={() => setSelectedStore(null)}
          />
        </div>
      )}

      {/* Random picker modal */}
      <RandomPicker
        stores={stores}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectStore={setSelectedStore}
      />

      {/* Submit store modal */}
      <SubmitStoreModal
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
      />
    </main>
  );
}
