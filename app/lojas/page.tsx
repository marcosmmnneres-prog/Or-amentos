"use client";

import { Store } from "lucide-react";
import CrudPage from "@/components/Crud";
import { useApp } from "@/lib/store";

export default function StoresPage() {
  const comparisons = useApp((s) => s.comparisons);
  const usage = (id: string) => comparisons.filter((c) => c.stores.some((s) => s.storeId === id)).length;
  return (
    <CrudPage
      collection="stores"
      title="Lojas e fornecedores"
      crumb="Cadastros"
      singular="Loja"
      emptyIcon={<Store />}
      emptyText="Cadastre as lojas onde você costuma cotar. Elas aparecem para escolher rápido nos comparativos. Lojas adicionadas num comparativo também entram aqui."
      fields={[
        { key: "name", label: "Nome", placeholder: "Ex.: Depósito Central" },
        { key: "phone", label: "Telefone / WhatsApp", half: true, inputMode: "tel" },
        { key: "site", label: "Site ou contato", half: true, inputMode: "url" },
        { key: "address", label: "Endereço" },
        { key: "notes", label: "Observações", type: "textarea", placeholder: "Vendedor, condições especiais…" },
      ]}
      cols={[
        { label: "Loja", render: (r) => <><div className="t">{String(r.name)}</div>{r.address ? <div className="s">{String(r.address)}</div> : null}</> },
        { label: "Contato", className: "hide-m", render: (r) => <span className="muted">{String(r.phone || r.site || "—")}</span> },
        { label: "Comparativos", className: "right", render: (r) => <span className="num">{usage(r.id)}</span> },
      ]}
    />
  );
}
