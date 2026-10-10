"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

interface GroupMember {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  added_at: string;
  items: GroupItem[];
}

interface GroupItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  added_by: string;
  added_by_name: string;
}

interface GroupOrder {
  id: string;
  code: string;
  host_id: string;
  host_name: string;
  status: "active" | "ordering" | "closed";
  created_at: string;
  members: GroupMember[];
}

export default function GroupOrderPage() {
  const supabase = useMemo(() => createClient(), []);
  const [group, setGroup] = useState<GroupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [memberName, setMemberName] = useState("");
  const { addToast } = useToastStore();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "You";
      setUserName(name);
      setMemberName(name);

      // Check if user is already in a group
      const { data: membership } = await supabase
        .from("group_order_members")
        .select("group_order_id, group_orders(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership?.group_orders) {
        await loadGroup(membership.group_order_id);
      }
    }
    setLoading(false);
  }

  async function loadGroup(groupId: string) {
    const { data: groupData } = await supabase
      .from("group_orders")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();

    if (!groupData) return;

    const { data: membersData } = await supabase
      .from("group_order_members")
      .select("id, user_id, display_name, role, added_at")
      .eq("group_order_id", groupId)
      .order("added_at");

    const members: GroupMember[] = [];
    for (const m of membersData || []) {
      const { data: items } = await supabase
        .from("group_order_items")
        .select("*")
        .eq("member_id", m.id);
      members.push({ ...m, items: items || [] });
    }

    setGroup({ ...groupData, members });
  }

  const createGroup = useCallback(async () => {
    if (!userId) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("group_orders")
      .insert({
        code,
        host_id: userId,
        host_name: memberName || userName,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      addToast("Failed to create group order", "error");
      return;
    }

    await supabase.from("group_order_members").insert({
      group_order_id: data.id,
      user_id: userId,
      display_name: memberName || userName,
      role: "host",
    });

    addToast("Group order created!", "success");
    await loadGroup(data.id);
  }, [userId, memberName, userName, addToast]);

  async function joinGroup() {
    if (!joinCode || !userId) return;

    const { data: groupData } = await supabase
      .from("group_orders")
      .select("*")
      .eq("code", joinCode.toUpperCase())
      .eq("status", "active")
      .maybeSingle();

    if (!groupData) {
      addToast("Invalid or inactive group code", "error");
      return;
    }

    const { error } = await supabase.from("group_order_members").insert({
      group_order_id: groupData.id,
      user_id: userId,
      display_name: memberName || userName,
      role: "member",
    });

    if (error) {
      addToast("Already in this group", "error");
      return;
    }

    addToast("Joined group order!", "success");
    await loadGroup(groupData.id);
  }

  async function closeGroup() {
    if (!group || group.host_id !== userId) return;
    await supabase.from("group_orders").update({ status: "closed" }).eq("id", group.id);
    addToast("Group order closed", "success");
    setGroup({ ...group, status: "closed" });
  }

  function copyCode() {
    if (group) {
      navigator.clipboard.writeText(group.code);
      addToast("Code copied!", "success");
    }
  }

  function getGroupTotal(): number {
    if (!group) return 0;
    return group.members.reduce(
      (total, member) =>
        total + member.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      0
    );
  }

  if (loading) {
    return (
      <div className="bg-surface flex min-h-screen items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-accent animate-bounce text-4xl">
            group
          </span>
          <p className="text-on-surface-variant mt-3 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pb-24">
      <header className="bg-surface border-outline-variant/10 border-b px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/app/home"
            className="bg-surface-container flex h-10 w-10 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-on-surface text-xl font-black">Group Order</h1>
        </div>
      </header>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Group Order" }]} />

      <main className="mx-auto max-w-lg space-y-6 px-5 py-6">
        {!group ? (
          <>
            {/* Create or Join */}
            <div className="from-primary to-primary-dim text-on-primary rounded-3xl bg-gradient-to-br p-6 text-center shadow-lg">
              <span className="mb-3 block text-5xl">👥</span>
              <h2 className="text-2xl font-black">Order Together</h2>
              <p className="text-on-primary/80 mt-2 text-sm">
                Create a group and order together — everyone adds their items
              </p>
            </div>

            {/* Member name */}
            <div className="bg-surface-container-lowest border-outline-variant/10 space-y-4 rounded-2xl border p-5">
              <label className="block">
                <span className="text-on-surface-variant text-xs font-bold">Your display name</span>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Mayank"
                  className="bg-surface-container border-outline-variant/20 focus:border-primary mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                />
              </label>

              <button
                onClick={createGroup}
                className="bg-primary text-on-primary w-full rounded-xl py-3.5 text-sm font-bold transition-transform active:scale-95"
              >
                Create Group Order
              </button>
            </div>

            {/* Join existing */}
            <div className="bg-surface-container-lowest border-outline-variant/10 space-y-3 rounded-2xl border p-5">
              <p className="text-on-surface text-sm font-bold">Join an Existing Group</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter group code"
                  maxLength={6}
                  className="bg-surface-container border-outline-variant/20 focus:border-primary flex-1 rounded-xl border px-4 py-3 text-center font-mono text-sm tracking-widest uppercase outline-none"
                />
                <button
                  onClick={joinGroup}
                  disabled={!joinCode}
                  className="bg-surface-container border-outline-variant/20 rounded-xl border px-6 py-3 text-sm font-bold transition-transform active:scale-95 disabled:opacity-40"
                >
                  Join
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Active Group */}
            <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-on-surface-variant text-xs">Group Code</p>
                  <p className="text-accent font-mono text-2xl font-black tracking-[0.15em]">
                    {group.code}
                  </p>
                </div>
                <button
                  onClick={copyCode}
                  className="bg-primary/10 text-accent rounded-lg px-3 py-2 text-xs font-bold"
                >
                  Copy
                </button>
              </div>
              <p className="text-on-surface-variant text-xs">
                Share this code with friends to join
              </p>
              {group.status === "active" && (
                <div className="mt-3 flex gap-2">
                  {group.host_id === userId && (
                    <button
                      onClick={closeGroup}
                      className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-bold text-white"
                    >
                      Close Group
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Members */}
            <div className="space-y-3">
              <p className="text-on-surface text-sm font-bold">Members ({group.members.length})</p>
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="bg-surface-container-lowest border-outline-variant/10 rounded-xl border p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                        <span className="material-symbols-outlined text-accent text-sm">
                          person
                        </span>
                      </div>
                      <div>
                        <p className="text-on-surface text-sm font-bold">{member.display_name}</p>
                        <p className="text-on-surface-variant text-[10px]">{member.role}</p>
                      </div>
                    </div>
                    <p className="text-accent text-sm font-bold">
                      ₹{member.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(0)}
                    </p>
                  </div>
                  {member.items.length === 0 ? (
                    <p className="text-on-surface-variant text-xs italic">No items yet</p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {member.items.map((item) => (
                        <div
                          key={item.id}
                          className="text-on-surface-variant flex justify-between text-xs"
                        >
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <p className="text-on-surface font-bold">Group Total</p>
                <p className="text-on-surface text-2xl font-black">₹{getGroupTotal().toFixed(0)}</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
