import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  ClipboardCheck,
  FileSpreadsheet,
  LayoutDashboard,
  ScrollText,
  UserPlus
} from "lucide-react";

export type PsbLevel = "TK" | "SD" | "SMP" | "SMA";
export type PsbPathway = "Reguler" | "Prestasi" | "Tahfidz" | "Afirmasi";
export type PsbApplicantStatus = "Draft" | "Terverifikasi" | "Wawancara" | "Diterima" | "Cadangan";
export type PsbDocumentStatus = "Lengkap" | "Perlu Revisi" | "Menunggu";

export type PsbMenuCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type PsbApplicantRecord = {
  id: string;
  registrationNo: string;
  fullName: string;
  level: PsbLevel;
  pathway: PsbPathway;
  status: PsbApplicantStatus;
  documentStatus: PsbDocumentStatus;
  schoolOrigin: string;
  submittedAt: string;
};

export type PsbTimelineItem = {
  title: string;
  description: string;
  status: "done" | "current" | "upcoming";
  dateLabel: string;
};

export type PsbAcceptedStep = {
  title: string;
  dueLabel: string;
  location: string;
  status: "Selesai" | "Berjalan" | "Berikutnya";
  note: string;
};

export type PsbProgramHighlight = {
  title: string;
  description: string;
  audience: string;
};

export type PsbLocationInfo = {
  name: string;
  description: string;
  serviceHours: string;
};

export type PsbFeeItem = {
  label: string;
  amount: string;
};

export type PsbInterviewSlot = {
  title: string;
  time: string;
  location: string;
};

export type PsbDemoMeta = {
  companySlug: string;
  schoolName: string;
  brandShortName: string;
  tagline: string;
  heroNote: string;
  periodLabel: string;
  waveLabel: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  stats: Array<{ label: string; value: string; caption: string }>;
  documents: string[];
  programs: PsbProgramHighlight[];
  processHighlights: string[];
  interviewSlots: PsbInterviewSlot[];
  serviceLocations: PsbLocationInfo[];
  feeBreakdown: PsbFeeItem[];
  contactInfo: {
    officer: string;
    phone: string;
    email: string;
  };
};

const applicantSeeds = [
  ["Alya Khairunnisa", "SD", "Prestasi", "Diterima", "Lengkap", "SDIT Pelita Harapan", "2026-07-01"],
  ["Raka Pradana", "SMP", "Reguler", "Wawancara", "Lengkap", "SMP Nusantara 8", "2026-07-02"],
  ["Nabila Putri Azzahra", "SMA", "Tahfidz", "Terverifikasi", "Lengkap", "SMP Tahfidz Al Ilmi", "2026-07-03"],
  ["Arka Mahendra", "TK", "Reguler", "Draft", "Menunggu", "Rumah Belajar Ceria", "2026-07-03"],
  ["Syifa Humaira", "SD", "Afirmasi", "Diterima", "Lengkap", "SD Negeri 04 Bandung", "2026-07-04"],
  ["Fathan Rayhan", "SMP", "Prestasi", "Terverifikasi", "Perlu Revisi", "SD Islam Permata", "2026-07-05"],
  ["Queena Larasati", "SMA", "Reguler", "Cadangan", "Lengkap", "SMP Cendekia Bangsa", "2026-07-06"],
  ["Irfan Hidayatullah", "SD", "Tahfidz", "Wawancara", "Lengkap", "MI Daarul Hikmah", "2026-07-06"],
  ["Aisyah Nurfadillah", "TK", "Reguler", "Terverifikasi", "Lengkap", "TK Permata Bunda", "2026-07-07"],
  ["Muhammad Zayan", "SMP", "Afirmasi", "Diterima", "Lengkap", "SD Negeri 2 Surakarta", "2026-07-08"],
  ["Cinta Maharani", "SMA", "Prestasi", "Wawancara", "Perlu Revisi", "SMP Bina Prestasi", "2026-07-08"],
  ["Gibran Alfarezi", "SD", "Reguler", "Terverifikasi", "Menunggu", "SD Juara Mandiri", "2026-07-09"]
] as const;

