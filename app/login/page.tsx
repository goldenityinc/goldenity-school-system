"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function checkSession() {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store"
      });

      if (!isActive) {
        return;
      }

      if (response.ok) {
        router.replace("/");
      }
    }

    void checkSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setErrorMessage(payload?.message ?? "Email atau password tidak valid.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Login Goldenity Campus</h1>
          <p className="mt-2 text-sm text-slate-600">Masuk untuk mengakses dashboard ERP kampus.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Username / Email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none ring-yellow-500 focus:ring-2"
              placeholder="Masukkan username atau email"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none ring-yellow-500 focus:ring-2"
              placeholder="Masukkan password"
              autoComplete="new-password"
              required
            />
          </div>

          {errorMessage ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg bg-slate-900 px-4 font-semibold text-yellow-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
