"use client";

import type { CompareStatus, Quote } from "@/lib/types";
import { compareStatusLabel, quoteStatusLabel, quoteValidity } from "@/lib/quote";

export function QuoteChip({ q }: { q: Quote }) {
  const v = quoteValidity(q);
  if (q.status === "enviado" && v.expired) return <span className="chip bad">Vencido</span>;
  const cls = { rascunho: "draft", enviado: "sent", aprovado: "ok", recusado: "bad" }[q.status];
  return (
    <span className={"chip " + cls}>
      {quoteStatusLabel[q.status]}
      {q.status === "enviado" && v.soon ? ` · vence em ${v.left}d` : ""}
    </span>
  );
}

export function CompareChip({ s }: { s: CompareStatus }) {
  const cls = { aberto: "sent", decidido: "ok", comprado: "draft" }[s];
  return <span className={"chip " + cls}>{compareStatusLabel[s]}</span>;
}
