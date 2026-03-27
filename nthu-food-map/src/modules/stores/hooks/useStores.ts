"use client";

import { useEffect, useState } from "react";
import type { Store } from "@/modules/shared/types";

interface UseStoresResult {
  stores: Store[];
  loading: boolean;
  error: string | null;
}

export function useStores(): UseStoresResult {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStores() {
      try {
        const response = await fetch("/api/stores", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as { stores?: Store[] };

        if (!active) return;

        setStores(payload.stores ?? []);
        setError(null);
        setLoading(false);
      } catch (e) {
        if (!active) return;
        console.warn("Failed to load stores from local API.", e);
        setError(e instanceof Error ? e.message : "讀取 stores 失敗");
        setLoading(false);
      }
    }

    loadStores();

    return () => {
      active = false;
    };
  }, []);

  return { stores, loading, error };
}
