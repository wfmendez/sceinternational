"use client";

import { useState, useTransition } from "react";

import { transitionBudget } from "@/app/actions/budgets";
import {
  allowedTransitions,
  type BudgetStatus,
  type BudgetTransition,
} from "@/lib/domain/budget-status";
import type { Currency } from "@/lib/domain/currency";
import type { UserRole } from "@/lib/domain/roles";
import MarginForm from "./margin-form";

interface TransitionActionsProps {
  budgetId: string;
  status: BudgetStatus;
  role: UserRole;
  baseTotal?: number;
  currency?: Currency;
  clientEmail?: string | null;
}

const TONE_CLASSES: Record<string, string> = {
  "Enviar a Administración": "bg-blue-600 text-white hover:bg-blue-500",
  "Reenviar a Administración": "bg-blue-600 text-white hover:bg-blue-500",
  "Validar y aplicar margen": "bg-green-600 text-white hover:bg-green-500",
  "Enviar a Gerencia": "bg-blue-600 text-white hover:bg-blue-500",
  "Aprobar y enviar al cliente": "bg-green-600 text-white hover:bg-green-500",
  "Marcar aprobación del cliente":
    "bg-green-600 text-white hover:bg-green-500",
  "Habilitar ejecución de gastos":
    "bg-green-600 text-white hover:bg-green-500",
  "Cerrar presupuesto": "bg-slate-700 text-white hover:bg-slate-600",
  "Devolver al trabajador":
    "border border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20",
  "Devolver a Administración":
    "border border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20",
  "Reajustar y reenviar": "bg-blue-600 text-white hover:bg-blue-500",
};

function ActionButton({
  transition,
  budgetId,
  clientEmail,
}: {
  transition: BudgetTransition;
  budgetId: string;
  clientEmail?: string | null;
}) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSendToClient = transition.to === "approved_sent_to_client";
  const toneClass =
    TONE_CLASSES[transition.action] ??
    "bg-slate-900 text-white hover:bg-slate-700";

  const execute = () => {
    if (transition.requiresComment && !comment.trim()) {
      setError("El comentario es obligatorio");
      return;
    }
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const result = await transitionBudget(
        budgetId,
        transition.to,
        comment.trim() || undefined,
      );
      if (result?.error) {
        setError(result.error);
      } else if (isSendToClient) {
        if (result?.emailSent) {
          setSuccessMsg("Presupuesto enviado · correo enviado al cliente ✓");
        } else if (result?.noClientEmail) {
          setSuccessMsg(
            "Presupuesto aprobado · el cliente no tiene correo registrado, descarga el PDF y envíalo manualmente.",
          );
        } else {
          setSuccessMsg("Presupuesto aprobado y enviado al cliente.");
        }
      }
    });
  };

  if (transition.requiresComment && showComment) {
    return (
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <p className="mb-2 text-sm font-medium">{transition.action}</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Motivo / comentario para el destinatario…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            onClick={execute}
            disabled={isPending}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${toneClass}`}
          >
            {isPending ? "Procesando…" : "Confirmar"}
          </button>
          <button
            onClick={() => {
              setShowComment(false);
              setComment("");
              setError(null);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Aviso preventivo si falta correo del cliente */}
      {isSendToClient && !clientEmail && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          El cliente no tiene correo registrado. El presupuesto se aprobará pero
          el PDF tendrás que enviarlo manualmente.
        </p>
      )}
      <button
        onClick={() => {
          if (transition.requiresComment) {
            setShowComment(true);
          } else {
            execute();
          }
        }}
        disabled={isPending}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${toneClass}`}
      >
        {isPending ? "Procesando…" : transition.action}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {successMsg && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          {successMsg}
        </p>
      )}
    </div>
  );
}

export default function TransitionActions({
  budgetId,
  status,
  role,
  baseTotal = 0,
  currency = "USD",
  clientEmail,
}: TransitionActionsProps) {
  const transitions = allowedTransitions(status, role);
  const [showMarginForm, setShowMarginForm] = useState(false);

  if (!transitions.length) return null;

  const validateTransition = transitions.find(
    (t) => t.to === "validated_with_margin",
  );
  const otherTransitions = transitions.filter(
    (t) => t.to !== "validated_with_margin",
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Acciones disponibles
      </h3>

      {validateTransition && (
        <div>
          {showMarginForm ? (
            <MarginForm
              budgetId={budgetId}
              baseTotal={baseTotal}
              currency={currency}
              onCancel={() => setShowMarginForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowMarginForm(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${TONE_CLASSES[validateTransition.action] ?? "bg-green-600 text-white hover:bg-green-500"}`}
            >
              {validateTransition.action}
            </button>
          )}
        </div>
      )}

      {otherTransitions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {otherTransitions.map((t) => (
            <ActionButton
              key={t.to}
              transition={t}
              budgetId={budgetId}
              clientEmail={clientEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
