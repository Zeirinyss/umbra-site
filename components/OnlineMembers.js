"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OnlineMembers() {
  const [onlineMembers, setOnlineMembers] = useState([]);

  useEffect(() => {
    fetchOnlineMembers();

    const interval = setInterval(fetchOnlineMembers, 30000);

    const channel = supabase
      .channel("online-members-panel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
        },
        () => {
          fetchOnlineMembers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchOnlineMembers() {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("user_presence")
      .select("*")
      .gte("last_seen", cutoff)
      .order("rsi_handle", { ascending: true });

    setOnlineMembers(data || []);
  }

  return (
    <div className="fixed right-4 top-24 z-40 hidden w-64 rounded-2xl border border-zinc-800 bg-black/80 p-4 shadow-2xl shadow-red-950/20 backdrop-blur-xl lg:block">
      <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-green-400">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        Online ({onlineMembers.length})
      </p>

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {onlineMembers.length === 0 ? (
          <p className="text-xs text-zinc-500">No one online</p>
        ) : (
          onlineMembers.map((online) => (
            <p key={online.user_id} className="truncate text-sm text-zinc-300">
              • {online.rsi_handle || online.email}
            </p>
          ))
        )}
      </div>
    </div>
  );
}