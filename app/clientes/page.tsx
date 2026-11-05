"use client";

import { Users } from "lucide-react";
import CrudPage from "@/components/Crud";
import { useApp } from "@/lib/store";
import { quoteTotals } from "@/lib/quote";
import { brl } from "@/lib/format";

export default function ClientsPage() {
  const quotes = useApp((s) => s.quotes);
  const of = (id: string) => quotes.filter((q) => q.clientId === id);
  return (
    <CrudPage
      collection="clients"
      title="Clientes"
      crumb="Cadastros"
      singular="Cliente"
      emptyIcon={<Users />}
      emptyText="Cadastre seus clientes para preencher os orçamentos com um clique."
      fields={[
        { key: "name", label: "Nome", placeholder: "Nome completo ou empresa" },
        { key: "doc", label: "CPF / CNPJ", half: true },
        { key: "phone", label: "Telefone / WhatsApp", half: true, inputMode: "tel" },
        { key: "email", label: "E-mail", inputMode: "email" },
        { key: "address", label: "Endereço" },
        { key: "notes", label: "Observações", type: "textarea" },
      ]}
      cols={[
        { label: "Cliente", render: (r) => <><div className="t">{String(r.name)}</div>{r.email ? <div className="s">{String(r.email)}</div> : null}</> },
        { label: "Telefone", className: "hide-m", render: (r) => <span className="muted">{String(r.phone || "—")}</span> },
        { label: "Orçamentos", className: "right", render: (r) => <span className="num">{of(r.id).length}</span> },
        {
          label: "Aprovado",
          className: "right hide-m",
          render: (r) => <span className="num">{brl(of(r.id).filter((q) => q.status === "aprovado").reduce((s, q) => s + quoteTotals(q).total, 0))}</span>,
        },
      ]}
    />
  );
}
