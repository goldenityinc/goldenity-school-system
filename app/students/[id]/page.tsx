"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTenant } from "../../../components/tenant-context";
import { getStudentById } from "../../actions/students";

type StudentDetail = {
  id: string;
  nis: string;
  name: string;
  gender: string | null;
  placeOfBirth: string | null;
  dateOfBirth: string | null;
  address: string | null;
  fatherName: string | null;
  motherName: string | null;
  parentPhone: string | null;
  parentJob: string | null;
  previousSchool: string | null;
  classroom: {
    id: string;
    name: string;
    academicYear: string;
    semester: number;
  } | null;
  enrollments: Array<{
    id: string;
    status: string;
    dayOfWeek: string | null;
    startTime: string | null;
    endTime: string | null;
    room: string | null;
    course: {
      id: string;
      code: string;
      name: string;
    };
    lecturer: {
      id: string;
      name: string;
      nip: string;
    } | null;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function ItemRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value?.trim() ? value : "-"}</span>
    </div>
  );
}

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const { selectedTenant } = useTenant();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!selectedTenant) {
      return () => {
        isActive = false;
      };
    }

    async function loadStudent() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setIsNotFound(false);

        const result = await getStudentById(selectedTenant, params.id);

        if (!isActive) {
          return;
        }

        if (!result) {
          setIsNotFound(true);
          setStudent(null);
          return;
        }

        setStudent(result as StudentDetail);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Gagal memuat detail siswa.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadStudent();

    return () => {
      isActive = false;
    };
  }, [params.id, selectedTenant]);

  if (isLoading) {
    return (
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {errorMessage}
      </section>
    );
  }

  if (isNotFound || !student) {
    return (
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-xl font-bold text-slate-900">Data Siswa Tidak Ditemukan</h1>
        <p className="text-sm text-slate-600">Siswa yang Anda cari tidak tersedia pada tenant aktif.</p>
        <Link href="/students" className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Kembali
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
          <p className="mt-1 text-sm text-slate-600">NIS: <span className="font-mono">{student.nis}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/students/${student.id}/report-card`}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Lihat Rapor Akademik
          </Link>
          <Link href="/students" className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Kembali
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-900">Data Pribadi</h2>
          <ItemRow label="Gender" value={student.gender} />
          <ItemRow label="Tempat Lahir" value={student.placeOfBirth} />
          <ItemRow label="Tanggal Lahir" value={formatDate(student.dateOfBirth)} />
          <ItemRow label="Alamat" value={student.address} />
        </article>

        <article className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-900">Data Orang Tua / Wali</h2>
          <ItemRow label="Ayah" value={student.fatherName} />
          <ItemRow label="Ibu" value={student.motherName} />
          <ItemRow label="Telepon" value={student.parentPhone} />
          <ItemRow label="Pekerjaan" value={student.parentJob} />
        </article>

        <article className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-900">Riwayat Akademik</h2>
          <ItemRow label="Sekolah Asal" value={student.previousSchool} />
        </article>
      </div>

      <article className="space-y-4 rounded-lg border border-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-900">Kelas & Jadwal Aktif</h2>

        {student.enrollments.length === 0 ? (
          <p className="text-sm text-slate-600">Siswa ini belum terdaftar di kelas manapun.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2">Mata Pelajaran</th>
                  <th className="border-b border-slate-200 px-3 py-2">Guru Pengajar</th>
                  <th className="border-b border-slate-200 px-3 py-2">Jadwal</th>
                  <th className="border-b border-slate-200 px-3 py-2">Ruangan</th>
                </tr>
              </thead>
              <tbody>
                {student.enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-3">
                      <div className="font-medium text-slate-900">{enrollment.course.name}</div>
                      <div className="text-xs text-slate-500">{enrollment.course.code}</div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{enrollment.lecturer?.name ?? "-"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                      {enrollment.dayOfWeek ?? "-"} {enrollment.startTime && enrollment.endTime ? `${enrollment.startTime} - ${enrollment.endTime}` : ""}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{enrollment.room ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
