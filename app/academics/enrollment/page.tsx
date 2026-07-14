"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, type DragEvent } from "react";
import { Button } from "../../../components/ui/button";
import { useTenant } from "../../../components/tenant-context";
import { enrollStudents, getEnrollmentData, moveStudent, unenrollStudent } from "../../actions/enrollments";

type ViewMode = "bulk" | "dnd";

type StudentItem = {
  id: string;
  nis: string;
  name: string;
};

type EnrollmentItem = {
  id: string;
  studentId: string;
  status: string;
  student: StudentItem;
};

type CourseOfferingItem = {
  id: string;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  term: string;
  academicYear: string;
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
  enrollments: EnrollmentItem[];
};

type DragPayload = {
  studentId: string;
  source: "unassigned" | string;
};

function formatOfferingLabel(offering: CourseOfferingItem) {
  const schedule = [offering.dayOfWeek, offering.startTime && offering.endTime ? `${offering.startTime}-${offering.endTime}` : null]
    .filter(Boolean)
    .join(" • ");

  const roomLabel = offering.room ? ` • ${offering.room}` : "";

  return `${offering.course.code} - ${offering.course.name}${schedule ? ` (${schedule}${roomLabel})` : ""}`;
}

export default function EnrollmentPage() {
  const { selectedTenant, activeTenantLabel } = useTenant();
  const [viewMode, setViewMode] = useState<ViewMode>("bulk");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOfferingItem[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setErrorMessage(null);
      const payload = await getEnrollmentData(selectedTenant);

      setStudents(payload.students as StudentItem[]);
      setCourseOfferings(payload.courseOfferings as CourseOfferingItem[]);
      setSelectedStudentIds([]);
      setSelectedOfferingId((previous) => previous || payload.courseOfferings[0]?.id || "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data enrollment");
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    let active = true;

    async function sync() {
      if (!active) {
        return;
      }
      await loadData();
    }

    void sync();

    return () => {
      active = false;
    };
  }, [selectedTenant, loadData]);

  const enrolledStudentIds = useMemo(() => {
    return new Set(courseOfferings.flatMap((offering) => offering.enrollments.map((enrollment) => enrollment.studentId)));
  }, [courseOfferings]);

  const unassignedStudents = useMemo(() => {
    return students.filter((student) => !enrolledStudentIds.has(student.id));
  }, [students, enrolledStudentIds]);

  const allStudentIds = useMemo(() => students.map((student) => student.id), [students]);

  const isAllSelected = useMemo(() => {
    return allStudentIds.length > 0 && allStudentIds.every((id) => selectedStudentIds.includes(id));
  }, [allStudentIds, selectedStudentIds]);

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedStudentIds([]);
      return;
    }

    setSelectedStudentIds(allStudentIds);
  }

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((previous) =>
      previous.includes(studentId) ? previous.filter((id) => id !== studentId) : [...previous, studentId]
    );
  }

  function handleBulkEnroll() {
    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await enrollStudents(selectedTenant, selectedStudentIds, selectedOfferingId);

      if (!result.success) {
        const details = [result.error, result.errors?.studentIds, result.errors?.courseOfferingId].filter(Boolean).join(". ");
        setErrorMessage(details || "Gagal memproses enrollment");
        return;
      }

      setSuccessMessage(`${result.createdCount} siswa berhasil didaftarkan${result.skippedCount ? ` (${result.skippedCount} dilewati)` : ""}.`);
      await loadData();
    });
  }

  function parseDragPayload(raw: string | null): DragPayload | null {
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as DragPayload;

      if (!parsed.studentId || !parsed.source) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  function getDragPayload(event: DragEvent<HTMLElement>): DragPayload | null {
    const fromEvent = parseDragPayload(event.dataTransfer.getData("application/json"));
    return fromEvent ?? dragPayload;
  }

  function handleDragStart(event: DragEvent<HTMLElement>, studentId: string, source: "unassigned" | string) {
    const payload: DragPayload = { studentId, source };
    setDragPayload(payload);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
  }

  function handleDragEnd() {
    setDragPayload(null);
  }

  function handleDropToOffering(event: DragEvent<HTMLElement>, offeringId: string) {
    event.preventDefault();

    const payload = getDragPayload(event);

    if (!payload) {
      return;
    }

    const student = students.find((item) => item.id === payload.studentId);

    if (!student) {
      setDragPayload(null);
      return;
    }

    if (payload.source === offeringId) {
      setDragPayload(null);
      return;
    }

    const targetOffering = courseOfferings.find((offering) => offering.id === offeringId);
    const alreadyEnrolled = targetOffering?.enrollments.some((enrollment) => enrollment.studentId === payload.studentId);

    const optimisticEnrollment: EnrollmentItem = {
      id: `temp-${offeringId}-${payload.studentId}`,
      studentId: payload.studentId,
      status: "ENROLLED",
      student
    };

    setCourseOfferings((previous) =>
      previous.map((offering) => {
        if (payload.source !== "unassigned" && offering.id === payload.source) {
          return {
            ...offering,
            enrollments: offering.enrollments.filter((enrollment) => enrollment.studentId !== payload.studentId)
          };
        }

        if (offering.id === offeringId) {
          const hasStudent = offering.enrollments.some((enrollment) => enrollment.studentId === payload.studentId);

          if (hasStudent || alreadyEnrolled) {
            return offering;
          }

          return { ...offering, enrollments: [optimisticEnrollment, ...offering.enrollments] };
        }

        return offering;
      })
    );

    const currentStudentId = payload.studentId;
    const source = payload.source;
    setDragPayload(null);

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const result =
        source === "unassigned"
          ? await enrollStudents(selectedTenant, [currentStudentId], offeringId)
          : await moveStudent(selectedTenant, currentStudentId, source, offeringId);

      if (!result.success) {
        setErrorMessage(result.error || "Gagal memproses drag and drop");
        await loadData();
        return;
      }

      setSuccessMessage(source === "unassigned" ? "Siswa berhasil didaftarkan ke kelas." : "Siswa berhasil dipindahkan antar kelas.");
      await loadData();
    });
  }

  function handleDropToUnassigned(event: DragEvent<HTMLElement>) {
    event.preventDefault();

    const payload = getDragPayload(event);

    if (!payload || payload.source === "unassigned") {
      setDragPayload(null);
      return;
    }

    setCourseOfferings((previous) =>
      previous.map((offering) =>
        offering.id === payload.source
          ? {
              ...offering,
              enrollments: offering.enrollments.filter((enrollment) => enrollment.studentId !== payload.studentId)
            }
          : offering
      )
    );

    const currentStudentId = payload.studentId;
    const currentSource = payload.source;
    setDragPayload(null);

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await unenrollStudent(selectedTenant, currentStudentId, currentSource);

      if (!result.success) {
        setErrorMessage(result.error || "Gagal mengeluarkan siswa dari kelas");
        await loadData();
        return;
      }

      setSuccessMessage("Siswa berhasil dikembalikan ke daftar belum terdaftar.");
      await loadData();
    });
  }

  function handleQuickUnenroll(studentId: string, offeringId: string) {
    setCourseOfferings((previous) =>
      previous.map((offering) =>
        offering.id === offeringId
          ? {
              ...offering,
              enrollments: offering.enrollments.filter((enrollment) => enrollment.studentId !== studentId)
            }
          : offering
      )
    );

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await unenrollStudent(selectedTenant, studentId, offeringId);

      if (!result.success) {
        setErrorMessage(result.error || "Gagal mengeluarkan siswa dari kelas");
        await loadData();
        return;
      }

      setSuccessMessage("Siswa dikeluarkan dari kelas.");
      await loadData();
    });
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enrollment Kelas</h1>
          <p className="mt-1 text-sm text-slate-600">Atur pendaftaran siswa ke kelas sekolah.</p>
        </div>
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("bulk")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === "bulk" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
          >
            Mode Cepat (Bulk)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("dnd")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === "dnd" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
          >
            Mode Visual (Drag & Drop)
          </button>
        </div>
      </div>

      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div> : null}
      {successMessage ? <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</div> : null}

      {isLoadingData ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : null}

      {!isLoadingData && viewMode === "bulk" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedOfferingId}
              onChange={(event) => setSelectedOfferingId(event.target.value)}
              className="h-10 min-w-[300px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            >
              <option value="">Pilih kelas tujuan</option>
              {courseOfferings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {formatOfferingLabel(offering)}
                </option>
              ))}
            </select>

            <Button
              onClick={handleBulkEnroll}
              disabled={isSubmitting || selectedStudentIds.length === 0 || !selectedOfferingId}
            >
              {isSubmitting ? "Memproses..." : "Daftarkan Siswa"}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2">
                    <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} aria-label="Select all students" />
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2">NIS</th>
                  <th className="border-b border-slate-200 px-3 py-2">Nama</th>
                  <th className="border-b border-slate-200 px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-slate-500" colSpan={4}>
                      Belum ada siswa aktif.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const checked = selectedStudentIds.includes(student.id);
                    const isAssigned = enrolledStudentIds.has(student.id);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(student.id)}
                            aria-label={`Select ${student.name}`}
                          />
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs text-slate-700">{student.nis}</td>
                        <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{student.name}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{isAssigned ? "Sudah punya kelas" : "Belum terdaftar"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!isLoadingData && viewMode === "dnd" ? (
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Belum Terdaftar</h2>
            <p className="mt-1 text-xs text-slate-500">Drag kartu siswa ke kelas di kanan, atau drop kembali ke sini untuk unenroll.</p>
            {isSubmitting ? <p className="mt-1 text-xs text-amber-600">Memproses perpindahan...</p> : null}
            <div
              className="mt-3 space-y-2 rounded-lg border border-dashed border-slate-300 bg-white/70 p-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDropToUnassigned}
            >
              {unassignedStudents.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">Semua siswa sudah memiliki kelas.</p>
              ) : (
                unassignedStudents.map((student) => (
                  <article
                    key={student.id}
                    draggable={!isSubmitting}
                    onDragStart={(event) => handleDragStart(event, student.id, "unassigned")}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                  >
                    <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-600">{student.nis}</p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            {courseOfferings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                Belum ada kelas. Buat Course Offering terlebih dahulu di modul Akademik.
              </div>
            ) : (
              courseOfferings.map((offering) => (
                <section
                  key={offering.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropToOffering(event, offering.id)}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{offering.course.name}</h3>
                      <p className="text-xs text-slate-500">{offering.course.code} · {offering.dayOfWeek ?? "-"} {offering.startTime ?? "--:--"}-{offering.endTime ?? "--:--"} · {offering.room || "Tanpa ruang"}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{offering.enrollments.length} siswa</span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {offering.enrollments.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">Drop siswa di sini</div>
                    ) : (
                      offering.enrollments.map((enrollment) => (
                        <article
                          key={enrollment.id}
                          draggable={!isSubmitting}
                          onDragStart={(event) => handleDragStart(event, enrollment.studentId, offering.id)}
                          onDragEnd={handleDragEnd}
                          className="cursor-grab rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-slate-700 active:cursor-grabbing"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">{enrollment.student.name}</p>
                              <p className="font-mono text-slate-600">{enrollment.student.nis}</p>
                            </div>
                            <button
                              type="button"
                              className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                              onClick={() => handleQuickUnenroll(enrollment.studentId, offering.id)}
                              disabled={isSubmitting}
                              aria-label={`Keluarkan ${enrollment.student.name}`}
                            >
                              Keluarkan
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
