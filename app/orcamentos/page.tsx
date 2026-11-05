"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { quoteStatusLabel, quoteTotals } from "@/lib/quote";
import { brl, fmtDate, normalize, quoteCode } from "@/lib/format";
import type { QuoteStatus } from "@/lib/types";
import { NewDialog } from "@/components/NewDialog";
import { QuoteChip } from "@/components/badges";
import { Empty, PageHead } from "@/components/ui";

export default function QuotesPage() {
  const list = useApp((s) => s.quotes);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<QuoteStatus | "todos">("todos");
  const [dlg, setDlg] = useState(false);

  const rows = useMemo(() => {
    const nq = normalize(q);
    return list
      .filter((x) => status === "todos" || x.status === status)
      .filter((x) => !nq || normalize(`${x.title} ${x.client.name} ${quoteCode(x.number)}`).includes(nq))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [list, q, status]);

  const sum = rows.reduce((s, x) => s + quoteTotals(x).total, 0);

  return (
    <>
      <PageHead crumb="Orçamentos para seus clientes" title="Orçamentos">
        <button className="btn btn-primary" onClick={() => setDlg(true)}>
          <Plus /> Novo orçamento
        </button>
      </PageHead>

      <div className="toolbar">
        <label className="search">
          <Search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente, título ou número…" />
        </label>
        <div className="fchips">
          {(["todos", ...Object.keys(quoteStatusLabel)] as const).map((k) => (
            <button key={k} className={"fchip" + (status === k ? " active" : "")} onClick={() => setStatus(k as QuoteStatus | "todos")}>
              {k === "todos" ? "Todos" : quoteStatusLabel[k as QuoteStatus]}
            </button>
          ))}
        </div>
        {rows.length > 0 && <span className="muted small" style={{ marginLeft: "auto" }}>{rows.length} orçamento(s) · <b className="num">{brl(sum)}</b></span>}
      </div>

      <div className="card">
        {!rows.length ? (
          <Empty
            icon={<FileText />}
            title={list.length ? "Nada encontrado" : "Nenhum orçamento ainda"}
            text={list.length ? "Tente outra busca ou filtro." : "Monte o orçamento, veja a prévia com a sua marca e gere o PDF para enviar ao cliente."}
          >
            {!list.length && (
              <button className="btn btn-primary" onClick={() => setDlg(true)}>
                <Plus /> Criar orçamento
              </button>
            )}
          </Empty>
        ) : (
          rows.map((x, i) => (
            <Link key={x.id} href={`/orcamentos/${x.id}`} className="list-row" style={i === 0 ? { borderTop: 0 } : undefined}>
              <div className="ico"><FileText /></div>
              <div className="ellipsis">
                <div className="t ellipsis">{x.client.name || "Sem cliente"} · {x.title}</div>
                <div className="s">{quoteCode(x.number)} · emitido em {fmtDate(x.issueDate)} · {x.items.length} itens</div>
              </div>
              <div className="r">
                <div className="num">{brl(quoteTotals(x).total)}</div>
                <QuoteChip q={x} />
              </div>
            </Link>
          ))
        )}
      </div>
      {dlg && <NewDialog kind="orcamento" onClose={() => setDlg(false)} />}
    </>
  );
}
