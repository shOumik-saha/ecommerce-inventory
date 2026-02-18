"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/fetcher";
import styles from "./dashboard.module.css";

const getTotal = (res: any): number => {
  return (
    res?.data?.total ??
    (Array.isArray(res?.data?.data)
      ? res.data.data.length
      : Array.isArray(res?.data)
        ? res.data.length
        : 0)
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const [username, setUsername] = useState("User");
  const [productsTotal, setProductsTotal] = useState(0);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [meRes, productRes, categoryRes] = await Promise.all([
          apiFetch("/me"),
          apiFetch("/products"),
          apiFetch("/categories"),
        ]);

        setUsername(meRes?.user?.name || "User");
        setProductsTotal(getTotal(productRes));
        setCategoriesTotal(getTotal(categoryRes));
      } catch (err) {
        console.error(err);
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    setError("");
    setIsLoggingOut(true);

    try {
      await apiFetch("/logout", { method: "POST" });
      logout();
      router.push("/login");
    } catch (err) {
      console.error(err);
      setError("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.status}>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.greeting}>Hi {username}</h1>
            <p className={styles.sub}>Welcome back to your inventory dashboard.</p>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
            <Link href="/dashboard/products" className={styles.navLink}>
              Products
            </Link>
            <Link href="/dashboard/categories" className={styles.navLink}>
              Categories
            </Link>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </nav>
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.grid}>
          <article className={styles.card}>
            <p className={styles.kicker}>Inventory</p>
            <h2 className={styles.value}>{productsTotal}</h2>
            <p className={styles.body}>Total products currently registered.</p>
            <div className={styles.actions}>
              <Link href="/dashboard/products" className={`${styles.actionBtn} ${styles.primary}`}>
                Manage Products
              </Link>
            </div>
          </article>

          <article className={styles.card}>
            <p className={styles.kicker}>Catalog</p>
            <h2 className={styles.value}>{categoriesTotal}</h2>
            <p className={styles.body}>Total categories available for organizing stock.</p>
            <div className={styles.actions}>
              <Link href="/dashboard/categories" className={`${styles.actionBtn} ${styles.soft}`}>
                Manage Categories
              </Link>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardWide}`}>
            <p className={styles.kicker}>Quick Actions</p>
            <h2 className={styles.value}>Start Managing</h2>
            <p className={styles.body}>
              Use Products and Categories from the top bar to navigate into CRUD screens.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
