"use client";

import { redirect } from "next/navigation";

export default function SuccessPage() {
  redirect("/solicitacoes-rapidas/nova");
}
