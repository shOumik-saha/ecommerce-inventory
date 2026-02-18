"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/fetcher";

export default function Dashboard() {
  const [productsTotal, setProductsTotal] = useState(0);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productRes = await apiFetch("/products");
        const categoryRes = await apiFetch("/categories");

        const productTotal =
          productRes?.data?.total ??
          (Array.isArray(productRes?.data?.data)
            ? productRes.data.data.length
            : Array.isArray(productRes?.data)
              ? productRes.data.length
              : 0);

        const categoryTotal =
          categoryRes?.data?.total ??
          (Array.isArray(categoryRes?.data?.data)
            ? categoryRes.data.data.length
            : Array.isArray(categoryRes?.data)
              ? categoryRes.data.length
              : 0);

        setProductsTotal(productTotal);
        setCategoriesTotal(categoryTotal);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>

      <div style={{ marginTop: "20px" }}>
        <h2>Total Products: {productsTotal}</h2>
        <h2>Total Categories: {categoriesTotal}</h2>
      </div>
    </div>
  );
}
