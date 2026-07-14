"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTenant } from "../../../../components/tenant-context";
import { getStudentGrades } from "../../../actions/grades";
import { getStudentById } from "../../../actions/students";

type StudentProfile = {
  id: string;
  nis: string;
  name: string;
  classroom: {
    id: string;
    name: string;
    academicYear: string;
    semester: number;
  } | null;
};

type GradeRow = {
  id: string;
  studentId: string;
  courseOfferingId: string;
  type: string;
  score: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  courseOffering: {
    id: string;
    term: string;
    academicYear: string;
    lecturer: {
      id: string;
      name: string;
      nip: string;
    } | null;
    courseCode: string;
    courseName: string;
  };
};

type SubjectReport = {
  courseOfferingId: string;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  scores: {
    TUGAS: number | null;
    UTS: number | null;
    UAS: number | null;
  };
  finalScore: number;
  gradeLetter: "A" | "B" | "C" | "D";
};

function toGradeLetter(score: number): "A" | "B" | "C" | "D" {
  if (score >= 90) {
    return "A";
  }

  if (score >= 80) {
    return "B";
  }

  if (score >= 70) {
    return "C";
  }

  return "D";
}

function scoreOrZero(value: number | null) {
  return value ?? 0;
}

export default function StudentReportCardPage() {
  const params = useParams<{ id: string }>();
  const { selectedTenant } = useTenant();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [grades, setGrades] = useState<GradeRow[]>([]);
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

    async function loadReportCard() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setIsNotFound(false);

        const [studentResult, gradeRows] = await Promise.all([
          getStudentById(selectedTenant, params.id),
          getStudentGrades(selectedTenant, params.id)
        ]);

        if (!isActive) {
          return;
        }

        if (!studentResult) {
          setIsNotFound(true);
          setStudent(null);
          setGrades([]);
          return;
        }

        setStudent({
          id: studentResult.id,
          nis: studentResult.nis,
          name: studentResult.name,
          classroom: studentResult.classroom
        });
        setGrades(gradeRows as GradeRow[]);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Gagal memuat rapor akademik.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadReportCard();

    return () => {
      isActive = false;
    };
  }, [params.id, selectedTenant]);

  const reportBySubject = useMemo<SubjectReport[]>(() => {
    const grouped = new Map<string, SubjectReport>();

    for (const grade of grades) {
      const key = grade.courseOfferingId;
      const gradeType = grade.type.trim().toUpperCase();

      if (!grouped.has(key)) {
        grouped.set(key, {
          courseOfferingId: grade.courseOfferingId,
          courseCode: grade.courseOffering.courseCode,
          courseName: grade.courseOffering.courseName,
          lecturerName: grade.courseOffering.lecturer?.name ?? "-",
          scores: {
            TUGAS: null,
            UTS: null,
            UAS: null
          },
          finalScore: 0,
          gradeLetter: "D"
        });
      }

      const subject = grouped.get(key);

      if (!subject) {
        continue;
      }

      if (gradeType === "TUGAS" || gradeType === "UTS" || gradeType === "UAS") {
        subject.scores[gradeType] = grade.score;
      }
    }

    const reports = Array.from(grouped.values());

    for (const report of reports) {
      const tugas = scoreOrZero(report.scores.TUGAS);
      const uts = scoreOrZero(report.scores.UTS);
      const uas = scoreOrZero(report.scores.UAS);
      const finalScore = tugas * 0.3 + uts * 0.3 + uas * 0.4;

      report.finalScore = Number(finalScore.toFixed(2));
      report.gradeLetter = toGradeLetter(report.finalScore);
    }

    return reports.sort((a, b) => a.courseName.localeCompare(b.courseName));
  }, [grades]);

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
        <p className="text-sm text-slate-600">Siswa yang Anda cari tidak tersedia.</p>
        <Link href="/students" className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Kembali ke daftar siswa
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft print:border-none print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapor Akademik</h1>
          <p className="mt-1 text-sm text-slate-600">Ringkasan nilai siswa berdasarkan mata pelajaran.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Cetak Rapor
          </button>
          <Link href={`/students/${student.id}`} className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Kembali ke Profil
          </Link>
        </div>
      </header>

      <header className="rounded-lg border border-slate-200 bg-slate-50 p-4 print:border-none print:bg-white print:p-0">
        <h2 className="text-xl font-bold text-slate-900">Rapor Akademik</h2>
        <p className="mt-2 text-sm text-slate-700">Nama: <span className="font-semibold text-slate-900">{student.name}</span></p>
        <p className="mt-1 text-sm text-slate-700">NIS: <span className="font-mono text-slate-900">{student.nis}</span></p>
        <p className="mt-1 text-sm text-slate-700">
          Kelas: <span className="font-semibold text-slate-900">{student.classroom?.name ?? "Belum ditetapkan"}</span>
        </p>
      </header>

      {reportBySubject.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
          Belum ada nilai untuk siswa ini.
        </div>
      ) : (
        <div className="space-y-4">
          {reportBySubject.map((subject) => (
            <article key={subject.courseOfferingId} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{subject.courseName}</h3>
                  <p className="text-sm text-slate-600">{subject.courseCode}</p>
                  <p className="mt-1 text-sm text-slate-700">Guru: {subject.lecturerName}</p>
                </div>
                <div className="rounded-md bg-slate-100 px-3 py-2 text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Huruf Mutu</p>
                  <p className="text-xl font-bold text-slate-900">{subject.gradeLetter}</p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="border-b border-slate-200 px-3 py-2">Tugas (30%)</th>
                      <th className="border-b border-slate-200 px-3 py-2">UTS (30%)</th>
                      <th className="border-b border-slate-200 px-3 py-2">UAS (40%)</th>
                      <th className="border-b border-slate-200 px-3 py-2">Nilai Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{subject.scores.TUGAS ?? "-"}</td>
                      <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{subject.scores.UTS ?? "-"}</td>
                      <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{subject.scores.UAS ?? "-"}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-lg font-bold text-slate-900">{subject.finalScore}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
