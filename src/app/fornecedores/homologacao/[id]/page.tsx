"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupplierDetailUrl } from "@/lib/utils/routes";

export default function HomologacaoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params?.id as string;

  useEffect(() => {
    if (supplierId) {
      router.replace(getSupplierDetailUrl(supplierId));
    } else {
      router.replace("/fornecedores/diretorio");
    }
  }, [router, supplierId]);

  return null;
}
