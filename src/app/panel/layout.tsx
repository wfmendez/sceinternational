import { redirect } from "next/navigation";

import NotificationBell from "@/components/notifications/notification-bell";
import Sidebar from "@/components/panel/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar role={profile.role} userName={profile.full_name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
          <NotificationBell userId={user.id} />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
