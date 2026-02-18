"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/services/authService";
import styles from "../auth.module.css";

interface LoginForm {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const router = useRouter();
  const { login, token } = useAuth();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    if (token || localToken) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const validate = (): LoginErrors => {
    const nextErrors: LoginErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailRegex.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await loginUser(form);
      login(res.token);
      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Welcome!</h1>
        <p className={styles.subtitle}>Sign in to continue managing your inventory.</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
            placeholder="you@example.com"
          />
          {errors.email ? <p className={styles.fieldError}>{errors.email}</p> : null}

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
            placeholder="Enter password"
          />
          {errors.password ? <p className={styles.fieldError}>{errors.password}</p> : null}

          <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        {submitError ? <p className={styles.error}>{submitError}</p> : null}

        <p className={styles.rowText}>
          New here? <Link href="/register" className={styles.link}>Create account</Link>
        </p>
      </section>
    </main>
  );
}
