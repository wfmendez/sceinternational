"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type AuthState = { error: string } | null;

export async function signIn(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { error: "Correo o contraseña incorrectos." };

  redirect("/panel/presupuestos");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
