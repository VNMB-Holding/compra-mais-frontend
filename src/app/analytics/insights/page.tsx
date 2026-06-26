"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InsightsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/analytics/spend");
  }, [router]);

  return null;
}
