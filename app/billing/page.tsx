"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { useTenant } from "../../components/tenant-context";
import {
  createExpense,
  createInvoice,
  generateBulkSPP,
  getBillingStudents,
  getFinanceData,
  recordPayment,
  type FinanceData
} from "../actions/finance";

type BillingStudent = {
  id: string;
  nis: string;
  name: string;
};

type InvoiceRow = FinanceData["invoices"][number];
type ExpenseRow = FinanceData["expenses"][number];

type FinanceTab = "income" | "expense";

const statusClassMap: Record<InvoiceRow["status"], string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700"
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default function BillingPage() {
  const { selectedTenant, activeTenantLabel } = useTenant();

  const [activeTab, setActiveTab] = useState<FinanceTab>("income");
  const [students, setStudents] = useState<BillingStudent[]>([]);
  const [financeData, setFinanceData] = useState<FinanceData>({
    invoices: [],
    payments: [],
    expenses: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({
    studentId: "",
    title: "",
    amount: "",
    dueDate: ""
  });
  const [bulkForm, setBulkForm] = useState({
    title: "",
    amount: "",
    dueDate: ""
  });
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: "",
    method: "TRANSFER"
  });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "",
    expenseDate: ""
  });

  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({});
  const [bulkErrors, setBulkErrors] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [expenseErrors, setExpenseErrors] = useState<Record<string, string>>({});

  async function loadFinanceData() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [data, studentRows] = await Promise.all([
        getFinanceData(selectedTenant),
        getBillingStudents(selectedTenant)
      ]);

      setFinanceData(data);
      setStudents(studentRows);
      setInvoiceForm((previous) => ({
        ...previous,
        studentId: previous.studentId || studentRows[0]?.id || ""
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data finance.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function syncFinanceData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [data, studentRows] = await Promise.all([
          getFinanceData(selectedTenant),
          getBillingStudents(selectedTenant)
        ]);

        if (!isActive) {
          return;
        }

        setFinanceData(data);
        setStudents(studentRows);
        setInvoiceForm((previous) => ({
          ...previous,
          studentId: previous.studentId || studentRows[0]?.id || ""
        }));
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data finance.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void syncFinanceData();

    return () => {
      isActive = false;
    };
  }, [selectedTenant]);

  const totalReceivable = useMemo(
    () => financeData.invoices.reduce((sum, invoice) => sum + Math.max(invoice.remainingAmount, 0), 0),
    [financeData.invoices]
  );

  const totalIncome = useMemo(
    () => financeData.payments.reduce((sum, payment) => sum + payment.amountPaid, 0),
    [financeData.payments]
  );

  const totalExpense = useMemo(
    () => financeData.expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [financeData.expenses]
  );

  function closeInvoiceModal() {
    setIsInvoiceModalOpen(false);
    setInvoiceErrors({});
  }

  function closeBulkModal() {
    setIsBulkModalOpen(false);
    setBulkErrors({});
  }

  function closePaymentModal() {
    setIsPaymentModalOpen(false);
    setPaymentErrors({});
    setSelectedInvoice(null);
  }

  function closeExpenseModal() {
    setIsExpenseModalOpen(false);
    setExpenseErrors({});
  }

  function openPaymentModal(invoice: InvoiceRow) {
    setSelectedInvoice(invoice);
    setPaymentErrors({});
    setPaymentForm({
      amountPaid: `${Math.max(invoice.remainingAmount, 0)}`,
      method: "TRANSFER"
    });
    setIsPaymentModalOpen(true);
  }

  function handleCreateInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setInvoiceErrors({});
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await createInvoice(selectedTenant, {
        studentId: invoiceForm.studentId,
        title: invoiceForm.title,
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate
      });

      if (!result.success) {
        setInvoiceErrors(result.errors ?? {});
        setErrorMessage(result.error);
        return;
      }

      setInvoiceForm({
        studentId: students[0]?.id || "",
        title: "",
        amount: "",
        dueDate: ""
      });
      setSuccessMessage("Tagihan satuan berhasil dibuat.");
      closeInvoiceModal();
      await loadFinanceData();
    });
  }

  function handleGenerateBulk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setBulkErrors({});
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await generateBulkSPP(
        selectedTenant,
        bulkForm.title,
        Number(bulkForm.amount),
        bulkForm.dueDate
      );

      if (!result.success) {
        setBulkErrors(result.errors ?? {});
        setErrorMessage(result.error);
        return;
      }

      setBulkForm({
        title: "",
        amount: "",
        dueDate: ""
      });
      setSuccessMessage("Generate SPP massal berhasil.");
      closeBulkModal();
      await loadFinanceData();
    });
  }

  function handleRecordPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedInvoice) {
      return;
    }

    startTransition(async () => {
      setPaymentErrors({});
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await recordPayment(
        selectedTenant,
        selectedInvoice.id,
        Number(paymentForm.amountPaid),
        paymentForm.method
      );

      if (!result.success) {
        setPaymentErrors(result.errors ?? {});
        setErrorMessage(result.error);
        return;
      }

      setSuccessMessage("Pembayaran berhasil dicatat.");
      closePaymentModal();
      await loadFinanceData();
    });
  }

  function handleCreateExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setExpenseErrors({});
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await createExpense(selectedTenant, {
        title: expenseForm.title,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        expenseDate: expenseForm.expenseDate
      });

      if (!result.success) {
        setExpenseErrors(result.errors ?? {});
        setErrorMessage(result.error);
        return;
      }

      setExpenseForm({
        title: "",
        amount: "",
        category: "",
        expenseDate: ""
      });
      setSuccessMessage("Pengeluaran berhasil dicatat.");
      closeExpenseModal();
      await loadFinanceData();
    });
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Finance</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola tagihan, pemasukan, dan pengeluaran tenant aktif: {activeTenantLabel} ({selectedTenant})
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
      ) : null}
      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-700">Total Piutang (Menunggu Dibayar)</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{formatCurrency(totalReceivable)}</p>
        </article>
        <article className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-xs uppercase tracking-wide text-green-700">Total Pemasukan</p>
          <p className="mt-1 text-2xl font-bold text-green-800">{formatCurrency(totalIncome)}</p>
        </article>
        <article className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs uppercase tracking-wide text-rose-700">Total Pengeluaran</p>
          <p className="mt-1 text-2xl font-bold text-rose-800">{formatCurrency(totalExpense)}</p>
        </article>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("income")}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              activeTab === "income"
                ? "border border-b-0 border-slate-300 bg-white text-slate-900"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tagihan & Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("expense")}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              activeTab === "expense"
                ? "border border-b-0 border-slate-300 bg-white text-slate-900"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Pengeluaran Operasional
          </button>
        </div>
      </div>

      {activeTab === "income" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
              + Generate SPP Massal
            </Button>
            <Button onClick={() => setIsInvoiceModalOpen(true)}>+ Buat Tagihan (Satuan)</Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            {isLoading ? (
              <div className="space-y-3 p-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2">Student Name</th>
                    <th className="border-b border-slate-200 px-3 py-2">Title</th>
                    <th className="border-b border-slate-200 px-3 py-2">Amount</th>
                    <th className="border-b border-slate-200 px-3 py-2">Status</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {financeData.invoices.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-slate-500" colSpan={5}>
                        Belum ada tagihan untuk tenant ini.
                      </td>
                    </tr>
                  ) : (
                    financeData.invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-3 py-3">
                          <p className="font-medium text-slate-900">{invoice.student.name}</p>
                          <p className="text-xs text-slate-500">{invoice.student.nis}</p>
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{invoice.title}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{formatCurrency(invoice.amount)}</td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClassMap[invoice.status]}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-right">
                          {invoice.status !== "PAID" ? (
                            <Button size="sm" variant="outline" onClick={() => openPaymentModal(invoice)}>
                              Bayar
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsExpenseModalOpen(true)}>+ Catat Pengeluaran</Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            {isLoading ? (
              <div className="space-y-3 p-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2">Date</th>
                    <th className="border-b border-slate-200 px-3 py-2">Title</th>
                    <th className="border-b border-slate-200 px-3 py-2">Category</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {financeData.expenses.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-slate-500" colSpan={4}>
                        Belum ada data pengeluaran.
                      </td>
                    </tr>
                  ) : (
                    financeData.expenses.map((expense: ExpenseRow) => (
                      <tr key={expense.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{formatDate(expense.expenseDate)}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-900">{expense.title}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{expense.category}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-right text-slate-700">
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <Modal open={isInvoiceModalOpen} title="Buat Tagihan Satuan" onClose={closeInvoiceModal}>
        <form className="space-y-4" onSubmit={handleCreateInvoice}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="invoice-student">
              Siswa
            </label>
            <select
              id="invoice-student"
              value={invoiceForm.studentId}
              onChange={(event) => setInvoiceForm((previous) => ({ ...previous, studentId: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            >
              <option value="">Pilih siswa</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nis} - {student.name}
                </option>
              ))}
            </select>
            {invoiceErrors.studentId ? <p className="mt-1 text-xs text-red-600">{invoiceErrors.studentId}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="invoice-title">
              Judul Tagihan
            </label>
            <input
              id="invoice-title"
              type="text"
              value={invoiceForm.title}
              onChange={(event) => setInvoiceForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Contoh: SPP Juli 2026"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {invoiceErrors.title ? <p className="mt-1 text-xs text-red-600">{invoiceErrors.title}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="invoice-amount">
              Nominal
            </label>
            <input
              id="invoice-amount"
              type="number"
              min="1"
              value={invoiceForm.amount}
              onChange={(event) => setInvoiceForm((previous) => ({ ...previous, amount: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {invoiceErrors.amount ? <p className="mt-1 text-xs text-red-600">{invoiceErrors.amount}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="invoice-due-date">
              Jatuh Tempo
            </label>
            <input
              id="invoice-due-date"
              type="date"
              value={invoiceForm.dueDate}
              onChange={(event) => setInvoiceForm((previous) => ({ ...previous, dueDate: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {invoiceErrors.dueDate ? <p className="mt-1 text-xs text-red-600">{invoiceErrors.dueDate}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={closeInvoiceModal}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Memproses..." : "Simpan Tagihan"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={isBulkModalOpen} title="Generate SPP Massal" onClose={closeBulkModal}>
        <form className="space-y-4" onSubmit={handleGenerateBulk}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="bulk-title">
              Judul Tagihan
            </label>
            <input
              id="bulk-title"
              type="text"
              value={bulkForm.title}
              onChange={(event) => setBulkForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Contoh: SPP Agustus 2026"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {bulkErrors.title ? <p className="mt-1 text-xs text-red-600">{bulkErrors.title}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="bulk-amount">
              Nominal
            </label>
            <input
              id="bulk-amount"
              type="number"
              min="1"
              value={bulkForm.amount}
              onChange={(event) => setBulkForm((previous) => ({ ...previous, amount: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {bulkErrors.amount ? <p className="mt-1 text-xs text-red-600">{bulkErrors.amount}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="bulk-due-date">
              Jatuh Tempo
            </label>
            <input
              id="bulk-due-date"
              type="date"
              value={bulkForm.dueDate}
              onChange={(event) => setBulkForm((previous) => ({ ...previous, dueDate: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {bulkErrors.dueDate ? <p className="mt-1 text-xs text-red-600">{bulkErrors.dueDate}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={closeBulkModal}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Memproses..." : "Generate"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={isPaymentModalOpen} title="Catat Pembayaran" onClose={closePaymentModal}>
        {selectedInvoice ? (
          <form className="space-y-4" onSubmit={handleRecordPayment}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{selectedInvoice.student.name}</p>
              <p>{selectedInvoice.title}</p>
              <p className="mt-1">
                Sisa: <span className="font-semibold">{formatCurrency(selectedInvoice.remainingAmount)}</span>
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="payment-amount">
                Nominal Dibayar
              </label>
              <input
                id="payment-amount"
                type="number"
                min="1"
                value={paymentForm.amountPaid}
                onChange={(event) => setPaymentForm((previous) => ({ ...previous, amountPaid: event.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
              />
              {paymentErrors.amountPaid ? <p className="mt-1 text-xs text-red-600">{paymentErrors.amountPaid}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="payment-method">
                Metode Pembayaran
              </label>
              <select
                id="payment-method"
                value={paymentForm.method}
                onChange={(event) => setPaymentForm((previous) => ({ ...previous, method: event.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
              >
                <option value="TRANSFER">TRANSFER</option>
                <option value="CASH">CASH</option>
                <option value="VA">VA</option>
                <option value="QRIS">QRIS</option>
              </select>
              {paymentErrors.method ? <p className="mt-1 text-xs text-red-600">{paymentErrors.method}</p> : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={closePaymentModal}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Memproses..." : "Simpan Pembayaran"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal open={isExpenseModalOpen} title="Catat Pengeluaran" onClose={closeExpenseModal}>
        <form className="space-y-4" onSubmit={handleCreateExpense}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="expense-title">
              Judul
            </label>
            <input
              id="expense-title"
              type="text"
              value={expenseForm.title}
              onChange={(event) => setExpenseForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Contoh: Bayar Listrik"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {expenseErrors.title ? <p className="mt-1 text-xs text-red-600">{expenseErrors.title}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="expense-category">
              Kategori
            </label>
            <input
              id="expense-category"
              type="text"
              value={expenseForm.category}
              onChange={(event) => setExpenseForm((previous) => ({ ...previous, category: event.target.value }))}
              placeholder="Contoh: Utilities"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {expenseErrors.category ? <p className="mt-1 text-xs text-red-600">{expenseErrors.category}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="expense-amount">
              Nominal
            </label>
            <input
              id="expense-amount"
              type="number"
              min="1"
              value={expenseForm.amount}
              onChange={(event) => setExpenseForm((previous) => ({ ...previous, amount: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {expenseErrors.amount ? <p className="mt-1 text-xs text-red-600">{expenseErrors.amount}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="expense-date">
              Tanggal Pengeluaran
            </label>
            <input
              id="expense-date"
              type="date"
              value={expenseForm.expenseDate}
              onChange={(event) => setExpenseForm((previous) => ({ ...previous, expenseDate: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {expenseErrors.expenseDate ? <p className="mt-1 text-xs text-red-600">{expenseErrors.expenseDate}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={closeExpenseModal}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Memproses..." : "Simpan Pengeluaran"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
