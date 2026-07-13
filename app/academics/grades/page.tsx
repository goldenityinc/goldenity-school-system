"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "../../../components/ui/button";
import { useTenant } from "../../../components/tenant-context";
import { getCourseOfferingById, getCourseOfferings } from "../../actions/academics";
import { getGradesByCourseOffering, inputGrade } from "../../actions/grades";

type CourseOfferingOption = {
  id: string;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  course: {
    code: string;
    name: string;
  };
  classroom: {
    name: string;
  } | null;
};

type EnrollmentRow = {
  id: string;
  studentId: string;
  student: {
    id: string;
    nis: string;
    name: string;
  };
};

type GradeType = "TUGAS" | "UTS" | "UAS";

type StudentScoreForm = {
  TUGAS: string;
  UTS: string;
  UAS: string;
};

const gradeTypes: GradeType[] = ["TUGAS", "UTS", "UAS"];

function GradeTableSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export default function GradesPage() {
  const { selectedTenant, activeTenantLabel } = useTenant();

  const [offerings, setOfferings] = useState<CourseOfferingOption[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [scoreByStudent, setScoreByStudent] = useState<Record<string, StudentScoreForm>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedOfferingLabel = useMemo(() => {
    const selectedOffering = offerings.find((offering) => offering.id === selectedOfferingId);
    if (!selectedOffering) {
      return "";
    }

    return `${selectedOffering.course.code} - ${selectedOffering.course.name}`;
  }, [offerings, selectedOfferingId]);

  useEffect(() => {
    let isActive = true;

    async function loadOfferings() {
      try {
        setIsLoading(true);
        setPageError(null);

        const offeringRows = await getCourseOfferings(selectedTenant);

        if (!isActive) {
          return;
        }

        setOfferings(offeringRows as CourseOfferingOption[]);
        setSelectedOfferingId((previous) => previous || offeringRows[0]?.id || "");
      } catch (error) {
        if (isActive) {
          setPageError(error instanceof Error ? error.message : "Gagal memuat jadwal kelas.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadOfferings();

    return () => {
      isActive = false;
    };
  }, [selectedTenant]);

  useEffect(() => {
    let isActive = true;

    async function loadStudentsAndGrades() {
      if (!selectedOfferingId) {
        if (isActive) {
          setEnrollments([]);
          setScoreByStudent({});
        }
        return;
      }

      try {
        setIsLoadingStudents(true);
        setPageError(null);
        setSuccessMessage(null);

        const [offeringDetail, gradeRows] = await Promise.all([
          getCourseOfferingById(selectedTenant, selectedOfferingId),
          getGradesByCourseOffering(selectedTenant, selectedOfferingId)
        ]);

        if (!isActive) {
          return;
        }

        if (!offeringDetail) {
          setEnrollments([]);
          setScoreByStudent({});
          setPageError("Jadwal kelas tidak ditemukan.");
          return;
        }

        const enrollmentRows = offeringDetail.enrollments.map((enrollment) => ({
          id: enrollment.id,
          studentId: enrollment.studentId,
          student: {
            id: enrollment.student.id,
            nis: enrollment.student.nis,
            name: enrollment.student.name
          }
        }));

        const initialScores: Record<string, StudentScoreForm> = {};

        for (const enrollment of enrollmentRows) {
          initialScores[enrollment.studentId] = {
            TUGAS: "",
            UTS: "",
            UAS: ""
          };
        }

        for (const grade of gradeRows) {
          const gradeType = grade.type as GradeType;

          if (!gradeTypes.includes(gradeType)) {
            continue;
          }

          if (!initialScores[grade.studentId]) {
            initialScores[grade.studentId] = {
              TUGAS: "",
              UTS: "",
              UAS: ""
            };
          }

          initialScores[grade.studentId][gradeType] = String(grade.score);
        }

        setEnrollments(enrollmentRows);
        setScoreByStudent(initialScores);
      } catch (error) {
        if (isActive) {
          setPageError(error instanceof Error ? error.message : "Gagal memuat daftar siswa kelas.");
          setEnrollments([]);
          setScoreByStudent({});
        }
      } finally {
        if (isActive) {
          setIsLoadingStudents(false);
        }
      }
    }

    void loadStudentsAndGrades();

    return () => {
      isActive = false;
    };
  }, [selectedOfferingId, selectedTenant]);

  function updateScore(studentId: string, type: GradeType, value: string) {
    setScoreByStudent((previous) => ({
      ...previous,
      [studentId]: {
        ...(previous[studentId] ?? { TUGAS: "", UTS: "", UAS: "" }),
        [type]: value
      }
    }));
  }

  function handleSaveRow(studentId: string) {
    if (!selectedOfferingId) {
      return;
    }

    const values = scoreByStudent[studentId] ?? { TUGAS: "", UTS: "", UAS: "" };

    startTransition(async () => {
      setSavingStudentId(studentId);
      setPageError(null);
      setSuccessMessage(null);

      const entries = gradeTypes.filter((type) => values[type] !== "");

      if (entries.length === 0) {
        setPageError("Isi minimal satu nilai sebelum menyimpan.");
        setSavingStudentId(null);
        return;
      }

      for (const type of entries) {
        const result = await inputGrade(selectedTenant, studentId, selectedOfferingId, type, Number(values[type]));

        if (!result.success) {
          setPageError(result.error);
          setSavingStudentId(null);
          return;
        }
      }

      setSuccessMessage("Nilai berhasil disimpan.");
      setSavingStudentId(null);
    });
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Input Nilai</h1>
          <p className="mt-1 text-sm text-slate-600">
            Input nilai Tugas, UTS, dan UAS untuk tenant aktif: {activeTenantLabel} ({selectedTenant})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/academics"
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kembali ke Akademik
          </Link>
          <Link
            href="/academics/classrooms"
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Manajemen Rombel
          </Link>
        </div>
      </header>

      {pageError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</div> : null}
      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="offering-select" className="block text-sm font-medium text-slate-700">
          Pilih Jadwal Kelas
        </label>
        <select
          id="offering-select"
          value={selectedOfferingId}
          onChange={(event) => setSelectedOfferingId(event.target.value)}
          className="h-10 w-full max-w-2xl rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
          disabled={isLoading}
        >
          <option value="">Pilih jadwal kelas</option>
          {offerings.map((offering) => (
            <option key={offering.id} value={offering.id}>
              {offering.dayOfWeek ?? "-"} {offering.startTime ?? "-"}-{offering.endTime ?? "-"} • {offering.classroom?.name ?? "Tanpa Rombel"} • {offering.course.code} {offering.course.name}
            </option>
          ))}
        </select>
      </div>

      {selectedOfferingLabel ? <p className="text-sm font-medium text-slate-700">Jadwal terpilih: {selectedOfferingLabel}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        {isLoadingStudents ? (
          <GradeTableSkeleton />
        ) : enrollments.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-slate-500">Belum ada siswa pada jadwal kelas ini.</div>
        ) : (
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2">NIS</th>
                <th className="border-b border-slate-200 px-3 py-2">Nama Siswa</th>
                <th className="border-b border-slate-200 px-3 py-2">Tugas</th>
                <th className="border-b border-slate-200 px-3 py-2">UTS</th>
                <th className="border-b border-slate-200 px-3 py-2">UAS</th>
                <th className="border-b border-slate-200 px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => {
                const scores = scoreByStudent[enrollment.studentId] ?? { TUGAS: "", UTS: "", UAS: "" };
                const isSavingThisRow = isPending && savingStudentId === enrollment.studentId;

                return (
                  <tr key={enrollment.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs text-slate-700">{enrollment.student.nis}</td>
                    <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{enrollment.student.name}</td>
                    {gradeTypes.map((type) => (
                      <td key={type} className="border-b border-slate-100 px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scores[type]}
                          onChange={(event) => updateScore(enrollment.studentId, type, event.target.value)}
                          className="h-9 w-24 rounded-md border border-slate-200 px-2 text-sm outline-none ring-yellow-500 focus:ring-2"
                          placeholder="0-100"
                        />
                      </td>
                    ))}
                    <td className="border-b border-slate-100 px-3 py-3 text-right">
                      <Button size="sm" onClick={() => handleSaveRow(enrollment.studentId)} disabled={isSavingThisRow}>
                        {isSavingThisRow ? "Menyimpan..." : "Simpan Nilai"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
