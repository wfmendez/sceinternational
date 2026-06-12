import type { Metadata } from "next";

import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          SCE International
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Iniciar sesión
        </h1>
        <p className="text-sm text-slate-500">
          Acceso restringido a personal autorizado.
        </p>
      </header>
      <LoginForm />
    </div>
  );
}
