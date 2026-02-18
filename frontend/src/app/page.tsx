"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/fetcher";

export default function Home() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiFetch("/products")
      .then((res) => setData(res))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Backend Test</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
