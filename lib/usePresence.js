"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function usePresence() {
  useEffect(() => {
    let interval;

    async function updatePresence() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) return;

      const { data: member } = await supabase
        .from("members")
        .select("rsi_handle")
        .eq("user_id", user.id)
        .maybeSingle();

      await supabase.from("user_presence").upsert(
        {
          user_id: user.id,
          email: user.email,
          rsi_handle: member?.rsi_handle || user.email,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    updatePresence();

    interval = setInterval(updatePresence, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);
}