"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChartColumn, Plus, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { analyze } from "@/lib/compare";
import { brl, fmtRelative, normalize } from "@/lib/format";
import type { CompareStatus } from "@/lib/types";
import { compareStatusLabel } from "@/lib/quote";
import { NewDialog } from "@/components/NewDialog";
import { CompareChip } from "@/components/badges";
import { Empty, PageHead } from "@/components/ui";

export default function ComparisonsPage() {
  const list = useApp((s) => s.comparisons);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CompareStatus | "todos">("todos");
  const [dlg, setDlg] = useState(false);

  const rows = useMemo(() => {
    const nq = normalize(q);
    return list
      .filter((c) => status === "todos" || c.status === status)
      .filter((c) => !nq || normalize(`${c.title} ${c.category} ${c.stores.map((s) => s.name).join(" ")} ${c.items.map((i) => i.name).join(" ")}`).includes(nq))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((c) => ({ c, r: analyze(c) }));
  }, [list, q, status]);

  return (
    <>
      <PageHead crumb="Comparar preços entre lojas" title="Comparativos">
        <button className="btn btn-primary" onClick={() => setDlg(true)}>
          <Plus /> Novo comparativo
        </button>
      </PageHead>

      <div className="toolbar">
        <label className="search">
          <Search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, loja ou item…" />
        </label>
        <div className="fchips">
          {(["todos", ...Object.keys(compareStatusLabel)] as const).map((k) => (
            <button key={k} className={"fchip" + (status === k ? " active" : "")} onClick={() => setStatus(k as CompareStatus | "todos")}>
              {k === "todos" ? "Todos" : compareStatusLabel[k as CompareStatus]}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {!rows.length ? (
          <Empty
            icon={<ChartColumn />}
            title={list.length ? "Nada encontrado" : "Nenhum comparativo ainda"}
            text={list.length ? "Tente outra busca ou filtro." : "Liste os itens, adicione as lojas e preencha os preços. O Orça+ mostra onde comprar mais barato."}
          >
            {!list.length && (
              <button className="btn btn-primary" onClick={() => setDlg(true)}>
                <Plus /> Criar comparativo
              </button>
            )}
          </Empty>
        ) : (
          rows.map(({ c, r }, i) => {
            const isCombo = r.bestOption === "combinacao" && r.combo;
            const bestName = r.best ? c.stores.find((s) => s.id === r.best!.storeId)?.name : null;
            return (
              <Link key={c.id} href={`/comparativos/${c.id}`} className="list-row" style={i === 0 ? { borderTop: 0 } : undefined}>
                <div className="ico"><ChartColumn /></div>
                <div className="ellipsis">
                  <div className="t ellipsis">{c.title}</div>
                  <div className="s ellipsis">
                    {c.category ? c.category + " · " : ""}
                    {c.stores.length} lojas · {c.items.length} itens · {fmtRelative(c.updatedAt)}
                  </div>
                </div>
                <div className="r">
                  <div className="num">{r.best ? brl(isCombo ? r.combo!.total : r.best.total) : "—"}</div>
                  <div className="s small dim" style={{ marginTop: 2 }}>
                    {r.best ? (isCombo ? `${r.combo!.stores.length} lojas` : bestName) : "sem preços"}
                    {r.savings > 0 ? <span className="amber"> · −{brl(r.savings)}</span> : null}
                  </div>
                  <CompareChip s={c.status} />
                </div>
              </Link>
            );
          })
        )}
      </div>
      {dlg && <NewDialog kind="comparativo" onClose={() => setDlg(false)} />}
    </>
  );
}
