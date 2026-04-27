"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToTables } from "@/lib/realtimeRefresh";

export default function AppAdmin() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  loadAdmin();

  const unsubscribe = subscribeToTables(
    "app-admin-live",
    ["members"],
    () => {
      loadAdmin();
    }
  );

  return unsubscribe;
}, []);

  async function loadAdmin() {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;

    if (!currentUser) {
      setLoading(false);
      return;
    }

    setUser(currentUser);

    const { data: adminRow } = await supabase
      .from("admins")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (!adminRow) {
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    setMembers(memberData || []);
    setLoading(false);
  }

  async function approveMember(id) {
    await supabase
      .from("members")
      .update({ approved: true })
      .eq("id", id);

    loadAdmin();
  }

  async function denyMember(id) {
    await supabase
      .from("members")
      .delete()
      .eq("id", id);

    loadAdmin();
  }

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6 text-white">Not logged in</div>;
  }

  if (!isAdmin) {
    return <div className="p-6 text-red-400">Access Denied</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <h1 className="text-3xl font-black mb-6">Admin Panel</h1>

      <div className="space-y-4">
        {members.map((m) => (
          <div
            key={m.id}
            className="border border-zinc-800 p-4 rounded-xl"
          >
            <p className="font-bold">{m.rsi_handle}</p>
            <p className="text-sm text-zinc-400">{m.email}</p>

            {!m.approved && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => approveMember(m.id)}
                  className="bg-green-600 px-3 py-1 rounded"
                >
                  Approve
                </button>

                <button
                  onClick={() => denyMember(m.id)}
                  className="bg-red-600 px-3 py-1 rounded"
                >
                  Deny
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}