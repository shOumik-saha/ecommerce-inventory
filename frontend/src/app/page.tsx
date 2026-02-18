"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    if (token || localToken) {
      router.replace("/dashboard");
      return;
    }
    router.replace("/login");
  }, [token, router]);

  return null;
}
