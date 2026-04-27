import { supabase } from "@/lib/supabase";

export function subscribeToTables(channelName, tables, onChange) {
  const channel = supabase.channel(channelName);

  tables.forEach((table) => {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      onChange
    );
  });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}