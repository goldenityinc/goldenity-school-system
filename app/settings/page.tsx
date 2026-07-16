"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type SettingsProfile = {
  userId: string;
  name: string;
  email: string | null;
  role: string;
  tenantId: string | null;
  tenantSlug: string | null;
  profilePhotoUrl: string | null;
  tenantLogoUrl: string | null;
};

type SettingsProfileResponse = {
  profile?: SettingsProfile;
  message?: string;
  readOnly?: boolean;
};

function isTenantAdmin(role?: string) {
  return role === "TENANT_ADMIN";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Gagal membaca file."));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      try {
        setLoading(true);
        const response = await fetch("/api/settings/profile", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as SettingsProfileResponse | null;

        if (!response.ok) {
          throw new Error(payload?.message ?? "Gagal memuat pengaturan.");
        }

        if (!isActive || !payload?.profile) {
          return;
        }

        setProfile(payload.profile);
        setName(payload.profile.name ?? "");
        setEmail(payload.profile.email ?? "");
        setProfilePhotoUrl(payload.profile.profilePhotoUrl ?? null);
        setTenantLogoUrl(payload.profile.tenantLogoUrl ?? null);
        setReadOnlyMode(Boolean(payload.readOnly));
        if (payload.readOnly) {
          setErrorMessage(payload.message ?? "Data profil lokal belum tersinkron. Pengaturan hanya bisa dilihat.");
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Gagal memuat pengaturan.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  const canEditLogo = isTenantAdmin(profile?.role);
  const canSubmit = !submitting && !readOnlyMode;

  const previewInitials = useMemo(() => {
    const fallback = (name || profile?.name || "Pengguna").trim();
    return fallback
      .split(/\s+/)
      .map((item) => item.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [name, profile?.name]);

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setProfilePhotoUrl(dataUrl);
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setTenantLogoUrl(dataUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          profilePhotoUrl,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
          tenantLogoUrl: canEditLogo ? tenantLogoUrl : undefined
        })
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Gagal menyimpan pengaturan.");
      }

      setSuccessMessage("Pengaturan berhasil disimpan.");
      setCurrentPassword("");
      setNewPassword("");
      setProfile((previous) => (previous ? { ...previous, name, email } : previous));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">Memuat pengaturan...</section>;
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-slate-600">Ubah nama, email, foto profil, kata sandi, dan logo tenant.</p>
      </header>

      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div> : null}
      {successMessage ? <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</div> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-3xl font-bold text-yellow-400">
              {profilePhotoUrl ? <Image src={profilePhotoUrl} alt="Foto profil" width={112} height={112} className="h-full w-full object-cover" unoptimized /> : previewInitials || "U"}
            </div>
            <label className="block text-sm font-medium text-slate-700">Foto Profil</label>
            <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="mt-2 block w-full text-sm" />
            <p className="mt-2 text-xs text-slate-500">Gambar akan disimpan sebagai URL data di profil lokal.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lengkap</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none ring-yellow-500 focus:ring-2"
                placeholder="Nama pengguna"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none ring-yellow-500 focus:ring-2"
                placeholder="nama@email.com"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none ring-yellow-500 focus:ring-2"
                  placeholder="Isi jika ingin mengganti password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none ring-yellow-500 focus:ring-2"
                  placeholder="Minimal 8 karakter"
                />
              </div>
            </div>
          </div>
        </section>

        {canEditLogo ? (
          <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-900">Logo Tenant</h2>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-xs text-slate-400">
                {tenantLogoUrl ? <Image src={tenantLogoUrl} alt="Logo tenant" width={64} height={64} className="h-full w-full object-cover" unoptimized /> : "Logo"}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Unggah Logo Tenant</label>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-2 block w-full text-sm" />
                <p className="mt-2 text-xs text-slate-500">Hanya tenant admin yang dapat mengubah logo ini.</p>
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : readOnlyMode ? "Backend Belum Siap" : "Simpan Pengaturan"}
          </button>
        </div>
      </form>
    </section>
  );
}
