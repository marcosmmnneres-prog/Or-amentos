"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChartColumn, FileText, LayoutTemplate, Plus, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { analyze } from "@/lib/compare";
import { quoteTotals, quoteValidity } from "@/lib/quote";
import { brl, fmtRelative, quoteCode } from "@/lib/format";
import { NewDialog } from "@/components/NewDialog";
import { CompareChip, QuoteChip } from "@/components/badges";
import { PageHead } from "@/components/ui";

export default function Dashboard() {
  const router = useRouter();
  const comparisons = useApp((s) => s.comparisons);
  const quotes = useApp((s) => s.quotes);
  const company = useApp((s) => s.company);
  const loadSample = useApp((s) => s.loadSample);
  const [dlg, setDlg] = useState<null | "comparativo" | "orcamento">(null);

  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const m = monthStart.getTime();
    let savings = 0;
    let savingsMonth = 0;
    const compInfo = new Map<string, ReturnType<typeof analyze>>();
    comparisons.forEach((c) => {
      const r = analyze(c);
      compInfo.set(c.id, r);
      savings += r.savings;
      if (c.updatedAt >= m) savingsMonth += r.savings;
    });
    const sent = quotes.filter((q) => q.status === "enviado");
    const approved = quotes.filter((q) => q.status === "aprovado");
    const refused = quotes.filter((q) => q.status === "recusado");
    const approvedMonth = approved.filter((q) => q.updatedAt >= m).reduce((s, q) => s + quoteTotals(q).total, 0);
    const rate = approved.length + refused.length ? Math.round((approved.length / (approved.length + refused.length)) * 100) : null;
    const expiring = sent.filter((q) => {
      const v = quoteValidity(q);
      return v.expired || v.soon;
    });
    return {
      savings,
      savingsMonth,
      sentCount: sent.length,
      sentValue: sent.reduce((s, q) => s + quoteTotals(q).total, 0),
      approvedMonth,
      rate,
      expiring,
      compInfo,
    };
  }, [comparisons, quotes]);

  const recent = useMemo(
    () =>
      [
        ...comparisons.map((c) => ({ kind: "c" as const, at: c.updatedAt, c })),
        ...quotes.map((q) => ({ kind: "q" as const, at: q.updatedAt, q })),
      ]
        .sort((a, b) => b.at - a.at)
        .slice(0, 7),
    [comparisons, quotes]
  );

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dateStr = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const isEmpty = !comparisons.length && !quotes.length;

  return (
    <>
      <PageHead crumb={<span style={{ textTransform: "capitalize" }}>{dateStr}</span>} title={`${greet}${company.name ? ", " + company.name.split(" ")[0] : ""}! Vamos orçar?`}>
        <button className="btn" onClick={() => setDlg("orcamento")}>
          <Plus /> Orçamento
        </button>
        <button className="btn btn-primary" onClick={() => setDlg("comparativo")}>
          <Plus /> Novo comparativo
        </button>
      </PageHead>

      {isEmpty && (
        <div className="win-card" style={{ marginBottom: 22, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="lbl">Bem-vindo ao Orça+</div>
            <h2 style={{ fontSize: 20, margin: "8px 0 6px" }}>Seu primeiro orçamento em menos de 2 minutos</h2>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
              Compare preços de várias lojas item a item, ou crie um orçamento com a sua marca e gere o PDF. Quer ver como funciona?
              Carregue um exemplo pronto.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              const { comparisonId } = loadSample();
              router.push(`/comparativos/${comparisonId}`);
            }}
          >
            <Sparkles /> Ver um exemplo
          </button>
        </div>
      )}

      <div className="kpis">
        <div className="card kpi hl">
          <div className="lbl">Economia identificada</div>
          <div className="val num">{brl(stats.savings)}</div>
          <div className="delta">{brl(stats.savingsMonth)} neste mês</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Aguardando resposta</div>
          <div className="val num">{stats.sentCount}</div>
          <div className="delta">{brl(stats.sentValue)} em orçamentos</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Aprovado no mês</div>
          <div className="val num">{brl(stats.approvedMonth)}</div>
          <div className="delta">{quotes.filter((q) => q.status === "aprovado").length} aprovados no total</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Taxa de aprovação</div>
          <div className="val num">{stats.rate == null ? "—" : stats.rate + "%"}</div>
          <div className="delta">{comparisons.length} comparativos · {quotes.length} orçamentos</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Recentes</h2>
            <div className="row">
              <Link className="link" href="/comparativos">Comparativos</Link>
              <span className="dim">·</span>
              <Link className="link" href="/orcamentos">Orçamentos</Link>
            </div>
          </div>
          {!recent.length && <div className="empty" style={{ padding: 30 }}><p>Nada por aqui ainda.</p></div>}
          {recent.map((r) =>
            r.kind === "c" ? (
              <Link key={r.c.id} href={`/comparativos/${r.c.id}`} className="list-row">
                <div className="ico"><ChartColumn /></div>
                <div className="ellipsis">
                  <div className="t ellipsis">{r.c.title}</div>
                  <div className="s">Comparativo · {r.c.stores.length} lojas · {r.c.items.length} itens · {fmtRelative(r.at)}</div>
                </div>
                <div className="r">
                  <div className="num">{brl(bestValue(stats.compInfo.get(r.c.id)))}</div>
                  <CompareChip s={r.c.status} />
                </div>
              </Link>
            ) : (
              <Link key={r.q.id} href={`/orcamentos/${r.q.id}`} className="list-row">
                <div className="ico"><FileText /></div>
                <div className="ellipsis">
                  <div className="t ellipsis">{r.q.title}{r.q.client.name ? ` · ${r.q.client.name}` : ""}</div>
                  <div className="s">{quoteCode(r.q.number)} · {fmtRelative(r.at)}</div>
                </div>
                <div className="r">
                  <div className="num">{brl(quoteTotals(r.q).total)}</div>
                  <QuoteChip q={r.q} />
                </div>
              </Link>
            )
          )}
        </div>

        <div className="stack">
          {stats.expiring.length > 0 && (
            <div className="card">
              <div className="card-head">
                <h2 className="row"><AlertTriangle size={16} className="amber" /> Atenção à validade</h2>
              </div>
              {stats.expiring.map((q) => {
                const v = quoteValidity(q);
                return (
                  <Link key={q.id} href={`/orcamentos/${q.id}`} className="list-row">
                    <div className="ellipsis">
                      <div className="t ellipsis">{q.client.name || q.title}</div>
                      <div className="s">{quoteCode(q.number)} · {v.expired ? `venceu há ${-v.left} dia(s)` : v.left === 0 ? "vence hoje" : `vence em ${v.left} dia(s)`}</div>
                    </div>
                    <div className="r num">{brl(quoteTotals(q).total)}</div>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="card">
            <div className="card-head"><h2>Começar rápido</h2></div>
            <div className="quick">
              <button onClick={() => setDlg("comparativo")}>
                <div className="ico"><ChartColumn /></div>
                <div><div className="t">Comparar lojas</div><div className="s">Mesmos itens, vários lugares</div></div>
              </button>
              <button onClick={() => setDlg("orcamento")}>
                <div className="ico"><FileText /></div>
                <div><div className="t">Orçamento para cliente</div><div className="s">Gera PDF com a sua marca</div></div>
              </button>
              <Link href="/modelos">
                <div className="ico"><LayoutTemplate /></div>
                <div><div className="t">Usar um modelo</div><div className="s">Reforma, mercado, eventos, serviços…</div></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {dlg && <NewDialog kind={dlg} onClose={() => setDlg(null)} />}
    </>
  );
}

function bestValue(r?: ReturnType<typeof analyze>) {
  if (!r || !r.best) return null;
  return r.bestOption === "combinacao" && r.combo ? r.combo.total : r.best.total;
}
