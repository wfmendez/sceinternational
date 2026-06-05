import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { CURRENCY_LOCALES, type Currency } from "@/lib/domain/currency";

/**
 * Plantilla del presupuesto entregable al cliente (PDF).
 *
 * IMPORTANTE: este documento muestra SOLO precios al cliente (ya con el margen
 * aplicado). Nunca expone costo base ni el porcentaje de margen.
 *
 * Es una plantilla de MUESTRA para una empresa de servicios de construcción,
 * remodelación y jardinería; se reemplazará por el modelo real del cliente.
 */

export interface BudgetDocLineItem {
  description: string;
  quantity: number;
  unit?: string;
  /** Precio unitario al cliente (con margen incluido). */
  unitPrice: number;
  /** quantity * unitPrice. */
  total: number;
}

export interface BudgetDocumentData {
  company: {
    name: string;
    tagline: string;
    rif?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  documentCode: string;
  issuedAt: string;
  validityDays?: number;
  client: {
    name: string;
    contact?: string;
    email?: string;
    address?: string;
  };
  title: string;
  currency: Currency;
  items: BudgetDocLineItem[];
  subtotal: number;
  total: number;
  notes?: string;
}

const COLORS = {
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  accent: "#15803d",
  accentSoft: "#f0fdf4",
  zebra: "#f8fafc",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 9.5,
    color: COLORS.ink,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingBottom: 12,
  },
  logoBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 9,
  },
  companyName: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  companyTagline: { fontSize: 8.5, color: COLORS.accent, marginTop: 2 },
  docMeta: { textAlign: "right" },
  docTitleTag: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  docCode: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 2 },
  docDate: { fontSize: 8.5, color: COLORS.muted, marginTop: 2 },

  section: { marginTop: 18 },
  twoCols: { flexDirection: "row", justifyContent: "space-between", gap: 24 },
  col: { flex: 1 },
  label: {
    fontSize: 7.5,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  strong: { fontFamily: "Helvetica-Bold" },
  muted: { color: COLORS.muted },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 18 },

  table: { marginTop: 10, borderWidth: 1, borderColor: COLORS.line, borderRadius: 4 },
  tHead: {
    flexDirection: "row",
    backgroundColor: COLORS.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  tRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.line },
  tRowAlt: { backgroundColor: COLORS.zebra },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", padding: 7, color: COLORS.muted },
  td: { padding: 7 },
  cDesc: { flex: 5 },
  cQty: { flex: 1.2, textAlign: "right" },
  cPrice: { flex: 1.8, textAlign: "right" },
  cTotal: { flex: 1.8, textAlign: "right" },

  totals: { marginTop: 12, alignItems: "flex-end" },
  totalsBox: { width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.accent,
  },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  grandValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COLORS.accent },

  notes: {
    marginTop: 20,
    backgroundColor: COLORS.zebra,
    borderRadius: 4,
    padding: 10,
  },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: COLORS.muted,
  },
});

function money(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
  }).format(amount);
}

export function BudgetDocument({ data }: { data: BudgetDocumentData }) {
  const { company, client, currency } = data;

  return (
    <Document
      title={`Presupuesto ${data.documentCode}`}
      author={company.name}
      subject={data.title}
    >
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.logoBlock}>
            <Text style={styles.logoMark}>SCE</Text>
            <View>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companyTagline}>{company.tagline}</Text>
            </View>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docTitleTag}>Presupuesto</Text>
            <Text style={styles.docCode}>{data.documentCode}</Text>
            <Text style={styles.docDate}>Emitido: {data.issuedAt}</Text>
            {data.validityDays ? (
              <Text style={styles.docDate}>Validez: {data.validityDays} días</Text>
            ) : null}
          </View>
        </View>

        {/* Empresa / Cliente */}
        <View style={[styles.section, styles.twoCols]}>
          <View style={styles.col}>
            <Text style={styles.label}>De</Text>
            <Text style={styles.strong}>{company.name}</Text>
            {company.rif ? <Text style={styles.muted}>RIF: {company.rif}</Text> : null}
            {company.address ? <Text style={styles.muted}>{company.address}</Text> : null}
            {company.email ? <Text style={styles.muted}>{company.email}</Text> : null}
            {company.phone ? <Text style={styles.muted}>{company.phone}</Text> : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Para</Text>
            <Text style={styles.strong}>{client.name}</Text>
            {client.contact ? <Text style={styles.muted}>At.: {client.contact}</Text> : null}
            {client.address ? <Text style={styles.muted}>{client.address}</Text> : null}
            {client.email ? <Text style={styles.muted}>{client.email}</Text> : null}
          </View>
        </View>

        <Text style={styles.title}>{data.title}</Text>

        {/* Tabla de partidas */}
        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={[styles.th, styles.cDesc]}>Descripción</Text>
            <Text style={[styles.th, styles.cQty]}>Cant.</Text>
            <Text style={[styles.th, styles.cPrice]}>P. unitario</Text>
            <Text style={[styles.th, styles.cTotal]}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View
              key={i}
              style={i % 2 === 1 ? [styles.tRow, styles.tRowAlt] : styles.tRow}
              wrap={false}
            >
              <View style={[styles.td, styles.cDesc]}>
                <Text>{item.description}</Text>
                {item.unit ? <Text style={styles.muted}>{item.unit}</Text> : null}
              </View>
              <Text style={[styles.td, styles.cQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.cPrice]}>{money(item.unitPrice, currency)}</Text>
              <Text style={[styles.td, styles.cTotal]}>{money(item.total, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totals}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Subtotal</Text>
              <Text>{money(data.subtotal, currency)}</Text>
            </View>
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Total ({currency})</Text>
              <Text style={styles.grandValue}>{money(data.total, currency)}</Text>
            </View>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Notas</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        {/* Pie */}
        <View style={styles.footer} fixed>
          <Text>{company.name} — {company.tagline}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

/** Renderiza el presupuesto a un Buffer PDF (uso en route handlers). */
export function renderBudgetToBuffer(data: BudgetDocumentData) {
  return renderToBuffer(<BudgetDocument data={data} />);
}
