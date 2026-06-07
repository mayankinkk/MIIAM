"use client";

import { useEffect } from "react";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";

export default function ServiceSettingsSync() {
  const syncFromSupabase = useServiceSettingsStore((s) => s.syncFromSupabase);
  const _synced = useServiceSettingsStore((s) => s._synced);

  useEffect(() => {
    if (!_synced) {
      syncFromSupabase();
    }
  }, [_synced, syncFromSupabase]);

  return null;
}
