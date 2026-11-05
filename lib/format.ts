export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qtyFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export const brl = (v: number | null | undefined) => (v == null || isNaN(v) ? "—" : brlFmt.format(v));
export const num = (v: number | null | undefined) => (v == null || isNaN(v) ? "" : numFmt.format(v));
export const qty = (v: number | null | undefined) => (v == null || isNaN(v) ? "" : qtyFmt.format(v));

/** Converte texto digitado em número, aceitando "1.234,56", "1234,5", "12.5", "R$ 10". */
export function parseNum(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return isNaN(input) ? null : input;
  let s = input.trim().replace(/[^\d,.\-]/g, "");
  if (!s || s === "-") return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (!/^-?\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const fmtDate = (iso: string | number) => {
  const d = typeof iso === "number" ? new Date(iso) : new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR");
};

export const fmtRelative = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d} dia${d > 1 ? "s" : ""}`;
  return fmtDate(ts);
};

export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d;
};

/** Dias até o vencimento (negativo = vencido). */
export const daysLeft = (iso: string, validity: number) => {
  const end = addDays(iso, validity);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((end.getTime() - now.getTime()) / 86400000);
};

export const quoteCode = (n: number) => `ORC-${String(n).padStart(4, "0")}`;

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, " ");

export const onlyDigits = (s?: string) => (s || "").replace(/\D/g, "");
