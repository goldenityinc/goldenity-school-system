"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "../../lib/prisma";

const CreateInvoiceSchema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  title: z.string().min(1, "Judul tagihan wajib diisi"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  dueDate: z.string().min(1, "Jatuh tempo wajib diisi")
});

const RecordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice wajib dipilih"),
  amountPaid: z.coerce.number().positive("Nominal pembayaran harus lebih dari 0"),
  method: z.string().min(1, "Metode pembayaran wajib dipilih")
});

const CreateExpenseSchema = z.object({
  title: z.string().min(1, "Judul pengeluaran wajib diisi"),
  amount: z.coerce.number().positive("Nominal pengeluaran harus lebih dari 0"),
  category: z.string().min(1, "Kategori wajib diisi"),
  expenseDate: z.string().min(1, "Tanggal pengeluaran wajib diisi")
});

const BulkSPPSchema = z.object({
  title: z.string().min(1, "Judul tagihan wajib diisi"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  dueDate: z.string().min(1, "Jatuh tempo wajib diisi")
});

const invoiceStatuses = ["UNPAID", "PARTIAL", "PAID"] as const;

type InvoiceStatus = (typeof invoiceStatuses)[number];

type FinanceActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
      errors?: {
        studentId?: string;
        title?: string;
        amount?: string;
        dueDate?: string;
        invoiceId?: string;
        amountPaid?: string;
        method?: string;
        category?: string;
        expenseDate?: string;
      };
    };

export type FinanceData = {
  invoices: Array<{
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    status: InvoiceStatus;
    createdAt: string;
    student: {
      id: string;
      nis: string;
      name: string;
    };
    totalPaid: number;
    remainingAmount: number;
  }>;
  payments: Array<{
    id: string;
    invoiceId: string;
    amountPaid: number;
    paymentDate: string;
    method: string;
    createdAt: string;
    invoiceTitle: string;
    studentName: string;
  }>;
  expenses: Array<{
    id: string;
    title: string;
    amount: number;
    category: string;
    expenseDate: string;
    createdAt: string;
  }>;
};

function normalizeInvoiceStatus(status: string): InvoiceStatus {
  if (invoiceStatuses.includes(status as InvoiceStatus)) {
    return status as InvoiceStatus;
  }

  return "UNPAID";
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function getBillingStudents(tenantId: string) {
  const students = await prisma.student.findMany({
    where: {
      tenantId,
      isActive: true
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      studentNumber: true,
      fullName: true
    }
  });

  return students.map((student) => ({
    id: student.id,
    nis: student.studentNumber,
    name: student.fullName
  }));
}

export async function getFinanceData(tenantId: string): Promise<FinanceData> {
  const [invoices, payments, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            fullName: true
          }
        },
        payments: {
          where: { tenantId },
          select: {
            amountPaid: true
          }
        }
      }
    }),
    prisma.payment.findMany({
      where: { tenantId },
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: {
          select: {
            title: true,
            student: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    }),
    prisma.expense.findMany({
      where: { tenantId },
      orderBy: { expenseDate: "desc" }
    })
  ]);

  const mappedInvoices = invoices.map((invoice) => {
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

    return {
      id: invoice.id,
      title: invoice.title,
      amount: invoice.amount,
      dueDate: invoice.dueDate.toISOString(),
      status: normalizeInvoiceStatus(invoice.status),
      createdAt: invoice.createdAt.toISOString(),
      student: {
        id: invoice.student.id,
        nis: invoice.student.studentNumber,
        name: invoice.student.fullName
      },
      totalPaid,
      remainingAmount: Math.max(invoice.amount - totalPaid, 0)
    };
  });

  return {
    invoices: mappedInvoices,
    payments: payments.map((payment) => ({
      id: payment.id,
      invoiceId: payment.invoiceId,
      amountPaid: payment.amountPaid,
      paymentDate: payment.paymentDate.toISOString(),
      method: payment.method,
      createdAt: payment.createdAt.toISOString(),
      invoiceTitle: payment.invoice.title,
      studentName: payment.invoice.student.fullName
    })),
    expenses: expenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      expenseDate: expense.expenseDate.toISOString(),
      createdAt: expense.createdAt.toISOString()
    }))
  };
}

