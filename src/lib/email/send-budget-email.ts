import type { Currency } from "@/lib/domain/currency";
import { CURRENCY_LOCALES } from "@/lib/domain/currency";

interface SendBudgetEmailOptions {
  to: string;
  budgetCode: string;
  budgetTitle: string;
  clientName: string;
  currency: Currency;
  clientTotal: number;
  pdfBuffer: Buffer;
}

function money(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
  }).format(amount);
}

export async function sendBudgetEmail(
  opts: SendBudgetEmailOptions,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // omisión silenciosa si no está configurado

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const from =
    process.env.RESEND_FROM_EMAIL ?? "presupuestos@sceinternational.com";

  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: `Presupuesto ${opts.budgetCode}: ${opts.budgetTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
        <div style="border-bottom:3px solid #15803d;padding-bottom:16px;margin-bottom:24px">
          <h1 style="font-size:20px;margin:0;color:#15803d">SCE International</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#64748b">
            Construcción · Remodelación · Jardinería
          </p>
        </div>

        <p>Estimado/a <strong>${opts.clientName}</strong>,</p>

        <p>
          Nos complace enviarle el presupuesto <strong>${opts.budgetCode}</strong>
          — <em>${opts.budgetTitle}</em> —, aprobado por nuestra gerencia para
          su consideración.
        </p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr>
            <td style="padding:8px 12px;background:#f0fdf4;border-radius:4px;font-size:13px;color:#64748b">
              Total del presupuesto
            </td>
            <td style="padding:8px 12px;background:#f0fdf4;border-radius:4px;font-size:16px;font-weight:bold;color:#15803d;text-align:right">
              ${money(opts.clientTotal, opts.currency)}
            </td>
          </tr>
        </table>

        <p style="font-size:13px;color:#475569">
          Encontrará el detalle completo en el documento PDF adjunto.
          Si tiene alguna consulta o desea proceder, no dude en contactarnos.
        </p>

        <p style="font-size:13px;color:#475569;margin-top:24px">
          Atentamente,<br>
          <strong>SCE International</strong><br>
          <a href="mailto:${from}" style="color:#15803d">${from}</a>
        </p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin-top:32px">
        <p style="font-size:11px;color:#94a3b8;text-align:center">
          Este mensaje y sus adjuntos son confidenciales.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `presupuesto-${opts.budgetCode}.pdf`,
        content: opts.pdfBuffer,
      },
    ],
  });

  if (error) {
    console.error("[email] Error al enviar presupuesto:", error);
  }
}