const tenantPresetMap: Record<
  string,
  {
    brandShortName: string;
    tagline: string;
    heroNote: string;
    periodLabel: string;
    waveLabel: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    programs: PsbProgramHighlight[];
    processHighlights: string[];
    interviewSlots: PsbInterviewSlot[];
    serviceLocations: PsbLocationInfo[];
    feeBreakdown: PsbFeeItem[];
    contactInfo: PsbDemoMeta["contactInfo"];
  }
> = {
  "company-1": {
    brandShortName: "C1",
    tagline: "Sekolah masa depan dengan alur penerimaan yang cepat dan rapi.",
    heroNote: "Microsite demo PSB untuk sekolah dengan positioning modern, bilingual, dan technology-enriched learning.",
    periodLabel: "PSB 2026/2027 Gelombang 1",
    waveLabel: "Gelombang prioritas berakhir 15 Juli 2026",
    primaryColor: "#1d4ed8",
    secondaryColor: "#0f172a",
    accentColor: "#d97706",
    programs: [
      {
        title: "Bilingual Explorer Class",
        description: "Pembelajaran harian dengan eksposur Bahasa Inggris yang konsisten dan project showcase bulanan.",
        audience: "Cocok untuk SD - SMP"
      },
      {
        title: "Tahfidz & Character Building",
        description: "Program tahfidz terstruktur dengan target capaian per semester dan mentoring akhlak.",
        audience: "Cocok untuk TK - SMA"
      },
      {
        title: "STEM Discovery Track",
        description: "Aktivitas eksperimen, coding dasar, dan mini research project untuk siswa yang suka eksplorasi.",
        audience: "Cocok untuk SD - SMA"
      }
    ],
    processHighlights: [
      "Formulir online dan verifikasi awal maksimal 1x24 jam kerja.",
      "Wawancara orang tua dijadwalkan fleksibel pagi atau siang.",
      "Pengumuman hasil dan daftar ulang dipantau langsung dari dashboard."
    ],
    interviewSlots: [
      {
        title: "Sesi A",
        time: "09 Juli 2026 · 09.00 - 10.00",
        location: "Ruang Konsultasi Gedung A"
      },
      {
        title: "Sesi B",
        time: "09 Juli 2026 · 13.00 - 14.00",
        location: "Ruang Konsultasi Gedung A"
      }
    ],
    serviceLocations: [
      {
        name: "Helpdesk PSB",
        description: "Pendampingan registrasi, aktivasi akun, dan verifikasi awal berkas.",
        serviceHours: "Senin - Jumat, 08.00 - 15.30"
      },
      {
        name: "Loket Keuangan Gedung A",
        description: "Konfirmasi biaya daftar ulang, cetak bukti pembayaran, dan validasi berkas fisik.",
        serviceHours: "Senin - Sabtu, 08.00 - 14.00"
      },
      {
        name: "Aula Timur Gedung B",
        description: "Pengukuran seragam, briefing orang tua, dan pembagian starter pack siswa baru.",
        serviceHours: "Sabtu, 09.00 - 12.00"
      }
    ],
    feeBreakdown: [
      { label: "Uang pangkal", amount: "Rp4.500.000" },
      { label: "Seragam & atribut", amount: "Rp1.250.000" },
      { label: "Learning kit digital", amount: "Rp450.000" }
    ],
    contactInfo: {
      officer: "Tim PSB EduCore Demo",
      phone: "0812-3456-7890",
      email: "psb-demo@educore.id"
    }
  }
};

