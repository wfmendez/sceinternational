"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type Notification = Tables<"notifications">;

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markRead = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = async () => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount: notifications.length,
    markRead,
    markAllRead,
  };
}
