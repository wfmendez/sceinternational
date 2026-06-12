"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain/roles";

const NAV_LINKS: { href: string; label: string; roles: UserRole[] }[] = [
  {
    href: "/panel/presupuestos",
    label: "Presupuestos",
    roles: ["worker", "admin", "manager"],
  },
  {
    href: "/panel/admin",
    label: "Dashboard",
    roles: ["admin", "manager"],
  },
  {
    href: "/panel/admin/usuarios",
    label: "Usuarios",
    roles: ["admin", "manager"],
  },
];

interface SidebarProps {
  role: UserRole;
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();

  const links = NAV_LINKS.filter((l) => l.roles.includes(role));

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          SCE International
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
          Presupuestos
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {links.map((link) => {
          const isActive =
            link.href === "/panel/presupuestos"
              ? pathname.startsWith("/panel/presupuestos")
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          {userName}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {USER_ROLE_LABELS[role]}
        </p>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="text-xs text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
