"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { assignStudentsToClassroom, getClassroomById } from "../../../actions/classrooms";
import { getUnassignedStudents } from "../../../actions/students";
import { Button } from "../../../../components/ui/button";
import { Modal } from "../../../../components/ui/modal";
import { useTenant } from "../../../../components/tenant-context";

type ClassroomDetail = {
  id: string;
  name: string;
  academicYear: string;
  semester: number;
  homeroomTeacher: {
    id: string;
    nip: string;
    name: string;
  };
  students: Array<{
    id: string;
    nis: string;
    name: string;
    gender: string | null;
    isActive: boolean;
  }>;
  courseOfferings: Array<{
    id: string;
    term: string;
    academicYear: string;
    section: string | null;
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
      nip: string;
      name: string;
    } | null;
  }>;
};

type UnassignedStudent = {
  id: string;
  nis: string;
  name: string;
  gender: string | null;
};

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function ClassroomDetailPage() {
  const params = useParams<{ id: string }>();
  const classroomId = params?.id;
  const { selectedTenant } = useTenant();

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unassignedStudents, setUnassignedStudents] = useState<UnassignedStudent[]>([]);
  const [isUnassignedLoading, setIsUnassignedLoading] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadClassroom() {
    if (!classroomId) {
      setErrorMessage("ID kelas tidak valid.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const detail = await getClassroomById(classroomId, selectedTenant);
      if (!detail) {
        setErrorMessage("Kelas tidak ditemukan untuk tenant aktif.");
        setClassroom(null);
        return;
      }

      setClassroom(detail as ClassroomDetail);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat detail kelas.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadClassroom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, selectedTenant]);

  async function openAssignModal() {
    setIsModalOpen(true);
    setModalError(null);
    setSelectedStudentIds([]);

    try {
      setIsUnassignedLoading(true);
      const rows = await getUnassignedStudents(selectedTenant);
      setUnassignedStudents(rows as UnassignedStudent[]);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Gagal memuat siswa yang belum punya kelas.");
    } finally {
      setIsUnassignedLoading(false);
    }
  }

  const selectedCount = selectedStudentIds.length;

  const scheduleRows = useMemo(() => {
    if (!classroom) {
      return [];
    }

    return classroom.courseOfferings;
  }, [classroom]);

  function toggleSelection(studentId: string) {
    setSelectedStudentIds((previous) =>
      previous.includes(studentId) ? previous.filter((id) => id !== studentId) : [...previous, studentId]
    );
  }

  function saveAssignedStudents() {
    if (!classroom) {
      return;
    }

    startTransition(async () => {
      setModalError(null);

      const result = await assignStudentsToClassroom(classroom.id, selectedStudentIds, selectedTenant);
      if (!result.success) {
        setModalError(result.error);
        return;
      }

      setIsModalOpen(false);
      await loadClassroom();
    });
  }

  if (isLoading) {
    return (
      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <DetailSkeleton />
      </section>
    );
  }

  if (!classroom) {
    return (
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-xl font-bold text-slate-900">Detail Kelas</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage ?? "Kelas tidak ditemukan."}
        </div>
        <Link
          href="/academics/classrooms"
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{classroom.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tahun Ajaran {classroom.academicYear} • Semester {classroom.semester}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Wali Kelas: <span className="font-semibold text-slate-900">{classroom.homeroomTeacher.name}</span> ({classroom.homeroomTeacher.nip})
          </p>
        </div>

        <Link
          href="/academics/classrooms"
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </header>

      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Jadwal Pelajaran</h2>
          <p className="mt-1 text-sm text-slate-500">Daftar mapel yang terhubung ke kelas ini.</p>

          {scheduleRows.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              Belum ada jadwal pelajaran untuk kelas ini.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {scheduleRows.map((offering) => (
                <div key={offering.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{offering.course.name}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {offering.course.code}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {offering.dayOfWeek ?? "Hari belum diatur"} • {offering.startTime ?? "--:--"} - {offering.endTime ?? "--:--"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Pengajar: {offering.lecturer?.name ?? "Belum ditentukan"}
                    {offering.room ? ` • Ruang ${offering.room}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Daftar Siswa</h2>
              <p className="mt-1 text-sm text-slate-500">Total siswa: {classroom.students.length}</p>
            </div>
            <Button onClick={openAssignModal}>+ Tambah Siswa</Button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">NIS</th>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Gender</th>
                </tr>
              </thead>
              <tbody>
                {classroom.students.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-500">
                      Belum ada siswa di kelas ini.
                    </td>
                  </tr>
                ) : (
                  classroom.students.map((student) => (
                    <tr key={student.id} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-700">{student.nis}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">{student.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{student.gender ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Siswa ke Kelas">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Pilih siswa yang belum memiliki rombel, lalu klik Simpan untuk menambahkan ke kelas {classroom.name}.
          </p>

          {modalError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{modalError}</div> : null}

          {isUnassignedLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Memuat daftar siswa...</div>
          ) : unassignedStudents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Semua siswa aktif sudah memiliki rombel.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Pilih</th>
                    <th className="px-3 py-2">NIS</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedStudents.map((student) => (
                    <tr key={student.id} className="border-t border-slate-100">
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleSelection(student.id)}
                          aria-label={`Pilih ${student.name}`}
                          className="rounded border-slate-300 accent-amber-500"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-700">{student.nis}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">{student.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{student.gender ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <p className="text-sm text-slate-600">Dipilih: {selectedCount} siswa</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button
                onClick={saveAssignedStudents}
                disabled={isPending || selectedCount === 0}
              >
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}
