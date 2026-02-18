"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/fetcher";
import styles from "../management.module.css";

interface Category {
  id: number;
  name: string;
  description: string | null;
  products_count?: number;
}

interface Paginated<T> {
  current_page: number;
  data: T[];
  last_page: number;
  total: number;
}

interface CategoryForm {
  name: string;
  description: string;
}

const emptyForm: CategoryForm = { name: "", description: "" };

const getPageWindow = (current: number, last: number): number[] => {
  if (last <= 5) return Array.from({ length: last }, (_, i) => i + 1);
  const start = Math.max(1, current - 2);
  const end = Math.min(last, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export default function CategoriesPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [username, setUsername] = useState("User");
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const pageWindow = useMemo(
    () => getPageWindow(pagination.currentPage, pagination.lastPage),
    [pagination.currentPage, pagination.lastPage]
  );

  const visibleCategories = useMemo(() => {
    return categories.filter((category) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        category.name.toLowerCase().includes(search) ||
        (category.description || "").toLowerCase().includes(search);

      const count = category.products_count || 0;
      const matchesFilter =
        stockFilter === "all" ||
        (stockFilter === "has-products" && count > 0) ||
        (stockFilter === "empty" && count === 0);

      return matchesSearch && matchesFilter;
    });
  }, [categories, searchTerm, stockFilter]);

  const fetchCategories = async (page = 1) => {
    const res = await apiFetch(`/categories?page=${page}`);
    const payload: Paginated<Category> = res.data;

    setCategories(payload.data);
    setPagination({
      currentPage: payload.current_page,
      lastPage: payload.last_page,
      total: payload.total,
    });
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const meRes = await apiFetch("/me");
        setUsername(meRes?.user?.name || "User");
        await fetchCategories(1);
      } catch (err) {
        console.error(err);
        setError("Could not load categories.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setStatus("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    };

    if (!payload.name) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await apiFetch(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setStatus("Category updated successfully.");
      } else {
        await apiFetch("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setStatus("Category created successfully.");
      }

      resetForm();
      await fetchCategories(pagination.currentPage);
    } catch (err) {
      console.error(err);
      setError("Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
    });
    setError("");
    setStatus("");
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this category?");
    if (!confirmed) return;

    setError("");
    setStatus("");
    try {
      await apiFetch(`/categories/${id}`, { method: "DELETE" });
      setStatus("Category deleted successfully.");
      await fetchCategories(pagination.currentPage);
    } catch (err) {
      console.error(err);
      setError("Failed to delete category.");
    }
  };

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.lastPage || nextPage === pagination.currentPage) return;

    setError("");
    try {
      await fetchCategories(nextPage);
    } catch (err) {
      console.error(err);
      setError("Failed to change page.");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    } finally {
      logout();
      router.replace("/login");
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.status}>Loading categories...</p>
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
            <p className={styles.sub}>Manage categories with search, filter, CRUD, and pagination.</p>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
            <Link href="/dashboard/products" className={styles.navLink}>
              Products
            </Link>
            <Link href="/dashboard/categories" className={`${styles.navLink} ${styles.navLinkActive}`}>
              Categories
            </Link>
            <button type="button" className={styles.logoutBtn} onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </nav>
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}
        {status ? <p className={styles.status}>{status}</p> : null}

        <section className={styles.grid}>
          <article className={`${styles.card} ${styles.split}`}>
            <div className={styles.col5}>
              <h2 className={styles.sectionTitle}>{editingId ? "Edit Category" : "Add Category"}</h2>
              <form className={styles.formGrid} onSubmit={handleSave}>
                <label className={styles.label} htmlFor="category-name">
                  Name
                </label>
                <input
                  id="category-name"
                  className={`${styles.input} ${styles.span2}`}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                />

                <label className={styles.label} htmlFor="category-description">
                  Description
                </label>
                <textarea
                  id="category-description"
                  className={`${styles.textarea} ${styles.span2}`}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                />

                <div className={`${styles.actionsRow} ${styles.span2}`}>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Category" : "Create Category"}
                  </button>
                  {editingId ? (
                    <button className={`${styles.btn} ${styles.btnSoft}`} type="button" onClick={resetForm}>
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>
            </div>

            <div className={styles.col7}>
              <h2 className={styles.sectionTitle}>All Categories</h2>

              <div className={styles.formGrid}>
                <label className={styles.label} htmlFor="category-search">
                  Search
                </label>
                <input
                  id="category-search"
                  className={styles.input}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name/description"
                />

                <label className={styles.label} htmlFor="category-filter">
                  Filter
                </label>
                <select
                  id="category-filter"
                  className={styles.select}
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="has-products">Has Products</option>
                  <option value="empty">No Products</option>
                </select>
              </div>

              <p className={styles.kpi}>
                Showing <strong>{visibleCategories.length}</strong> items on page {pagination.currentPage} | Total{" "}
                <strong>{pagination.total}</strong>
              </p>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Products</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCategories.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No categories found for current filters.</td>
                      </tr>
                    ) : (
                      visibleCategories.map((category) => (
                        <tr key={category.id}>
                          <td>
                            <strong>{category.name}</strong>
                          </td>
                          <td>{category.description || "-"}</td>
                          <td>{category.products_count || 0}</td>
                          <td>
                            <div className={styles.inlineActions}>
                              <button
                                className={`${styles.btn} ${styles.btnSoft}`}
                                type="button"
                                onClick={() => handleEdit(category)}
                              >
                                Edit
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnDanger}`}
                                type="button"
                                onClick={() => handleDelete(category.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  type="button"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                >
                  Previous
                </button>

                {pageWindow.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.pageBtn} ${p === pagination.currentPage ? styles.pageBtnActive : ""}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ))}

                <button
                  className={styles.pageBtn}
                  type="button"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.lastPage}
                >
                  Next
                </button>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
