"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChartColumn, FileText, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { builtInTemplates } from "@/lib/templates";
import type { Template } from "@/lib/types";
import { PageHead, confirmDelete } from "@/components/ui";

export default function TemplatesPage() {
  const router = useRouter();
  const custom = useApp((s) => s.templates);
  const remove = useApp((s) => s.remove);
  const newComparison = useApp((s) => s.newComparison);
  const newQuote = useApp((s) => s.newQuote);
  const [kind, setKind] = useState<"todos" | Template["kind"]>("todos");

  const use = (t: Template) => {
    if (t.kind === "comparativo") router.push(`/comparativos/${newComparison(t)}`);
    else router.push(`/orcamentos/${newQuote(t)}`);
  };
  const filter = (l: Template[]) => l.filter((t) => kind === "todos" || t.kind === kind);

  const Card = ({ t }: { t: Template }) => (
    <div className="card tpl">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="ico">{t.kind === "comparativo" ? <ChartColumn /> : <FileText />}</div>
        {!t.builtIn && (
          <button className="icon-btn danger" aria-label="Excluir modelo" onClick={() => confirmDelete(`o modelo "${t.name}"`) && remove("templates", t.id)}>
            <Trash2 />
          </button>
        )}
      </div>
      <div className="t">{t.name}</div>
      <div className="s">
        {t.kind === "comparativo" ? "Comparativo" : "Orçamento"} · {t.description}
      </div>
      <button className="btn btn-sm" onClick={() => use(t)}>Usar este modelo</button>
    </div>
  );

  return (
    <>
      <PageHead crumb="Comece mais rápido" title="Modelos" />
      <div className="toolbar">
        <div className="fchips">
          {(["todos", "comparativo", "orcamento"] as const).map((k) => (
            <button key={k} className={"fchip" + (kind === k ? " active" : "")} onClick={() => setKind(k)}>
              {k === "todos" ? "Todos" : k === "comparativo" ? "Comparativos" : "Orçamentos"}
            </button>
          ))}
        </div>
      </div>

      <h2 style={{ margin: "6px 0 12px" }}>Meus modelos</h2>
      {filter(custom).length ? (
        <div className="tpl-grid" style={{ marginBottom: 28 }}>
          {filter(custom).map((t) => <Card key={t.id} t={t} />)}
        </div>
      ) : (
        <div className="card pad muted small" style={{ marginBottom: 28 }}>
          Abra qualquer comparativo ou orçamento e use <b>⋯ → Salvar como modelo</b> para reaproveitar a estrutura depois.
        </div>
      )}

      <h2 style={{ margin: "6px 0 12px" }}>Modelos prontos</h2>
      <div className="tpl-grid">
        {filter(builtInTemplates).map((t) => <Card key={t.id} t={t} />)}
      </div>
    </>
  );
}