export async function createInvoice(
  tenantId: string,
  data: {
    studentId: string;
    title: string;
    amount: number;
    dueDate: string;
  }
): Promise<FinanceActionResult> {
  const parsed = CreateInvoiceSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Input tagihan tidak valid",
      errors: {
        studentId: fieldErrors.studentId?.[0],
        title: fieldErrors.title?.[0],
        amount: fieldErrors.amount?.[0],
        dueDate: fieldErrors.dueDate?.[0]
      }
    };
  }

  const cleaned = parsed.data;

  const student = await prisma.student.findFirst({
    where: {
      id: cleaned.studentId,
      tenantId
    },
    select: { id: true }
  });

  if (!student) {
    return {
      success: false,
      error: "Siswa tidak ditemukan untuk tenant aktif",
      errors: {
        studentId: "Siswa tidak valid"
      }
    };
  }

  await prisma.invoice.create({
    data: {
      tenantId,
      studentId: cleaned.studentId,
      title: cleaned.title.trim(),
      amount: cleaned.amount,
      dueDate: toDate(cleaned.dueDate),
      status: "UNPAID"
    }
  });

  revalidatePath("/billing");
  return { success: true };
}

export async function recordPayment(
  tenantId: string,
  invoiceId: string,
  amountPaid: number,
  method: string
): Promise<FinanceActionResult> {
  const parsed = RecordPaymentSchema.safeParse({
    invoiceId,
    amountPaid,
    method
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Input pembayaran tidak valid",
      errors: {
        invoiceId: fieldErrors.invoiceId?.[0],
        amountPaid: fieldErrors.amountPaid?.[0],
        method: fieldErrors.method?.[0]
      }
    };
  }

  const cleaned = parsed.data;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: cleaned.invoiceId,
      tenantId
    },
    select: {
      id: true,
      amount: true
    }
  });

  if (!invoice) {
    return {
      success: false,
      error: "Invoice tidak ditemukan"
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        tenantId,
        invoiceId: cleaned.invoiceId,
        amountPaid: cleaned.amountPaid,
        paymentDate: new Date(),
        method: cleaned.method,
        reference: null
      }
    });

    const aggregate = await tx.payment.aggregate({
      where: {
        tenantId,
        invoiceId: cleaned.invoiceId
      },
      _sum: {
        amountPaid: true
      }
    });

    const totalPaid = aggregate._sum.amountPaid ?? 0;
    const nextStatus = totalPaid >= invoice.amount ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID";

    await tx.invoice.update({
      where: {
        id: cleaned.invoiceId
      },
      data: {
        status: nextStatus
      }
    });
  });

  revalidatePath("/billing");
  return { success: true };
}

export async function createExpense(
  tenantId: string,
  data: {
    title: string;
    amount: number;
    category: string;
    expenseDate: string;
  }
): Promise<FinanceActionResult> {
  const parsed = CreateExpenseSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Input pengeluaran tidak valid",
      errors: {
        title: fieldErrors.title?.[0],
        amount: fieldErrors.amount?.[0],
        category: fieldErrors.category?.[0],
        expenseDate: fieldErrors.expenseDate?.[0]
      }
    };
  }

  const cleaned = parsed.data;

  await prisma.expense.create({
    data: {
      tenantId,
      title: cleaned.title.trim(),
      amount: cleaned.amount,
      category: cleaned.category.trim(),
      expenseDate: toDate(cleaned.expenseDate)
    }
  });

  revalidatePath("/billing");
  return { success: true };
}

export async function generateBulkSPP(
  tenantId: string,
  title: string,
  amount: number,
  dueDate: string
): Promise<FinanceActionResult> {
  const parsed = BulkSPPSchema.safeParse({ title, amount, dueDate });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Input generate SPP tidak valid",
      errors: {
        title: fieldErrors.title?.[0],
        amount: fieldErrors.amount?.[0],
        dueDate: fieldErrors.dueDate?.[0]
      }
    };
  }

  const cleaned = parsed.data;
  const students = await prisma.student.findMany({
    where: {
      tenantId,
      isActive: true
    },
    select: {
      id: true
    }
  });

  if (students.length === 0) {
    return {
      success: false,
      error: "Tidak ada siswa aktif untuk generate SPP massal"
    };
  }

  await prisma.invoice.createMany({
    data: students.map((student) => ({
      tenantId,
      studentId: student.id,
      title: cleaned.title.trim(),
      amount: cleaned.amount,
      dueDate: toDate(cleaned.dueDate),
      status: "UNPAID"
    }))
  });

  revalidatePath("/billing");
  return { success: true };
}