function createFallbackPreset(companyName: string) {
  return {
    brandShortName: companyName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    tagline: "Presentasi demo PSB dengan alur yang rapi, cepat, dan mudah dipahami client.",
    heroNote: "Microsite demo untuk simulasi alur penerimaan siswa baru yang siap dipresentasikan ke client.",
    periodLabel: "PSB 2026/2027 Gelombang 1",
    waveLabel: "Gelombang aktif sampai kuota terpenuhi",
    primaryColor: "#1d4ed8",
    secondaryColor: "#0f172a",
    accentColor: "#d97706",
    programs: [
      {
        title: "Academic Excellence Track",
        description: "Kelas reguler dengan penguatan numerasi, literasi, dan evaluasi progres berkala.",
        audience: "Jenjang SD - SMA"
      },
      {
        title: "Character & Faith Program",
        description: "Pembiasaan karakter harian, mentoring, dan integrasi kegiatan penguatan nilai.",
        audience: "Jenjang TK - SMA"
      }
    ],
    processHighlights: [
      "Registrasi online, verifikasi berkas, wawancara, lalu pengumuman hasil.",
      "Dashboard menampilkan status dokumen, jadwal, dan langkah daftar ulang.",
      "Seluruh tampilan disiapkan untuk presentasi frontend-only."
    ],
    interviewSlots: [
      {
        title: "Sesi Reguler",
        time: "09 Juli 2026 · 09.00 - 10.00",
        location: "Ruang Konsultasi Gedung A"
      }
    ],
    serviceLocations: [
      {
        name: "Helpdesk PSB",
        description: "Pusat layanan informasi pendaftaran dan verifikasi dokumen.",
        serviceHours: "Senin - Jumat, 08.00 - 15.00"
      },
      {
        name: "Loket Daftar Ulang",
        description: "Pembayaran, validasi ulang, dan pengambilan informasi siswa baru.",
        serviceHours: "Senin - Sabtu, 08.00 - 14.00"
      }
    ],
    feeBreakdown: [
      { label: "Uang pangkal", amount: "Rp4.500.000" },
      { label: "Seragam & atribut", amount: "Rp1.250.000" }
    ],
    contactInfo: {
      officer: "Tim PSB EduCore Demo",
      phone: "0812-3456-7890",
      email: "psb-demo@educore.id"
    }
  };
}

