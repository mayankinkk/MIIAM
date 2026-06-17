"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { deviceIcon, deviceLabel, parseUserAgent, DeviceInfo } from "@/lib/device";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface SessionRow {
  id: string;
  session_token: string;
  device_info: DeviceInfo;
  ip_address: string | null;
  user_agent: string | null;
  location_label: string | null;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
  revoked_at: string | null;
}

interface LoginEvent {
  id: string;
  event_type: "login" | "logout" | "login_failed" | "session_revoked";
  ip_address: string | null;
  user_agent?: string | null;
  device_info: DeviceInfo | null;
  location_label: string | null;
  success: boolean;
  created_at: string;
}

const SESSION_TOKEN_KEY = "miiam-session-token";

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}

function eventLabel(ev: LoginEvent): { label: string; icon: string; tone: "ok" | "warn" | "bad" | "neutral" } {
  switch (ev.event_type) {
    case "login":
      return ev.success
        ? { label: "Signed in", icon: "login", tone: "ok" }
        : { label: "Sign-in failed", icon: "block", tone: "bad" };
    case "logout":
      return { label: "Signed out", icon: "logout", tone: "neutral" };
    case "login_failed":
      return { label: "Failed sign-in attempt", icon: "block", tone: "bad" };
    case "session_revoked":
      return { label: "Device removed", icon: "devices_other", tone: "warn" };
    default:
      return { label: ev.event_type, icon: "info", tone: "neutral" };
  }
}

export default function DevicesPage() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const router = useRouter();
  const { addToast } = useToastStore();
  const { confirm } = useConfirm();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        fetch("/api/auth/sessions").then((r) => r.json()),
        fetch("/api/auth/login-events").then((r) => r.json()),
      ]);
      setSessions(s.sessions || []);
      setEvents(e.events || []);
    } catch (err) {
      console.error("Failed to load sessions", err);
      addToast("Failed to load device list", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  // On mount: ensure the current device has a session row
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      let token = window.localStorage.getItem(SESSION_TOKEN_KEY);
      if (!token) {
        token = crypto.randomUUID();
        window.localStorage.setItem(SESSION_TOKEN_KEY, token);
      }
      const res = await fetch("/api/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: token, is_current: true }),
      });
      const data = await res.json();
      if (!cancelled && data?.session?.id) {
        setCurrentSessionId(data.session.id);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  // Refresh the "last active" stamp every 60s
  useEffect(() => {
    const id = setInterval(() => {
      const token = window.localStorage.getItem(SESSION_TOKEN_KEY);
      if (!token) return;
      fetch("/api/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: token, is_current: true }),
      }).catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const revoke = async (id: string) => {
    if (!await confirm({ title: "Sign Out Device", message: "Sign this device out of MIIAM?", variant: "danger" })) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/auth/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      addToast("Device signed out", "success");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      addToast("Failed to sign out device", "error");
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOthers = async () => {
    const others = sessions.filter((s) => s.id !== currentSessionId);
    if (others.length === 0) return;
    if (!await confirm({ title: "Sign Out Other Devices", message: `Sign out ${others.length} other device${others.length > 1 ? "s" : ""}?`, variant: "danger" })) return;
    setRevokingAll(true);
    try {
      const results = await Promise.all(
        others.map((s) => fetch(`/api/auth/sessions/${s.id}`, { method: "DELETE" }))
      );
      const ok = results.filter((r) => r.ok).length;
      addToast(`Signed out ${ok} of ${others.length} devices`, ok === others.length ? "success" : "info");
      setSessions((prev) => prev.filter((s) => s.id === currentSessionId));
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-24">
      <header className="bg-surface-container px-6 py-4 sticky top-0 z-10 shadow-sm border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <Link href="/app/settings/security" aria-label="Go back" className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-on-background">{t.settings.security}</h1>
            <p className="text-xs text-on-surface-variant">Where you&apos;re signed in and recent sign-in attempts</p>
          </div>
        </div>
      </header>

      <Breadcrumbs items={[
        { label: t.common.home, href: "/app/explore" },
        { label: t.settings.title, href: "/app/settings" },
        { label: t.settings.security, href: "/app/settings/security" },
        { label: "Devices" },
      ]} />

      <main className="p-6 space-y-6 max-w-3xl mx-auto">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">{t.settings.securitySub}</h2>
            {sessions.length > 1 && (
              <button
                onClick={revokeAllOthers}
                disabled={revokingAll}
                className="text-xs font-bold text-error hover:underline disabled:opacity-50"
              >
                {revokingAll ? "Signing out..." : "Sign out other devices"}
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="bg-surface-container rounded-2xl p-5 h-20 animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl">devices</span>
              <p className="font-bold mt-2 text-on-surface">No active sessions</p>
              <p className="text-sm mt-1">Sign in on a device and it will show up here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => {
                const isCurrent = s.id === currentSessionId || s.is_current;
                return (
                  <li
                    key={s.id}
                    className={`bg-surface-container rounded-2xl p-5 flex items-start gap-4 border ${
                      isCurrent ? "border-primary/30" : "border-outline-variant/10"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCurrent ? "bg-primary/10 text-primary" : "bg-surface text-on-surface-variant"
                    }`}>
                      <span className="material-symbols-outlined">{deviceIcon(s.device_info)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-on-surface truncate">{deviceLabel(s.device_info)}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                            This device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {s.location_label || "Unknown location"}
                        {s.ip_address ? ` · ${s.ip_address}` : ""}
                      </p>
                      <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                        Last active {relTime(s.last_active_at)} · signed in {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => revoke(s.id)}
                        disabled={revoking === s.id}
                        className="px-3 py-2 bg-error/10 text-error rounded-xl text-xs font-bold hover:bg-error/20 disabled:opacity-50"
                      >
                        {revoking === s.id ? "..." : "Sign out"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant mb-3">{t.settings.securitySub}</h2>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-surface-container rounded-xl p-3 h-12 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-6 text-center text-on-surface-variant text-sm">
              No recent activity.
            </div>
          ) : (
            <ul className="space-y-2">
              {events.slice(0, 20).map((ev) => {
                const meta = eventLabel(ev);
                const colorByTone: Record<typeof meta.tone, string> = {
                  ok: "text-green-600 bg-green-50",
                  warn: "text-amber-600 bg-amber-50",
                  bad: "text-red-600 bg-red-50",
                  neutral: "text-on-surface-variant bg-surface",
                };
                const dInfo = ev.device_info || (ev.user_agent ? parseUserAgent(ev.user_agent) : null);
                return (
                  <li key={ev.id} className="bg-surface-container rounded-xl p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colorByTone[meta.tone]}`}>
                      <span className="material-symbols-outlined text-base">{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{meta.label}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">
                        {dInfo ? deviceLabel(dInfo) : "Unknown device"}
                        {ev.ip_address ? ` · ${ev.ip_address}` : ""}
                        {ev.location_label ? ` · ${ev.location_label}` : ""}
                      </p>
                    </div>
                    <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{relTime(ev.created_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="text-[11px] text-on-surface-variant text-center px-4">
          If you see a device or location you don&apos;t recognise, sign it out and change your password immediately.
        </p>
      </main>
    </div>
  );
}
