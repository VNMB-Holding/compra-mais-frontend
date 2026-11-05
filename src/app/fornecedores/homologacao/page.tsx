"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomologacaoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/fornecedores/diretorio");
  }, [router]);

  return null;
}
