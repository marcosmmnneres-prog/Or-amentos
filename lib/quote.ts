import type { Quote } from "./types";
import { daysLeft } from "./format";

export function quoteTotals(q: Quote) {
  const lines = q.items.map((i) => (i.qty || 0) * (i.price || 0));
  const products = q.items.reduce((s, i, k) => (i.kind === "produto" ? s + lines[k] : s), 0);
  const services = q.items.reduce((s, i, k) => (i.kind === "servico" ? s + lines[k] : s), 0);
  const subtotal = products + services;
  const discount = q.discountType === "pct" ? (subtotal * (q.discount || 0)) / 100 : q.discount || 0;
  const base = Math.max(0, subtotal - discount);
  const tax = (base * (q.taxPct || 0)) / 100;
  const extra = q.extra || 0;
  const total = base + tax + extra;
  return { lines, products, services, subtotal, discount, tax, extra, total };
}

export function quoteValidity(q: Quote) {
  const left = daysLeft(q.issueDate, q.validityDays);
  return { left, expired: left < 0, soon: left >= 0 && left <= 3 };
}

export const quoteStatusLabel: Record<Quote["status"], string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export const compareStatusLabel = {
  aberto: "Em cotação",
  decidido: "Decidido",
  comprado: "Comprado",
} as const;
