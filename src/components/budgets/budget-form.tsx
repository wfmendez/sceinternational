"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  createBudget,
  updateBudget,
  type CreateBudgetInput,
} from "@/app/actions/budgets";
import { CURRENCY_LABELS, type Currency } from "@/lib/domain/currency";
import { formatMoney } from "@/lib/utils";

const ItemSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  quantity: z.number().positive("Debe ser positivo"),
  unit_cost: z.number().min(0, "No puede ser negativo"),
  unit: z.string().optional(),
});

const FormSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  currency: z.enum(["USD", "VES"]),
  client_name: z.string().optional(),
  items: z.array(ItemSchema).min(1, "Agrega al menos un ítem"),
});

type FormValues = z.infer<typeof FormSchema>;

interface BudgetFormProps {
  budgetId?: string;
  defaultValues?: Partial<FormValues>;
}

export default function BudgetForm({ budgetId, defaultValues }: BudgetFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      description: "",
      currency: "USD",
      client_name: "",
      items: [{ description: "", quantity: 1, unit_cost: 0, unit: "" }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { isSubmitting } = form.formState;
  const watchedItems = form.watch("items");
  const watchedCurrency = form.watch("currency");

  const baseTotal = watchedItems.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0),
    0,
  );

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const input: CreateBudgetInput = values;

    let result: { id?: string; error?: string };
    if (budgetId) {
      result = await updateBudget(budgetId, input);
    } else {
      result = await createBudget(input);
    }

    if ("error" in result && result.error) {
      setServerError(result.error);
    } else if ("id" in result && result.id) {
      router.push(`/panel/presupuestos/${result.id}`);
    } else {
      router.push("/panel/presupuestos");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-white";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Datos del presupuesto */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Información general
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              {...form.register("title")}
              className={inputClass}
              placeholder="Ej. Remodelación cocina – Residencias El Hatillo"
            />
            {form.formState.errors.title && (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Cliente (opcional)
            </label>
            <input
              {...form.register("client_name")}
              className={inputClass}
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Moneda</label>
            <select {...form.register("currency")} className={inputClass}>
              {(Object.keys(CURRENCY_LABELS) as Currency[]).map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Descripción (opcional)
            </label>
            <textarea
              {...form.register("description")}
              rows={3}
              className={inputClass}
              placeholder="Alcance del trabajo, notas relevantes…"
            />
          </div>
        </div>
      </section>

      {/* Ítems */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Ítems del presupuesto
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                  Descripción
                </th>
                <th className="w-24 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Cant.
                </th>
                <th className="w-20 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Unidad
                </th>
                <th className="w-32 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Costo unit.
                </th>
                <th className="w-32 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Total
                </th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fields.map((field, idx) => {
                const qty = Number(watchedItems[idx]?.quantity) || 0;
                const cost = Number(watchedItems[idx]?.unit_cost) || 0;
                const lineTotal = qty * cost;

                return (
                  <tr key={field.id}>
                    <td className="px-4 py-2">
                      <input
                        {...form.register(`items.${idx}.description`)}
                        className={inputClass}
                        placeholder="Descripción del ítem"
                      />
                      {form.formState.errors.items?.[idx]?.description && (
                        <p className="mt-0.5 text-xs text-red-600">
                          {form.formState.errors.items[idx]?.description?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        {...form.register(`items.${idx}.quantity`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0.01"
                        className={`${inputClass} text-right`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        {...form.register(`items.${idx}.unit`)}
                        className={inputClass}
                        placeholder="m², hr…"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        {...form.register(`items.${idx}.unit_cost`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className={`${inputClass} text-right`}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatMoney(lineTotal, watchedCurrency as "USD" | "VES")}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="text-slate-400 hover:text-red-500"
                          aria-label="Eliminar ítem"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {form.formState.errors.items?.root && (
          <p className="text-xs text-red-600">
            {form.formState.errors.items.root.message}
          </p>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              append({ description: "", quantity: 1, unit_cost: 0, unit: "" })
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            + Agregar ítem
          </button>

          <div className="text-right">
            <span className="text-xs text-slate-500">Total estimado</span>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatMoney(baseTotal, watchedCurrency as "USD" | "VES")}
            </p>
          </div>
        </div>
      </section>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {isSubmitting
            ? "Guardando…"
            : budgetId
              ? "Guardar cambios"
              : "Crear presupuesto"}
        </button>
      </div>
    </form>
  );
}
