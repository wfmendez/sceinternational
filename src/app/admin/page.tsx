import { redirect } from "next/navigation";

// La URL /admin redirige a /panel/admin (protegido por el panel layout)
export default function AdminLegacyRedirect() {
  redirect("/panel/admin");
}
