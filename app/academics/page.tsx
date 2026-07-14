"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { useTenant } from "../../components/tenant-context";
import {
  createCourse,
  createCourseOffering,
  createLecturer,
  getCourseOfferingById,
  getCourseOfferings,
  getCourses,
  getLecturers
} from "../actions/academics";
import { getClassrooms } from "../actions/classrooms";

type TabKey = "lecturers" | "courses" | "classes";

type LecturerRow = {
  id: string;
  nip: string;
  name: string;
  email: string;
  specialization: string | null;
  createdAt: string;
};

type CourseRow = {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string | null;
  createdAt: string;
};

type CourseOfferingRow = {
  id: string;
  courseId: string;
  lecturerId: string | null;
  classroomId: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  term: string;
  academicYear: string;
  section: string | null;
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
  classroom: {
    id: string;
    name: string;
    academicYear: string;
    semester: number;
  } | null;
};

type ClassroomOption = {
  id: string;
  name: string;
  academicYear: string;
  semester: number;
};

type CourseOfferingDetail = {
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
  classroom: {
    id: string;
    name: string;
    academicYear: string;
    semester: number;
  } | null;
  enrollments: Array<{
    id: string;
    studentId: string;
    status: string;
    student: {
      id: string;
      nis: string;
      name: string;
      gender: string | null;
    };
  }>;
};

type LecturerFormErrors = {
  nip?: string;
  name?: string;
  specialization?: string;
};

type CourseFormErrors = {
  code?: string;
  name?: string;
  credits?: string;
};

type CourseOfferingFormErrors = {
  courseId?: string;
  lecturerId?: string;
  classroomId?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
};

const weekDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;

function LecturerSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function CourseSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function OfferingSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 p-3">
          <div className="mb-3 h-5 animate-pulse rounded bg-slate-100" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((__, rowIndex) => (
              <div key={rowIndex} className="h-20 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function sortByStartTime(a: CourseOfferingRow, b: CourseOfferingRow) {
  const first = a.startTime ?? "99:99";
  const second = b.startTime ?? "99:99";
  return first.localeCompare(second);
}

export default function AcademicsPage() {
  const { activeTenantLabel, selectedTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<TabKey>("lecturers");
  const [lecturers, setLecturers] = useState<LecturerRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOfferingRow[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLecturerModalOpen, setIsLecturerModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassDetail, setSelectedClassDetail] = useState<CourseOfferingDetail | null>(null);
  const [isLoadingClassDetail, setIsLoadingClassDetail] = useState(false);
  const [classDetailError, setClassDetailError] = useState<string | null>(null);
  const [isLecturerPending, startLecturerTransition] = useTransition();
  const [isCoursePending, startCourseTransition] = useTransition();
  const [isOfferingPending, startOfferingTransition] = useTransition();
  const [lecturerForm, setLecturerForm] = useState({ nip: "", name: "", specialization: "" });
  const [courseForm, setCourseForm] = useState({ code: "", name: "", credits: "3" });
  const [offeringForm, setOfferingForm] = useState({
    courseId: "",
    lecturerId: "",
    classroomId: "",
    dayOfWeek: "Senin",
    startTime: "07:30",
    endTime: "09:00",
    room: ""
  });
  const [lecturerErrors, setLecturerErrors] = useState<LecturerFormErrors>({});
  const [courseErrors, setCourseErrors] = useState<CourseFormErrors>({});
  const [offeringErrors, setOfferingErrors] = useState<CourseOfferingFormErrors>({});

  const tabItems = useMemo(
    () => [
      { key: "lecturers" as const, label: "Daftar Guru", count: lecturers.length },
      { key: "courses" as const, label: "Mata Pelajaran", count: courses.length },
      { key: "classes" as const, label: "Jadwal & Kelas", count: courseOfferings.length }
    ],
    [lecturers.length, courses.length, courseOfferings.length]
  );

  const offeringsByDay = useMemo(() => {
    return weekDays.reduce<Record<(typeof weekDays)[number], CourseOfferingRow[]>>((acc, day) => {
      acc[day] = courseOfferings.filter((offering) => offering.dayOfWeek === day).sort(sortByStartTime);
      return acc;
    }, { Senin: [], Selasa: [], Rabu: [], Kamis: [], Jumat: [] });
  }, [courseOfferings]);

  async function loadAcademics() {
    try {
      setPageError(null);
      setIsLoadingLecturers(true);
      setIsLoadingCourses(true);
      setIsLoadingOfferings(true);

      const [lecturerRows, courseRows, offeringRows, classroomRows] = await Promise.all([
        getLecturers(selectedTenant),
        getCourses(selectedTenant),
        getCourseOfferings(selectedTenant),
        getClassrooms(selectedTenant)
      ]);

      setLecturers(lecturerRows as LecturerRow[]);
      setCourses(courseRows as CourseRow[]);
      setCourseOfferings(offeringRows as CourseOfferingRow[]);
      setClassrooms(classroomRows as ClassroomOption[]);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Gagal memuat data akademik.");
    } finally {
      setIsLoadingLecturers(false);
      setIsLoadingCourses(false);
      setIsLoadingOfferings(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    if (!selectedTenant) {
      return () => {
        isActive = false;
      };
    }

    async function syncAcademics() {
      if (!isActive) {
        return;
      }

      setPageError(null);
      setIsLoadingLecturers(true);
      setIsLoadingCourses(true);
      setIsLoadingOfferings(true);

      try {
        const [lecturerRows, courseRows, offeringRows, classroomRows] = await Promise.all([
          getLecturers(selectedTenant),
          getCourses(selectedTenant),
          getCourseOfferings(selectedTenant),
          getClassrooms(selectedTenant)
        ]);

        if (!isActive) {
          return;
        }

        setLecturers(lecturerRows as LecturerRow[]);
        setCourses(courseRows as CourseRow[]);
        setCourseOfferings(offeringRows as CourseOfferingRow[]);
        setClassrooms(classroomRows as ClassroomOption[]);
      } catch (error) {
        if (isActive) {
          setPageError(error instanceof Error ? error.message : "Gagal memuat data akademik.");
        }
      } finally {
        if (isActive) {
          setIsLoadingLecturers(false);
          setIsLoadingCourses(false);
          setIsLoadingOfferings(false);
        }
      }
    }

    void syncAcademics();

    return () => {
      isActive = false;
    };
  }, [selectedTenant]);

  useEffect(() => {
    if (!selectedClassId) {
      return;
    }

    if (!selectedTenant) {
      return;
    }

    const currentClassId = selectedClassId;
    let isActive = true;

    async function loadClassDetail() {
      try {
        setIsLoadingClassDetail(true);
        setClassDetailError(null);

        const result = await getCourseOfferingById(selectedTenant, currentClassId);

        if (!isActive) {
          return;
        }

        if (!result) {
          setClassDetailError("Kelas tidak ditemukan.");
          setSelectedClassDetail(null);
          return;
        }

        setSelectedClassDetail(result as CourseOfferingDetail);
      } catch (error) {
        if (isActive) {
          setClassDetailError(error instanceof Error ? error.message : "Gagal memuat roster kelas.");
          setSelectedClassDetail(null);
        }
      } finally {
        if (isActive) {
          setIsLoadingClassDetail(false);
        }
      }
    }

    void loadClassDetail();

    return () => {
      isActive = false;
    };
  }, [selectedClassId, selectedTenant]);

  function closeLecturerModal() {
    setIsLecturerModalOpen(false);
    setLecturerErrors({});
  }

  function closeCourseModal() {
    setIsCourseModalOpen(false);
    setCourseErrors({});
  }

  function closeOfferingModal() {
    setIsOfferingModalOpen(false);
    setOfferingErrors({});
  }

  function openOfferingModal() {
    setOfferingForm((previous) => ({
      ...previous,
      courseId: previous.courseId || courses[0]?.id || "",
      lecturerId: previous.lecturerId || lecturers[0]?.id || "",
      classroomId: previous.classroomId || ""
    }));
    setOfferingErrors({});
    setIsOfferingModalOpen(true);
  }

  function closeClassDetailModal() {
    setSelectedClassId(null);
    setSelectedClassDetail(null);
    setClassDetailError(null);
    setIsLoadingClassDetail(false);
  }

  function handleLecturerSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startLecturerTransition(async () => {
      setLecturerErrors({});

      const result = await createLecturer(selectedTenant, {
        nip: lecturerForm.nip,
        name: lecturerForm.name,
        specialization: lecturerForm.specialization
      });

      if (!result.success) {
        setLecturerErrors(result.errors);
        return;
      }

      setLecturerForm({ nip: "", name: "", specialization: "" });
      closeLecturerModal();
      await loadAcademics();
    });
  }

  function handleCourseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startCourseTransition(async () => {
      setCourseErrors({});

      const result = await createCourse(selectedTenant, {
        code: courseForm.code,
        name: courseForm.name,
        credits: Number(courseForm.credits)
      });

      if (!result.success) {
        setCourseErrors(result.errors);
        return;
      }

      setCourseForm({ code: "", name: "", credits: "3" });
      closeCourseModal();
      await loadAcademics();
    });
  }

  function handleOfferingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startOfferingTransition(async () => {
      setOfferingErrors({});

      const result = await createCourseOffering(selectedTenant, {
        courseId: offeringForm.courseId,
        lecturerId: offeringForm.lecturerId,
        classroomId: offeringForm.classroomId,
        dayOfWeek: offeringForm.dayOfWeek as "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat",
        startTime: offeringForm.startTime,
        endTime: offeringForm.endTime,
        room: offeringForm.room
      });

      if (!result.success) {
        setOfferingErrors(result.errors);
        return;
      }

      setOfferingForm((previous) => ({
        ...previous,
        classroomId: "",
        room: "",
        startTime: "07:30",
        endTime: "09:00"
      }));
      closeOfferingModal();
      await loadAcademics();
    });
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Akademik</h1>
          <p className="mt-1 text-sm text-slate-600">Kelola guru, mata pelajaran, dan kelas sekolah dari satu tempat.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/academics/classrooms"
              className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manajemen Rombel
            </Link>
            <Link
              href="/academics/grades"
              className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Input Nilai
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Guru: <span className="font-semibold text-slate-900">{lecturers.length}</span> · Pelajaran: <span className="font-semibold text-slate-900">{courses.length}</span> · Kelas: <span className="font-semibold text-slate-900">{courseOfferings.length}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {tabItems.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-t-lg border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-slate-200 border-b-white bg-white text-slate-900"
                  : "border-transparent text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-500"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {pageError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</div> : null}

      {activeTab === "lecturers" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Daftar Guru</h2>
              <p className="text-sm text-slate-600">Data guru yang aktif di tenant ini.</p>
            </div>
            <Button onClick={() => setIsLecturerModalOpen(true)}>+ Tambah Guru</Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            {isLoadingLecturers ? (
              <LecturerSkeleton />
            ) : (
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2">NIP</th>
                    <th className="border-b border-slate-200 px-3 py-2">Nama</th>
                    <th className="border-b border-slate-200 px-3 py-2">Spesialisasi</th>
                    <th className="border-b border-slate-200 px-3 py-2">Email</th>
                    <th className="border-b border-slate-200 px-3 py-2">Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturers.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-slate-500" colSpan={5}>
                        Belum ada guru untuk tenant ini.
                      </td>
                    </tr>
                  ) : (
                    lecturers.map((lecturer) => (
                      <tr key={lecturer.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs text-slate-700">{lecturer.nip}</td>
                        <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{lecturer.name}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{lecturer.specialization ?? "-"}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{lecturer.email}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{formatDate(lecturer.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "courses" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Mata Pelajaran</h2>
              <p className="text-sm text-slate-600">Daftar pelajaran yang tersedia di tenant ini.</p>
            </div>
            <Button onClick={() => setIsCourseModalOpen(true)}>+ Tambah Pelajaran</Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            {isLoadingCourses ? (
              <CourseSkeleton />
            ) : (
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2">Kode</th>
                    <th className="border-b border-slate-200 px-3 py-2">Nama</th>
                    <th className="border-b border-slate-200 px-3 py-2">SKS</th>
                    <th className="border-b border-slate-200 px-3 py-2">Deskripsi</th>
                    <th className="border-b border-slate-200 px-3 py-2">Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-slate-500" colSpan={5}>
                        Belum ada mata pelajaran untuk tenant ini.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs text-slate-700">{course.code}</td>
                        <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{course.name}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{course.credits}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{course.description ?? "-"}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{formatDate(course.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "classes" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Jadwal & Kelas</h2>
              <p className="text-sm text-slate-600">Kalender mingguan untuk jadwal kelas Senin sampai Jumat.</p>
            </div>
            <Button onClick={openOfferingModal} disabled={courses.length === 0 || lecturers.length === 0}>
              + Tambah Kelas
            </Button>
          </div>

          {courses.length === 0 || lecturers.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Tambahkan minimal satu guru dan satu mata pelajaran sebelum membuat jadwal kelas.
            </div>
          ) : null}

          {isLoadingOfferings ? (
            <OfferingSkeleton />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {weekDays.map((day) => (
                <div key={day} className="min-h-[280px] rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-semibold text-slate-900">{day}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">{offeringsByDay[day].length}</span>
                  </div>

                  <div className="space-y-2">
                    {offeringsByDay[day].length === 0 ? (
                      <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">Belum ada jadwal</div>
                    ) : (
                      offeringsByDay[day].map((offering) => (
                        <article
                          key={offering.id}
                          onClick={() => setSelectedClassId(offering.id)}
                          className="cursor-pointer rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-slate-700 shadow-sm transition hover:ring-2 hover:ring-sky-300"
                        >
                          <p className="font-medium text-indigo-700">{offering.classroom?.name ?? "Tanpa Rombel"}</p>
                          <p className="font-semibold text-slate-900">{offering.course.name}</p>
                          <p className="mt-0.5 text-slate-600">{offering.course.code}</p>
                          <p className="mt-2 text-slate-700">{offering.startTime ?? "-"} - {offering.endTime ?? "-"}</p>
                          <p className="mt-0.5 text-slate-700">{offering.lecturer?.name ?? "Tanpa pengajar"}</p>
                          <p className="mt-0.5 text-slate-600">Ruang: {offering.room || "-"}</p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <Modal open={isLecturerModalOpen} title="Tambah Guru" onClose={closeLecturerModal}>
        <form className="space-y-4" onSubmit={handleLecturerSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="lecturer-nip">
              NIP
            </label>
            <input
              id="lecturer-nip"
              type="text"
              value={lecturerForm.nip}
              onChange={(event) => setLecturerForm((previous) => ({ ...previous, nip: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {lecturerErrors.nip ? <p className="mt-1 text-xs text-red-600">{lecturerErrors.nip}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="lecturer-name">
              Nama
            </label>
            <input
              id="lecturer-name"
              type="text"
              value={lecturerForm.name}
              onChange={(event) => setLecturerForm((previous) => ({ ...previous, name: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {lecturerErrors.name ? <p className="mt-1 text-xs text-red-600">{lecturerErrors.name}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="lecturer-specialization">
              Spesialisasi <span className="text-slate-400">(opsional)</span>
            </label>
            <input
              id="lecturer-specialization"
              type="text"
              value={lecturerForm.specialization}
              onChange={(event) => setLecturerForm((previous) => ({ ...previous, specialization: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {lecturerErrors.specialization ? <p className="mt-1 text-xs text-red-600">{lecturerErrors.specialization}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeLecturerModal} type="button">
              Batal
            </Button>
            <Button type="submit" disabled={isLecturerPending}>
              {isLecturerPending ? "Menyimpan..." : "Simpan Guru"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={isCourseModalOpen} title="Tambah Pelajaran" onClose={closeCourseModal}>
        <form className="space-y-4" onSubmit={handleCourseSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="course-code">
              Kode Pelajaran
            </label>
            <input
              id="course-code"
              type="text"
              value={courseForm.code}
              onChange={(event) => setCourseForm((previous) => ({ ...previous, code: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {courseErrors.code ? <p className="mt-1 text-xs text-red-600">{courseErrors.code}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="course-name">
              Nama Pelajaran
            </label>
            <input
              id="course-name"
              type="text"
              value={courseForm.name}
              onChange={(event) => setCourseForm((previous) => ({ ...previous, name: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {courseErrors.name ? <p className="mt-1 text-xs text-red-600">{courseErrors.name}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="course-credits">
              SKS
            </label>
            <input
              id="course-credits"
              type="number"
              min="1"
              max="12"
              value={courseForm.credits}
              onChange={(event) => setCourseForm((previous) => ({ ...previous, credits: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {courseErrors.credits ? <p className="mt-1 text-xs text-red-600">{courseErrors.credits}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeCourseModal} type="button">
              Batal
            </Button>
            <Button type="submit" disabled={isCoursePending}>
              {isCoursePending ? "Menyimpan..." : "Simpan Pelajaran"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={isOfferingModalOpen} title="Tambah Kelas" onClose={closeOfferingModal}>
        <form className="space-y-4" onSubmit={handleOfferingSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="offering-course">
              Mata Pelajaran
            </label>
            <select
              id="offering-course"
              value={offeringForm.courseId}
              onChange={(event) => setOfferingForm((previous) => ({ ...previous, courseId: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            >
              <option value="">Pilih mata pelajaran</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            {offeringErrors.courseId ? <p className="mt-1 text-xs text-red-600">{offeringErrors.courseId}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="offering-lecturer">
              Guru Pengajar
            </label>
            <select
              id="offering-lecturer"
              value={offeringForm.lecturerId}
              onChange={(event) => setOfferingForm((previous) => ({ ...previous, lecturerId: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            >
              <option value="">Pilih guru pengajar</option>
              {lecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.nip} - {lecturer.name}
                </option>
              ))}
            </select>
            {offeringErrors.lecturerId ? <p className="mt-1 text-xs text-red-600">{offeringErrors.lecturerId}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="offering-classroom">
              Rombongan Belajar (Kelas)
            </label>
            <select
              id="offering-classroom"
              value={offeringForm.classroomId}
              onChange={(event) => setOfferingForm((previous) => ({ ...previous, classroomId: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            >
              <option value="">Tanpa rombel khusus</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} · {classroom.academicYear} S{classroom.semester}
                </option>
              ))}
            </select>
            {offeringErrors.classroomId ? <p className="mt-1 text-xs text-red-600">{offeringErrors.classroomId}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="offering-day">
              Hari
            </label>
            <select
              id="offering-day"
              value={offeringForm.dayOfWeek}
              onChange={(event) => setOfferingForm((previous) => ({ ...previous, dayOfWeek: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            >
              {weekDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            {offeringErrors.dayOfWeek ? <p className="mt-1 text-xs text-red-600">{offeringErrors.dayOfWeek}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="offering-start-time">
                Jam Mulai
              </label>
              <input
                id="offering-start-time"
                type="time"
                value={offeringForm.startTime}
                onChange={(event) => setOfferingForm((previous) => ({ ...previous, startTime: event.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
              />
              {offeringErrors.startTime ? <p className="mt-1 text-xs text-red-600">{offeringErrors.startTime}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="offering-end-time">
                Jam Selesai
              </label>
              <input
                id="offering-end-time"
                type="time"
                value={offeringForm.endTime}
                onChange={(event) => setOfferingForm((previous) => ({ ...previous, endTime: event.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
              />
              {offeringErrors.endTime ? <p className="mt-1 text-xs text-red-600">{offeringErrors.endTime}</p> : null}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="offering-room">
              Ruangan
            </label>
            <input
              id="offering-room"
              type="text"
              value={offeringForm.room}
              onChange={(event) => setOfferingForm((previous) => ({ ...previous, room: event.target.value }))}
              placeholder="Contoh: Ruang 2A"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {offeringErrors.room ? <p className="mt-1 text-xs text-red-600">{offeringErrors.room}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeOfferingModal} type="button">
              Batal
            </Button>
            <Button type="submit" disabled={isOfferingPending}>
              {isOfferingPending ? "Menyimpan..." : "Simpan Jadwal"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={selectedClassId !== null}
        title="Detail Kelas"
        onClose={closeClassDetailModal}
        panelClassName="max-w-4xl"
      >
        {isLoadingClassDetail ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : classDetailError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{classDetailError}</div>
        ) : selectedClassDetail ? (
          <div className="space-y-4">
            <header className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">{selectedClassDetail.course.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{selectedClassDetail.course.code}</p>
              <p className="mt-2 text-sm text-slate-700">Guru: {selectedClassDetail.lecturer?.name ?? "-"}</p>
              <p className="mt-1 text-sm text-slate-700">Rombel: {selectedClassDetail.classroom?.name ?? "Tanpa rombel"}</p>
              <p className="mt-1 text-sm text-slate-700">
                Jadwal: {selectedClassDetail.dayOfWeek ?? "-"} {selectedClassDetail.startTime ?? "-"} - {selectedClassDetail.endTime ?? "-"}
              </p>
              <p className="mt-1 text-sm text-slate-700">Ruangan: {selectedClassDetail.room ?? "-"}</p>
            </header>

            <section className="space-y-3">
              <h4 className="text-base font-semibold text-slate-900">Siswa Terdaftar</h4>

              {selectedClassDetail.enrollments.length === 0 ? (
                <p className="text-sm text-slate-600">Belum ada siswa di kelas ini.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-2">NIS</th>
                        <th className="border-b border-slate-200 px-3 py-2">Name</th>
                        <th className="border-b border-slate-200 px-3 py-2">Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClassDetail.enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-slate-50">
                          <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs text-slate-700">{enrollment.student.nis}</td>
                          <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{enrollment.student.name}</td>
                          <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{enrollment.student.gender ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Pilih kelas dari kalender untuk melihat roster.</div>
        )}
      </Modal>
    </section>
  );
}
