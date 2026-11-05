import type { Comparison, Company, DataState, Quote } from "./types";
import { analyze } from "./compare";
import { quoteTotals } from "./quote";
import { brl, fmtDate, num, onlyDigits, qty, quoteCode, todayISO } from "./format";

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCSV = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");

export function download(filename: string, content: string | Blob, type = "text/plain;charset=utf-8") {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "arquivo";

/* ---------- Comparativo ---------- */
export function comparisonCSV(c: Comparison) {
  const r = analyze(c);
  const head = ["Item", "Unidade", "Qtd", ...c.stores.map((s) => s.name), "Menor preço"];
  const rows: unknown[][] = [head];
  for (const it of c.items) {
    rows.push([it.name, it.unit, qty(it.qty), ...c.stores.map((s) => num(it.prices[s.id] ?? null)), num(r.itemStats[it.id]?.min)]);
  }
  rows.push([]);
  rows.push(["Subtotal", "", "", ...c.stores.map((s) => num(r.byStore[s.id].subtotal))]);
  rows.push(["Frete", "", "", ...c.stores.map((s) => num(s.frete))]);
  rows.push(["Total", "", "", ...c.stores.map((s) => num(r.byStore[s.id].total))]);
  rows.push(["Prazo", "", "", ...c.stores.map((s) => s.prazo || "")]);
  rows.push(["Pagamento", "", "", ...c.stores.map((s) => s.pagamento || "")]);
  download(`comparativo-${slug(c.title)}.csv`, toCSV(rows), "text/csv;charset=utf-8");
}

export function comparisonText(c: Comparison) {
  const r = analyze(c);
  const name = (id: string) => c.stores.find((s) => s.id === id)?.name || "";
  const lines = [`*${c.title}*`, `Comparativo de ${c.stores.length} lojas · ${c.items.length} itens`, ""];
  r.ranking.forEach((x, i) =>
    lines.push(`${i === 0 ? "🏆" : "•"} ${name(x.storeId)}: ${brl(x.total)}${x.missing ? ` (faltam ${x.missing} itens)` : ""}`)
  );
  if (r.combo && r.combo.stores.length > 1) {
    lines.push("", `*Melhor combinação:* ${brl(r.combo.total)}`);
    r.combo.stores.forEach((p) => lines.push(`  – ${name(p.storeId)}: ${p.itemIds.length} itens (${brl(p.subtotal + p.frete)})`));
  }
  if (r.savings > 0) lines.push("", `Economia: ${brl(r.savings)}`);
  return lines.join("\n");
}

/* ---------- Orçamento ---------- */
export function quoteCSV(q: Quote) {
  const t = quoteTotals(q);
  const rows: unknown[][] = [
    ["Orçamento", quoteCode(q.number)],
    ["Cliente", q.client.name],
    ["Emissão", fmtDate(q.issueDate)],
    [],
    ["Descrição", "Tipo", "Qtd", "Unidade", "Unitário", "Total"],
    ...q.items.map((i, k) => [i.desc, i.kind === "servico" ? "Serviço" : "Produto", qty(i.qty), i.unit, num(i.price), num(t.lines[k])]),
    [],
    ["Subtotal", "", "", "", "", num(t.subtotal)],
    ["Desconto", "", "", "", "", num(t.discount)],
    ["Impostos", "", "", "", "", num(t.tax)],
    [q.extraLabel || "Adicional", "", "", "", "", num(t.extra)],
    ["Total", "", "", "", "", num(t.total)],
  ];
  download(`${quoteCode(q.number)}-${slug(q.client.name || q.title)}.csv`, toCSV(rows), "text/csv;charset=utf-8");
}

export function quoteText(q: Quote, company: Company) {
  const t = quoteTotals(q);
  const lines = [
    `Olá${q.client.name ? ", " + q.client.name.split(" ")[0] : ""}! Segue o orçamento *${quoteCode(q.number)}* – ${q.title}:`,
    "",
    ...q.items.map((i, k) => `• ${i.desc} (${qty(i.qty)} ${i.unit}) – ${brl(t.lines[k])}`),
    "",
  ];
  if (t.discount) lines.push(`Desconto: −${brl(t.discount)}`);
  if (t.tax) lines.push(`Impostos: ${brl(t.tax)}`);
  if (t.extra) lines.push(`${q.extraLabel}: ${brl(t.extra)}`);
  lines.push(`*Total: ${brl(t.total)}*`);
  if (q.payment) lines.push(`Pagamento: ${q.payment}`);
  lines.push(`Validade: ${q.validityDays} dias`);
  if (company.name) lines.push("", company.name + (company.phone ? ` · ${company.phone}` : ""));
  return lines.join("\n");
}

export function openWhatsApp(text: string, phone?: string) {
  let p = onlyDigits(phone);
  if (p && p.length <= 11) p = "55" + p;
  window.open(`https://wa.me/${p}?text=${encodeURIComponent(text)}`, "_blank");
}

export async function shareText(title: string, text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }
  await navigator.clipboard.writeText(text);
  return false;
}

/* ---------- Backup ---------- */
export function backupJSON(data: DataState) {
  download(`backup-orcamentos-${todayISO()}.json`, JSON.stringify({ app: "orcamais", version: 1, data }, null, 2), "application/json");
}

export async function readBackup(file: File): Promise<Partial<DataState>> {
  const json = JSON.parse(await file.text());
  const data = json?.data ?? json;
  if (!data || typeof data !== "object" || !("comparisons" in data || "quotes" in data))
    throw new Error("Arquivo de backup inválido");
  return data;
}
