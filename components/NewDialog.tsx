"use client";

import { useRouter } from "next/navigation";
import { FilePlus2, LayoutTemplate } from "lucide-react";
import { useApp } from "@/lib/store";
import { builtInTemplates } from "@/lib/templates";
import { Modal } from "./ui";

export function NewDialog({ kind, onClose }: { kind: "comparativo" | "orcamento"; onClose: () => void }) {
  const router = useRouter();
  const custom = useApp((s) => s.templates);
  const newComparison = useApp((s) => s.newComparison);
  const newQuote = useApp((s) => s.newQuote);
  const list = [...custom, ...builtInTemplates].filter((t) => t.kind === kind);

  const create = (t?: (typeof list)[number]) => {
    if (kind === "comparativo") router.push(`/comparativos/${newComparison(t)}`);
    else router.push(`/orcamentos/${newQuote(t)}`);
    onClose();
  };

  return (
    <Modal title={kind === "comparativo" ? "Novo comparativo" : "Novo orçamento"} onClose={onClose} wide>
      <div className="tpl-grid">
        <button className="card tpl" onClick={() => create()} style={{ borderColor: "rgba(255,106,0,.45)" }}>
          <div className="ico">
            <FilePlus2 />
          </div>
          <div className="t">Em branco</div>
          <div className="s">Comece do zero{kind === "comparativo" ? " com 3 lojas" : ""}.</div>
        </button>
        {list.map((t) => (
          <button key={t.id} className="card tpl" onClick={() => create(t)}>
            <div className="ico">
              <LayoutTemplate />
            </div>
            <div className="t">{t.name}</div>
            <div className="s">{t.description}</div>
            {!t.builtIn && <span className="chip ok" style={{ alignSelf: "flex-start" }}>Meu modelo</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}
