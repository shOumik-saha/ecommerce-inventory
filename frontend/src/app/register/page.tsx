"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { registerUser } from "@/services/authService";
import styles from "../auth.module.css";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const router = useRouter();
  const { token } = useAuth();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    if (token || localToken) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const validate = (): RegisterErrors => {
    const nextErrors: RegisterErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    } else if (form.name.trim().length < 3) {
      nextErrors.name = "Name must be at least 3 characters.";
    }

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

    if (!form.password_confirmation) {
      nextErrors.password_confirmation = "Please confirm your password.";
    } else if (form.password_confirmation !== form.password) {
      nextErrors.password_confirmation = "Passwords do not match.";
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
      await registerUser(form);
      router.replace("/login");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Get started with your inventory workspace.</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
            placeholder="Your full name"
          />
          {errors.name ? <p className={styles.fieldError}>{errors.name}</p> : null}

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
            placeholder="At least 6 characters"
          />
          {errors.password ? <p className={styles.fieldError}>{errors.password}</p> : null}

          <label className={styles.label} htmlFor="password_confirmation">
            Confirm Password
          </label>
          <input
            id="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password_confirmation: e.target.value }))
            }
            className={`${styles.input} ${errors.password_confirmation ? styles.inputError : ""}`}
            placeholder="Re-enter your password"
          />
          {errors.password_confirmation ? (
            <p className={styles.fieldError}>{errors.password_confirmation}</p>
          ) : null}

          <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        {submitError ? <p className={styles.error}>{submitError}</p> : null}

        <p className={styles.rowText}>
          Already have an account? <Link href="/login" className={styles.link}>Login</Link>
        </p>
      </section>
    </main>
  );
}
