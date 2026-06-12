"use client";

import { useRef, useState } from "react";

import { useNotifications } from "@/hooks/use-notifications";

const NOTIFICATION_LABELS: Record<string, string> = {
  budget_submitted: "Presupuesto enviado a revisión",
  budget_returned: "Presupuesto devuelto",
  budget_validated: "Presupuesto validado",
  budget_approved: "Presupuesto aprobado",
  client_approved: "Aprobado por el cliente",
  execution_enabled: "Ejecución habilitada",
  expense_logged: "Gasto registrado",
  expense_over_budget: "Gasto excede el presupuesto",
};

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(userId);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Notificaciones"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <span className="text-sm font-semibold">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                Sin notificaciones nuevas
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800"
                >
                  <div className="mt-0.5 size-2 shrink-0 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-slate-500">
                      {NOTIFICATION_LABELS[n.type] ?? n.type}
                    </p>
                  </div>
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
