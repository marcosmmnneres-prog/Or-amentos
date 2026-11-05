"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Download, History, Package } from "lucide-react";
import CrudPage from "@/components/Crud";
import { toast, useApp } from "@/lib/store";
import { brl, fmtDate, normalize, uid } from "@/lib/format";

interface HistEntry {
  at: number;
  price: number;
  store: string;
  title: string;
  cid: string;
}

export default function CatalogPage() {
  const comparisons = useApp((s) => s.comparisons);
  const catalog = useApp((s) => s.catalog);
  const upsert = useApp((s) => s.upsert);

  const history = useMemo(() => {
    const map = new Map<string, HistEntry[]>();
    for (const c of comparisons)
      for (const it of c.items) {
        if (!it.name) continue;
        const k = normalize(it.name);
        for (const s of c.stores) {
          const p = it.prices[s.id];
          if (p == null) continue;
          (map.get(k) || map.set(k, []).get(k)!).push({ at: c.updatedAt, price: p, store: s.name, title: c.title, cid: c.id });
        }
      }
    map.forEach((v) => v.sort((a, b) => b.at - a.at));
    return map;
  }, [comparisons]);

  const importFromComparisons = () => {
    const have = new Set(catalog.map((c) => normalize(c.name)));
    let n = 0;
    for (const c of comparisons)
      for (const it of c.items) {
        const k = normalize(it.name || "");
        if (!k || have.has(k)) continue;
        have.add(k);
        const prices = history.get(k)?.map((h) => h.price) || [];
        upsert("catalog", {
          id: uid(),
          name: it.name.trim(),
          unit: it.unit || "un",
          kind: "produto",
          price: prices.length ? Math.min(...prices) : null,
          category: c.category || "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        n++;
      }
    toast(n ? `${n} item(ns) adicionados ao catálogo` : "Nenhum item novo para importar");
  };

  const stats = (name: string) => {
    const h = history.get(normalize(name)) || [];
    if (!h.length) return null;
    const ps = h.map((x) => x.price);
    return { min: Math.min(...ps), max: Math.max(...ps), last: h[0], count: h.length };
  };

  return (
    <CrudPage
      collection="catalog"
      title="Catálogo de itens"
      crumb="Cadastros"
      singular="Item"
      emptyIcon={<Package />}
      emptyText="Guarde os produtos e serviços que você usa sempre. Eles aparecem como sugestão ao digitar, já com unidade e preço."
      defaults={{ unit: "un", kind: "produto" }}
      headerExtra={
        comparisons.length > 0 && (
          <button className="btn" onClick={importFromComparisons}>
            <Download /> Importar dos comparativos
          </button>
        )
      }
      fields={[
        { key: "name", label: "Nome do item ou serviço" },
        { key: "unit", label: "Unidade", half: true, placeholder: "un, m², kg, hora…" },
        { key: "price", label: "Preço padrão (R$)", type: "money", half: true },
        {
          key: "kind",
          label: "Tipo",
          type: "select",
          half: true,
          options: [
            { value: "produto", label: "Produto" },
            { value: "servico", label: "Serviço" },
          ],
        },
        { key: "category", label: "Categoria", half: true, placeholder: "Ex.: Elétrica, Mercado" },
      ]}
      cols={[
        { label: "Item", render: (r) => <><div className="t">{String(r.name)}</div><div className="s">{r.kind === "servico" ? "Serviço" : "Produto"} · {String(r.unit || "un")}{r.category ? ` · ${r.category}` : ""}</div></> },
        { label: "Preço padrão", className: "right", render: (r) => <span className="num">{brl(r.price as number | null)}</span> },
        {
          label: "Histórico (menor / maior)",
          className: "right hide-m",
          render: (r) => {
            const s = stats(String(r.name));
            return s ? <span className="num"><span className="amber">{brl(s.min)}</span> <span className="dim">/</span> {brl(s.max)}</span> : <span className="dim">—</span>;
          },
        },
      ]}
      extra={(r) => {
        const h = history.get(normalize(String(r.name))) || [];
        return (
          <div style={{ marginTop: 8 }}>
            <div className="row" style={{ marginBottom: 10 }}>
              <History size={16} className="orange" />
              <h3>Histórico de preços</h3>
            </div>
            {!h.length ? (
              <p className="muted small">Este item ainda não apareceu em nenhum comparativo com preço.</p>
            ) : (
              <>
                <Spark values={[...h].reverse().map((x) => x.price)} />
                <div className="hist" style={{ marginTop: 10 }}>
                  {h.slice(0, 12).map((x, i) => (
                    <div key={i} className="hist-row">
                      <span className="dim">{fmtDate(x.at)}</span>
                      <span className="ellipsis">
                        {x.store} · <Link className="link" href={`/comparativos/${x.cid}`}>{x.title}</Link>
                      </span>
                      <span className="num">{brl(x.price)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      }}
    />
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 460;
  const h = 60;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 8) + 4, h - 6 - ((v - min) / span) * (h - 12)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Evolução do preço">
      <path d={d} fill="none" stroke="var(--orange)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={values[i] === min ? "var(--amber)" : "var(--orange)"} />
      ))}
    </svg>
  );
}
