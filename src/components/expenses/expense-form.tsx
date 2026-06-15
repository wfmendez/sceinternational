"use client";

import { useRef, useState, useTransition } from "react";

import { logExpense } from "@/app/actions/expenses";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import type { Currency } from "@/lib/domain/currency";

interface ExpenseFormProps {
  budgetId: string;
  currency: Currency;
}

export default function ExpenseForm({ budgetId, currency }: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const parsedAmount = parseFloat(amount) || 0;

  const reset = () => {
    setDescription("");
    setAmount("");
    setInvoiceRef("");
    setNote("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () => {
    setError(null);
    setSuccess(false);

    if (!description.trim()) {
      setError("La descripción es requerida");
      return;
    }
    if (parsedAmount <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    startTransition(async () => {
      let invoice_file_path: string | undefined;

      // Subir archivo al bucket "invoices" con el cliente del navegador
      if (file) {
        const supabase = createClient();
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${budgetId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(path, file, { contentType: file.type });
        if (uploadError) {
          setError(`Error al subir el archivo: ${uploadError.message}`);
          return;
        }
        invoice_file_path = path;
      }

      const result = await logExpense({
        budgetId,
        amount: parsedAmount,
        description: description.trim(),
        invoice_ref: invoiceRef.trim() || undefined,
        invoice_file_path,
        note: note.trim() || undefined,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        reset();
      }
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-white";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Registrar gasto
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Descripción */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Descripción <span className="text-red-500">*</span>
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="Materiales, mano de obra, transporte…"
            disabled={isPending}
          />
        </div>

        {/* Monto */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Monto ({currency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} text-right`}
            placeholder="0.00"
            disabled={isPending}
          />
          {parsedAmount > 0 && (
            <p className="mt-0.5 text-right text-xs text-slate-400">
              {formatMoney(parsedAmount, currency)}
            </p>
          )}
        </div>

        {/* Referencia de factura */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            N.° de factura (opcional)
          </label>
          <input
            value={invoiceRef}
            onChange={(e) => setInvoiceRef(e.target.value)}
            className={inputClass}
            placeholder="FAC-001, 0000123…"
            disabled={isPending}
          />
        </div>

        {/* Archivo */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Factura / comprobante (opcional)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={isPending}
            className="w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-600 hover:file:bg-slate-50 dark:text-slate-400 dark:file:border-slate-700 dark:file:bg-slate-900 dark:file:text-slate-400"
          />
          {file && (
            <p className="mt-0.5 text-xs text-slate-400">
              {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>

        {/* Nota */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Nota interna (opcional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="Observaciones adicionales…"
            disabled={isPending}
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {success && (
        <p className="mt-3 text-xs text-green-600 dark:text-green-400">
          Gasto registrado correctamente.
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {isPending ? "Guardando…" : "Registrar gasto"}
        </button>
      </div>
    </div>
  );
}
