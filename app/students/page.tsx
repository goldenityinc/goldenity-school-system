"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { deleteStudent, getStudents } from "../actions/students";
import { useTenant } from "../../components/tenant-context";

type StudentRow = {
  id: string;
  nis: string;
  name: string;
  registrationDate: string;
  latestEnrollment: {
    status: string;
    courseName: string;
    gradeLetter: string | null;
    gradeScore: string | null;
  } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export default function StudentsPage() {
  const { activeTenantLabel, selectedTenant } = useTenant();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    let isActive = true;

    if (!selectedTenant) {
      return () => {
        isActive = false;
      };
    }

    async function loadStudents() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const result = await getStudents(selectedTenant, debouncedQuery);

        if (!isActive) {
          return;
        }

        setStudents(result as StudentRow[]);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data murid.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadStudents();

    return () => {
      isActive = false;
    };
  }, [selectedTenant, debouncedQuery]);

  const totalStudents = useMemo(() => students.length, [students]);

  function handleDelete(studentId: string) {
    startTransition(async () => {
      try {
        setErrorMessage(null);
        await deleteStudent(studentId, selectedTenant);
        setStudents((prev) => prev.filter((student) => student.id !== studentId));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Gagal menghapus murid.");
      }
    });
  }

  return (
    <>
      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manajemen Murid</h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola data murid untuk tenant aktif: {activeTenantLabel} ({selectedTenant})
            </p>
          </div>
          <Link
            href="/students/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Add Student
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari berdasarkan nama atau NIS..."
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            aria-label="Search students"
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">{totalStudents}</span>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2">NIS</th>
                  <th className="border-b border-slate-200 px-3 py-2">Name</th>
                  <th className="border-b border-slate-200 px-3 py-2">Registration Date</th>
                  <th className="border-b border-slate-200 px-3 py-2">Latest Enrollment</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-slate-500" colSpan={5}>
                      Belum ada data murid untuk tenant ini.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs text-slate-700">{student.nis}</td>
                      <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">
                        <Link href={`/students/${student.id}`} className="text-slate-900 underline-offset-2 hover:text-blue-700 hover:underline">
                          {student.name}
                        </Link>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{formatDate(student.registrationDate)}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-slate-600">
                        {student.latestEnrollment ? (
                          <div>
                            <div className="font-medium text-slate-900">{student.latestEnrollment.courseName}</div>
                            <div className="text-xs text-slate-500">
                              {student.latestEnrollment.status}
                              {student.latestEnrollment.gradeLetter ? ` • Grade ${student.latestEnrollment.gradeLetter}` : ""}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/students/${student.id}`}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Detail
                          </Link>
                          <button
                            type="button"
                            className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 px-2 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${student.name}`}
                            onClick={() => handleDelete(student.id)}
                            disabled={isPending}
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
