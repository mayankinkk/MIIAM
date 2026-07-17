"use client";

import { useEffect, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestPushPermission, onPushMessage } from "@/lib/firebase";
import { useToastStore } from "@/lib/store/toastStore";

export function usePushNotifications() {
  const supabase = createClient();
  const { addToast } = useToastStore();
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  const subscribe = useCallback(async () => {
    const fcmToken = await requestPushPermission();
    if (!fcmToken) return null;

    setToken(fcmToken);
    setPermission(Notification.permission);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("push_tokens").upsert({
        user_id: user.id,
        token: fcmToken,
        platform: "web",
        updated_at: new Date().toISOString(),
      }, { onConflict: "token" });
    }

    return fcmToken;
  }, [supabase]);

  useEffect(() => {
    const unsub = onPushMessage((payload) => {
      addToast(payload.body || payload.title || "New notification", "info");
    });
    return () => { unsub?.(); };
  }, [addToast]);

  return { subscribe, token, permission };
}
