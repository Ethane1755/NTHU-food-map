"use client";

import { useMemo } from "react";

export function useAuth() {
  return useMemo(
    () => ({ user: null, loading: false, supabase: null }),
    []
  );
}