export function formatCompanyName(companySlug: string): string {
  return decodeURIComponent(companySlug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function createMenuCards(companySlug: string): PsbMenuCard[] {
  const basePath = `/school-erp/psb/${encodeURIComponent(companySlug)}`;

  return [
    {
      title: "Homepage Demo",
      description: "Masuk ke landing page PSB dan lihat seluruh shortcut demo.",
      href: basePath,
      icon: LayoutDashboard
    },
    {
      title: "Pendaftaran Siswa Baru",
      description: "Isi formulir pendaftaran demo lengkap dengan informasi dokumen.",
      href: `${basePath}/register`,
      icon: UserPlus
    },
    {
      title: "Dashboard Pendaftar",
      description: "Pantau kelengkapan dokumen, timeline, dan catatan panitia.",
      href: `${basePath}/applicant-dashboard`,
      icon: ClipboardCheck
    },
    {
      title: "Dashboard Daftar Ulang",
      description: "Tampilkan langkah daftar ulang, deadline, dan lokasi layanan.",
      href: `${basePath}/accepted-dashboard`,
      icon: BellRing
    },
    {
      title: "Daftar Siswa Diterima",
      description: "Jelajahi data siswa diterima per periode PSB dengan filter tabel.",
      href: `${basePath}/accepted-students`,
      icon: FileSpreadsheet
    },
    {
      title: "Daftar Pendaftar",
      description: "Lihat seluruh pendaftar demo lengkap dengan status dan dokumen.",
      href: `${basePath}/applicants`,
      icon: ScrollText
    }
  ];
}

export function getApplicantRecords(): PsbApplicantRecord[] {
  return applicantSeeds.map((seed, index) => ({
    id: `applicant-${index + 1}`,
    registrationNo: `PSB-2026-${String(index + 1).padStart(4, "0")}`,
    fullName: seed[0],
    level: seed[1],
    pathway: seed[2],
    status: seed[3],
    documentStatus: seed[4],
    schoolOrigin: seed[5],
    submittedAt: seed[6]
  }));
}

export function getAcceptedRecords() {
  return getApplicantRecords().filter((record) => record.status === "Diterima" || record.status === "Cadangan");
}

export function getApplicantTimeline(): PsbTimelineItem[] {
  return [
    {
      title: "Formulir masuk",
      description: "Pendaftar sudah mengisi data dan menerima nomor registrasi demo.",
      status: "done",
      dateLabel: "01 Juli 2026"
    },
    {
      title: "Verifikasi dokumen",
      description: "Panitia memeriksa akta, kartu keluarga, dan rapor terakhir.",
      status: "done",
      dateLabel: "03 Juli 2026"
    },
    {
      title: "Wawancara orang tua",
      description: "Sesi wawancara terjadwal di Ruang Konsultasi Gedung A.",
      status: "current",
      dateLabel: "09 Juli 2026"
    },
    {
      title: "Pengumuman hasil",
      description: "Hasil seleksi diumumkan melalui dashboard dan kontak panitia.",
      status: "upcoming",
      dateLabel: "12 Juli 2026"
    }
  ];
}

export function getAcceptedSteps(): PsbAcceptedStep[] {
  return [
    {
      title: "Konfirmasi kursi",
      dueLabel: "Sebelum 15 Juli 2026",
      location: "Portal PSB / Helpdesk Gedung A",
      status: "Selesai",
      note: "Konfirmasi kursi sudah diterima melalui tombol persetujuan demo."
    },
    {
      title: "Bayar biaya daftar ulang",
      dueLabel: "16 Juli 2026, 08.00 - 15.00",
      location: "Lantai 1 Gedung A - Loket Keuangan",
      status: "Berjalan",
      note: "Siapkan bukti transfer atau lakukan pembayaran langsung di loket."
    },
    {
      title: "Pengukuran seragam",
      dueLabel: "17 Juli 2026, 09.00 - 12.00",
      location: "Aula Timur Gedung B",
      status: "Berikutnya",
      note: "Datang dengan membawa fotokopi KK dan kartu pendaftaran."
    },
    {
      title: "Briefing orang tua",
      dueLabel: "20 Juli 2026, 10.00",
      location: "Ruang Serbaguna Gedung A",
      status: "Berikutnya",
      note: "Panitia akan menjelaskan jadwal MPLS, seragam, dan grup komunikasi."
    }
  ];
}

export function getPsbDemoMeta(companySlug: string): PsbDemoMeta {
  const companyName = formatCompanyName(companySlug);
  const applicants = getApplicantRecords();
  const accepted = getAcceptedRecords();
  const preset = tenantPresetMap[decodeURIComponent(companySlug)] ?? createFallbackPreset(companyName);

  return {
    companySlug: decodeURIComponent(companySlug),
    schoolName: `${companyName} EduCore Academy`,
    brandShortName: preset.brandShortName,
    tagline: preset.tagline,
    periodLabel: preset.periodLabel,
    waveLabel: preset.waveLabel,
    heroNote: preset.heroNote,
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
    accentColor: preset.accentColor,
    stats: [
      { label: "Pendaftar aktif", value: String(applicants.length), caption: "Data demo periode berjalan" },
      { label: "Siswa diterima", value: String(accepted.length), caption: "Siap daftar ulang" },
      { label: "Tingkat kelengkapan", value: "87%", caption: "Rata-rata dokumen valid" }
    ],
    documents: [
      "Akta kelahiran / surat kenal lahir",
      "Kartu keluarga terbaru",
      "Pas foto 3x4 latar biru",
      "Rapor atau surat keterangan dari sekolah asal"
    ],
    programs: preset.programs,
    processHighlights: preset.processHighlights,
    interviewSlots: preset.interviewSlots,
    serviceLocations: preset.serviceLocations,
    feeBreakdown: preset.feeBreakdown,
    contactInfo: preset.contactInfo
  };
}
