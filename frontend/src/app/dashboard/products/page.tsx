"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/fetcher";
import styles from "../management.module.css";

interface CategoryOption {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  category_id: number;
  category?: CategoryOption;
}

interface Paginated<T> {
  current_page: number;
  data: T[];
  last_page: number;
  total: number;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
};

const getPageWindow = (current: number, last: number): number[] => {
  if (last <= 5) return Array.from({ length: last }, (_, i) => i + 1);
  const start = Math.max(1, current - 2);
  const end = Math.min(last, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export default function ProductsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [username, setUsername] = useState("User");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  const pageWindow = useMemo(
    () => getPageWindow(pagination.currentPage, pagination.lastPage),
    [pagination.currentPage, pagination.lastPage]
  );

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        (product.description || "").toLowerCase().includes(search);

      const matchesCategory = !categoryFilter || String(product.category_id) === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const fetchAllCategories = async () => {
    const all: CategoryOption[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const res = await apiFetch(`/categories?page=${page}`);
      const payload: Paginated<CategoryOption> = res.data;
      all.push(...payload.data);
      lastPage = payload.last_page;
      page += 1;
    } while (page <= lastPage);

    setCategories(all);
  };

  const fetchProducts = async (page = 1) => {
    const params = new URLSearchParams();
    params.set("page", String(page));

    const res = await apiFetch(`/products?${params.toString()}`);
    const payload: Paginated<Product> = res.data;

    setProducts(payload.data);
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
        await Promise.all([fetchAllCategories(), fetchProducts(1)]);
      } catch (err) {
        console.error(err);
        setError("Could not load products.");
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
      price: Number(form.price),
      stock: Number(form.stock),
      category_id: Number(form.category_id),
    };

    if (!payload.name || Number.isNaN(payload.price) || Number.isNaN(payload.stock) || !payload.category_id) {
      setError("Please provide valid product details.");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await apiFetch(`/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setStatus("Product updated successfully.");
      } else {
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setStatus("Product created successfully.");
      }

      resetForm();
      await fetchProducts(pagination.currentPage);
    } catch (err) {
      console.error(err);
      setError("Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
      category_id: String(product.category_id),
    });
    setStatus("");
    setError("");
  };

  const handleDeleteRequest = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setError("");
    setStatus("");
    try {
      await apiFetch(`/products/${confirmDeleteId}`, { method: "DELETE" });
      setStatus("Product deleted successfully.");
      setShowDeleteToast(true);
      setTimeout(() => setShowDeleteToast(false), 2500);
      setConfirmDeleteId(null);
      await fetchProducts(pagination.currentPage);
    } catch (err) {
      console.error(err);
      setError("Failed to delete product.");
    }
  };

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.lastPage || nextPage === pagination.currentPage) return;

    setError("");
    try {
      await fetchProducts(nextPage);
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
          <p className={styles.status}>Loading products...</p>
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
            <p className={styles.sub}>Manage products with search, filter, CRUD, and pagination.</p>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
            <Link href="/dashboard/products" className={`${styles.navLink} ${styles.navLinkActive}`}>
              Products
            </Link>
            <Link href="/dashboard/categories" className={styles.navLink}>
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
              <h2 className={styles.sectionTitle}>{editingId ? "Edit Product" : "Add Product"}</h2>
              <form className={styles.formGrid} onSubmit={handleSave}>
                <label className={styles.label} htmlFor="product-name">
                  Name
                </label>
                <input
                  id="product-name"
                  className={`${styles.input} ${styles.span2}`}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Product name"
                />

                <label className={styles.label} htmlFor="product-description">
                  Description
                </label>
                <textarea
                  id="product-description"
                  className={`${styles.textarea} ${styles.span2}`}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                />

                <label className={styles.label} htmlFor="product-price">
                  Price
                </label>
                <input
                  id="product-price"
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                />

                <label className={styles.label} htmlFor="product-stock">
                  Stock
                </label>
                <input
                  id="product-stock"
                  className={styles.input}
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                />

                <label className={styles.label} htmlFor="product-category">
                  Category
                </label>
                <select
                  id="product-category"
                  className={`${styles.select} ${styles.span2}`}
                  value={form.category_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <div className={`${styles.actionsRow} ${styles.span2}`}>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
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
              <h2 className={styles.sectionTitle}>All Products</h2>

              <div className={styles.formGrid}>
                <label className={styles.label} htmlFor="search">
                  Search
                </label>
                <input
                  id="search"
                  className={styles.input}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name/description"
                />

                <label className={styles.label} htmlFor="filter-category">
                  Category
                </label>
                <select
                  id="filter-category"
                  className={styles.select}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className={styles.kpi}>
                Showing <strong>{visibleProducts.length}</strong> items on page {pagination.currentPage} | Total{" "}
                <strong>{pagination.total}</strong>
              </p>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5}>No products found.</td>
                      </tr>
                    ) : (
                      visibleProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <strong>{product.name}</strong>
                            <br />
                            {product.description || "No description"}
                          </td>
                          <td>{product.category?.name || "-"}</td>
                          <td>${Number(product.price).toFixed(2)}</td>
                          <td>{product.stock}</td>
                          <td>
                            <div className={styles.inlineActions}>
                              <button
                                className={`${styles.btn} ${styles.btnSoft}`}
                                type="button"
                                onClick={() => handleEdit(product)}
                              >
                                Edit
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnDanger}`}
                                type="button"
                                onClick={() => handleDeleteRequest(product.id)}
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

      {confirmDeleteId ? (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>Delete Product?</h3>
            <p className={styles.dialogBody}>This action cannot be undone.</p>
            <div className={styles.actionsRow}>
              <button className={`${styles.btn} ${styles.btnDanger}`} type="button" onClick={handleDeleteConfirm}>
                Yes, Delete
              </button>
              <button
                className={`${styles.btn} ${styles.btnSoft}`}
                type="button"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteToast ? (
        <div className={styles.toastWrap}>
          <div className={`${styles.toast} ${styles.toastSuccess}`}>Product deleted successfully</div>
        </div>
      ) : null}
    </main>
  );
}
