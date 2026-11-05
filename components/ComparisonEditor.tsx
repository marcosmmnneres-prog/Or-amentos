"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import {
  ChevronRight,
  Copy,
  Download,
  FileSpreadsheet,
  LayoutTemplate,
  MessageCircle,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { toast, useApp } from "@/lib/store";
import { analyze } from "@/lib/compare";
import type { CompareStatus, CompareStore, Comparison } from "@/lib/types";
import { brl, fmtDate, normalize, num, qty, uid } from "@/lib/format";
import { comparisonCSV, comparisonText, openWhatsApp, shareText } from "@/lib/export";
import { compareStatusLabel } from "@/lib/quote";
import { DropMenu, Empty, Field, Modal, NumInput, confirmDelete } from "./ui";
import { LogoMark } from "./AppShell";

export default function ComparisonEditor({ id }: { id: string }) {
  const router = useRouter();
  const c = useApp((s) => s.comparisons.find((x) => x.id === id));
  const patch = useApp((s) => s.patch);
  const remove = useApp((s) => s.remove);
  const duplicate = useApp((s) => s.duplicateComparison);
  const saveAsTemplate = useApp((s) => s.saveAsTemplate);
  const catalog = useApp((s) => s.catalog);
  const allComparisons = useApp((s) => s.comparisons);
  const [editStore, setEditStore] = useState<string | null>(null);
  const [addStore, setAddStore] = useState(false);

  const r = useMemo(() => (c ? analyze(c) : null), [c]);

  const suggestions = useMemo(() => {
    const set = new Map<string, string>();
    catalog.forEach((i) => set.set(normalize(i.name), i.name));
    allComparisons.forEach((x) => x.items.forEach((i) => i.name && set.set(normalize(i.name), i.name)));
    return [...set.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [catalog, allComparisons]);

  if (!c || !r)
    return (
      <Empty icon={<FileSpreadsheet />} title="Comparativo não encontrado" text="Ele pode ter sido excluído.">
        <Link href="/comparativos" className="btn">Voltar para comparativos</Link>
      </Empty>
    );

  const up = (fn: (c: Comparison) => Comparison) => patch("comparisons", id, fn as never);
  const setPrice = (itemId: string, storeId: string, v: number | null) =>
    up((c) => ({ ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, prices: { ...i.prices, [storeId]: v } } : i)) }));
  const setItem = (itemId: string, p: Partial<Comparison["items"][number]>) =>
    up((c) => ({ ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...p } : i)) }));
  const setStore = (storeId: string, p: Partial<CompareStore>) =>
    up((c) => ({ ...c, stores: c.stores.map((s) => (s.id === storeId ? { ...s, ...p } : s)) }));

  const addItem = (focus = true) => {
    const nid = uid();
    up((c) => ({ ...c, items: [...c.items, { id: nid, name: "", unit: "un", qty: 1, prices: {} }] }));
    if (focus) setTimeout(() => document.querySelector<HTMLInputElement>(`[data-item-name="${nid}"]`)?.focus(), 30);
  };
  const removeItem = (itemId: string) => up((c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId) }));

  const onPickName = (itemId: string, name: string) => {
    const cat = catalog.find((i) => normalize(i.name) === normalize(name));
    setItem(itemId, cat ? { name, unit: cat.unit || "un" } : { name });
  };

  /* navegação por teclado estilo planilha */
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: string) => {
    if (e.key !== "Enter" && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const nextRow = e.key === "ArrowUp" ? row - 1 : row + 1;
    if (nextRow < 0) return;
    if (nextRow >= c.items.length) {
      if (e.key === "Enter") {
        addItem(false);
        setTimeout(() => document.querySelector<HTMLInputElement>(`[data-nav="${nextRow}:${col}"]`)?.focus(), 30);
      }
      return;
    }
    document.querySelector<HTMLInputElement>(`[data-nav="${nextRow}:${col}"]`)?.focus();
  };

  const storeName = (sid: string) => c.stores.find((s) => s.id === sid)?.name || "";
  const best = r.best;
  const bestIsCombo = r.bestOption === "combinacao" && r.combo;
  const maxTotal = Math.max(1, ...r.ranking.map((x) => x.total));

  const share = async () => {
    const text = comparisonText(c);
    const shared = await shareText(c.title, text);
    if (!shared) toast("Resumo copiado para a área de transferência");
  };

  return (
    <>
      <div className="top no-print">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="crumb">
            <Link href="/comparativos">Comparativos</Link>
            <ChevronRight size={12} />
            <span>{c.category || "Sem categoria"}</span>
          </div>
          <input className="title-input" value={c.title} onChange={(e) => up((x) => ({ ...x, title: e.target.value }))} aria-label="Título" />
        </div>
        <div className="actions">
          <select
            className="input status-select"
            value={c.status}
            onChange={(e) => up((x) => ({ ...x, status: e.target.value as CompareStatus }))}
            aria-label="Situação"
          >
            {(Object.keys(compareStatusLabel) as CompareStatus[]).map((k) => (
              <option key={k} value={k}>{compareStatusLabel[k]}</option>
            ))}
          </select>
          <button className="btn" onClick={() => openWhatsApp(comparisonText(c))}>
            <MessageCircle /> WhatsApp
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Download /> Exportar PDF
          </button>
          <DropMenu
            items={[
              { label: "Exportar planilha (CSV/Excel)", icon: <FileSpreadsheet />, onClick: () => comparisonCSV(c) },
              { label: "Compartilhar resumo", icon: <Share2 />, onClick: share },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "Duplicar",
                icon: <Copy />,
                onClick: () => {
                  const nid = duplicate(c.id);
                  if (nid) {
                    toast("Comparativo duplicado");
                    router.push(`/comparativos/${nid}`);
                  }
                },
              },
              {
                label: "Salvar como modelo",
                icon: <LayoutTemplate />,
                onClick: () => {
                  const name = window.prompt("Nome do modelo:", c.title);
                  if (name) {
                    saveAsTemplate("comparativo", c.id, name);
                    toast("Modelo salvo");
                  }
                },
              },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "Excluir comparativo",
                icon: <Trash2 />,
                danger: true,
                onClick: () => {
                  if (confirmDelete("este comparativo")) {
                    remove("comparisons", c.id);
                    router.push("/comparativos");
                  }
                },
              },
            ]}
          />
        </div>
      </div>

      <div className="cmp-layout no-print">
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="legend">
            <span><i style={{ background: "var(--amber)" }} />Menor preço do item</span>
            <span><i style={{ background: "var(--bad)" }} />Maior preço</span>
            <span><i style={{ background: "var(--line-2)" }} />Vazio = sem cotação</span>
            <span className="hint">Enter ↓ desce para a próxima linha</span>
          </div>
          <div className="sheet-wrap">
            <table className="sheet">
              <thead>
                <tr>
                  <th className="sticky">Item</th>
                  <th style={{ textAlign: "right" }}>Qtd</th>
                  {c.stores.map((s) => {
                    const st = r.byStore[s.id];
                    const isBest = best?.storeId === s.id && !bestIsCombo;
                    return (
                      <th key={s.id} className="store">
                        <div className="store-head">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="store-name">
                              {s.name || "Sem nome"}
                              {isBest && <span className="badge">Melhor</span>}
                            </div>
                            <div className="store-sub">
                              {st.quoted === 0 ? "Sem preços ainda" : st.missing ? `${st.missing} item(ns) sem cotação` : "Cotação completa"}
                            </div>
                          </div>
                          <button className="icon-btn" onClick={() => setEditStore(s.id)} aria-label={`Editar ${s.name}`}>
                            <Pencil />
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {c.items.map((it, row) => {
                  const stat = r.itemStats[it.id];
                  return (
                    <tr key={it.id}>
                      <td className="sticky item-cell edit">
                        <div className="cell-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <input
                              className="cell-in name"
                              value={it.name}
                              placeholder="Nome do item"
                              list="item-names"
                              data-item-name={it.id}
                              data-nav={`${row}:name`}
                              onKeyDown={(e) => onKey(e, row, "name")}
                              onChange={(e) => onPickName(it.id, e.target.value)}
                            />
                            <input
                              className="cell-in unit"
                              value={it.unit}
                              placeholder="unidade"
                              onChange={(e) => setItem(it.id, { unit: e.target.value })}
                              aria-label="Unidade"
                            />
                          </div>
                          <button className="icon-btn danger" onClick={() => removeItem(it.id)} aria-label="Remover item">
                            <X />
                          </button>
                        </div>
                      </td>
                      <td className="edit">
                        <NumInput
                          className="cell-in qty"
                          money={false}
                          value={it.qty}
                          onChange={(v) => setItem(it.id, { qty: v ?? 0 })}
                          data-nav={`${row}:qty`}
                          onKeyDown={(e) => onKey(e, row, "qty")}
                          aria-label="Quantidade"
                        />
                      </td>
                      {c.stores.map((s) => {
                        const p = it.prices[s.id];
                        const has = p != null;
                        const cls =
                          has && stat.count > 1 && p === stat.min
                            ? "best"
                            : has && stat.count > 1 && p === stat.max && stat.max !== stat.min
                              ? "worst"
                              : "";
                        return (
                          <td key={s.id} className={"price-cell " + cls}>
                            <NumInput
                              className=""
                              value={p ?? null}
                              placeholder="—"
                              onChange={(v) => setPrice(it.id, s.id, v)}
                              data-nav={`${row}:${s.id}`}
                              onKeyDown={(e) => onKey(e, row, s.id)}
                              aria-label={`Preço em ${s.name}`}
                            />
                            <span className="sub">{has ? "= " + num(p * (it.qty || 0)) : "sem cotação"}</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sticky lbl">Subtotal</td>
                  <td />
                  {c.stores.map((s) => (
                    <td key={s.id} className="num">{num(r.byStore[s.id].subtotal)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="sticky lbl">Frete</td>
                  <td />
                  {c.stores.map((s) => (
                    <td key={s.id}>
                      <NumInput className="frete-in" value={s.frete} onChange={(v) => setStore(s.id, { frete: v ?? 0 })} aria-label={`Frete ${s.name}`} />
                    </td>
                  ))}
                </tr>
                <tr className="total">
                  <td className="sticky lbl">Total</td>
                  <td />
                  {c.stores.map((s) => (
                    <td key={s.id} className={"num " + (best?.storeId === s.id && !bestIsCombo ? "win" : "")}>
                      {r.byStore[s.id].quoted ? num(r.byStore[s.id].total) : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="sticky lbl">Prazo / pagamento</td>
                  <td />
                  {c.stores.map((s) => (
                    <td key={s.id} className="txt">
                      <button className="link" style={{ fontWeight: 600, color: s.prazo || s.pagamento ? "var(--muted)" : "var(--dim)" }} onClick={() => setEditStore(s.id)}>
                        {[s.prazo, s.pagamento].filter(Boolean).join(" · ") || "+ adicionar"}
                      </button>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="add-row">
            <button className="btn btn-sm btn-dashed" onClick={() => addItem()}>
              <Plus /> Adicionar item
            </button>
            <button className="btn btn-sm btn-dashed" onClick={() => setAddStore(true)}>
              <Plus /> Adicionar loja
            </button>
          </div>
          <datalist id="item-names">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="summary">
          <div className="win-card">
            <div className="lbl">{bestIsCombo ? "Melhor opção: dividir a compra" : "Melhor loja única"}</div>
            {best ? (
              <>
                <div className="big num">{brl(bestIsCombo ? r.combo!.total : best.total)}</div>
                <div className="who">
                  {bestIsCombo
                    ? r.combo!.stores.map((p) => storeName(p.storeId)).join(" + ")
                    : storeName(best.storeId) + (best.missing ? ` (faltam ${best.missing} itens)` : "")}
                </div>
                <div className="save">
                  {r.worst && r.savings > 0 ? (
                    <>Economia de <b className="num">{brl(r.savings)}</b> em relação à opção mais cara ({storeName(r.worst.storeId)}).</>
                  ) : (
                    "Preencha os preços de mais lojas para ver a economia."
                  )}
                </div>
              </>
            ) : (
              <div className="save" style={{ borderTop: 0, marginTop: 8, paddingTop: 0 }}>Preencha os preços na planilha para ver o resultado.</div>
            )}
          </div>

          {r.combo && (
            <div className="card mini">
              <div className="lbl">{bestIsCombo ? "Plano de compra" : "Se dividir a compra entre lojas"}</div>
              <div className="big num">{brl(r.combo.total)}</div>
              <div className="s">
                {r.combo.stores.length === 1
                  ? "Considerando os fretes, comprar tudo numa loja só é o melhor caminho."
                  : best && !bestIsCombo
                    ? "Dividir não compensa por causa dos fretes."
                    : `Já com os fretes de ${r.combo.stores.length} lojas.`}
              </div>
              {r.combo.stores.length > 1 && (
                <div className="plan">
                  {r.combo.stores.map((p) => (
                    <div key={p.storeId} className="plan-row">
                      <div className="h">
                        <span>{storeName(p.storeId)}</span>
                        <span className="num">{brl(p.subtotal + p.frete)}</span>
                      </div>
                      <div className="d">
                        {p.itemIds.map((iid) => c.items.find((i) => i.id === iid)?.name || "item").join(", ")}
                        {p.frete ? ` · frete ${brl(p.frete)}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="card-head"><h2>Total por loja</h2></div>
            <div className="bars">
              {r.ranking.length === 0 && <div className="dim small">Sem preços ainda.</div>}
              {r.ranking.map((x) => (
                <div key={x.storeId} className={"bar " + (x.storeId === best?.storeId ? "best" : "")}>
                  <div className="top-l">
                    <span className="ellipsis">{storeName(x.storeId)}{x.missing ? ` (−${x.missing})` : ""}</span>
                    <span className="num">{brl(x.total)}</span>
                  </div>
                  <div className="track">
                    <div className="fill" style={{ width: `${((x.total / maxTotal) * 100).toFixed(1)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card pad">
            <Field label="Categoria">
              <input value={c.category || ""} placeholder="Ex.: Reforma, Mercado…" onChange={(e) => up((x) => ({ ...x, category: e.target.value }))} />
            </Field>
            <Field label="Anotações">
              <textarea value={c.notes} placeholder="Condições, contatos, observações…" onChange={(e) => up((x) => ({ ...x, notes: e.target.value }))} />
            </Field>
          </div>
        </div>
      </div>

      <PrintComparison c={c} />

      {editStore && (
        <StoreModal
          store={c.stores.find((s) => s.id === editStore)!}
          onSave={(p) => setStore(editStore, p)}
          onDelete={() => {
            if (!window.confirm("Remover esta loja do comparativo? Os preços dela serão apagados.")) return;
            const sid = editStore;
            up((x) => ({
              ...x,
              stores: x.stores.filter((s) => s.id !== sid),
              items: x.items.map((i) => {
                const { [sid]: _, ...rest } = i.prices;
                return { ...i, prices: rest };
              }),
            }));
            setEditStore(null);
          }}
          onClose={() => setEditStore(null)}
        />
      )}
      {addStore && <AddStoreModal c={c} onAdd={(s) => up((x) => ({ ...x, stores: [...x.stores, s] }))} onClose={() => setAddStore(false)} />}
    </>
  );
}

/* ---------- Editar loja do comparativo ---------- */
function StoreModal({
  store,
  onSave,
  onDelete,
  onClose,
}: {
  store: CompareStore;
  onSave: (p: Partial<CompareStore>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [f, setF] = useState(store);
  return (
    <Modal
      title="Detalhes da loja"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-danger" onClick={onDelete} style={{ marginRight: "auto" }}>
            <Trash2 /> Remover
          </button>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onSave(f);
              onClose();
            }}
          >
            Salvar
          </button>
        </>
      }
    >
      <Field label="Nome da loja">
        <input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </Field>
      <div className="row-2">
        <Field label="Frete (R$)">
          <NumInput value={f.frete} onChange={(v) => setF({ ...f, frete: v ?? 0 })} />
        </Field>
        <Field label="Prazo de entrega">
          <input value={f.prazo || ""} placeholder="Ex.: 3 dias úteis" onChange={(e) => setF({ ...f, prazo: e.target.value })} />
        </Field>
      </div>
      <Field label="Forma de pagamento">
        <input value={f.pagamento || ""} placeholder="Ex.: 10x sem juros, Pix 5% off" onChange={(e) => setF({ ...f, pagamento: e.target.value })} />
      </Field>
      <Field label="Link / contato">
        <input value={f.link || ""} placeholder="Site, WhatsApp ou vendedor" onChange={(e) => setF({ ...f, link: e.target.value })} />
      </Field>
      <Field label="Observações">
        <textarea value={f.notes || ""} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </Field>
    </Modal>
  );
}

/* ---------- Adicionar loja ---------- */
function AddStoreModal({ c, onAdd, onClose }: { c: Comparison; onAdd: (s: CompareStore) => void; onClose: () => void }) {
  const stores = useApp((s) => s.stores);
  const upsert = useApp((s) => s.upsert);
  const [name, setName] = useState("");
  const [frete, setFrete] = useState<number | null>(0);
  const used = new Set(c.stores.map((s) => s.storeId).filter(Boolean));
  const available = stores.filter((s) => !used.has(s.id));

  const add = (storeId?: string, n?: string) => {
    const nm = (n ?? name).trim();
    if (!nm) return;
    let sid = storeId;
    if (!sid) {
      const existing = stores.find((s) => normalize(s.name) === normalize(nm));
      if (existing) sid = existing.id;
      else {
        sid = uid();
        upsert("stores", { id: sid, name: nm, createdAt: Date.now(), updatedAt: Date.now() });
      }
    }
    onAdd({ id: uid(), storeId: sid, name: nm, frete: frete ?? 0 });
    onClose();
  };

  return (
    <Modal
      title="Adicionar loja"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => add()} disabled={!name.trim()}>
            Adicionar
          </button>
        </>
      }
    >
      {available.length > 0 && (
        <div className="field">
          <label>Das suas lojas cadastradas</label>
          <div className="pick-list">
            {available.map((s) => (
              <button key={s.id} className="pick" onClick={() => add(s.id, s.name)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="row-2">
        <Field label={available.length ? "Ou uma nova loja" : "Nome da loja"} hint="Ela também fica salva em Lojas.">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Ex.: Loja do centro" />
        </Field>
        <Field label="Frete (R$)">
          <NumInput value={frete} onChange={setFrete} />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------- Relatório para impressão / PDF ---------- */
function PrintComparison({ c }: { c: Comparison }) {
  const company = useApp((s) => s.company);
  const r = analyze(c);
  const storeName = (sid: string) => c.stores.find((s) => s.id === sid)?.name || "";
  const bestIsCombo = r.bestOption === "combinacao" && r.combo;
  return (
    <div className="print-only">
      <div className="doc">
        <div className="doc-head">
          <div className="doc-co">
            <LogoMark />
            <div>
              <b>{company.name || "Comparativo de preços"}</b>
              <span>{[company.phone, company.email].filter(Boolean).join(" · ")}</span>
            </div>
          </div>
          <div className="doc-num">
            <div className="k">Comparativo de preços</div>
            <div className="v" style={{ fontSize: 18 }}>{c.title}</div>
            <div className="d">Gerado em {fmtDate(Date.now())} · {c.stores.length} lojas · {c.items.length} itens</div>
          </div>
        </div>
        <table style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th>Item</th>
              <th className="r">Qtd</th>
              {c.stores.map((s) => (
                <th key={s.id} className="r">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.items.map((it) => {
              const st = r.itemStats[it.id];
              return (
                <tr key={it.id}>
                  <td>{it.name}<div className="kind">{it.unit}</div></td>
                  <td className="r">{qty(it.qty)}</td>
                  {c.stores.map((s) => {
                    const p = it.prices[s.id];
                    return (
                      <td key={s.id} className={"r " + (p != null && st.count > 1 && p === st.min ? "bestc" : "")}>
                        {p == null ? "—" : num(p)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {(
              [
                ["Subtotal", (s: CompareStore) => num(r.byStore[s.id].subtotal)],
                ["Frete", (s: CompareStore) => num(s.frete)],
                ["Total", (s: CompareStore) => (r.byStore[s.id].quoted ? num(r.byStore[s.id].total) : "—")],
                ["Prazo", (s: CompareStore) => s.prazo || "—"],
                ["Pagamento", (s: CompareStore) => s.pagamento || "—"],
              ] as const
            ).map(([label, fn]) => (
              <tr key={label}>
                <td><b>{label}</b></td>
                <td />
                {c.stores.map((s) => (
                  <td key={s.id} className={"r " + (label === "Total" && r.best?.storeId === s.id && !bestIsCombo ? "winc" : "")}>{fn(s)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="doc-notes">
          <div>
            <div className="k">Resultado</div>
            <div className="v">
              {r.best ? (
                bestIsCombo ? (
                  <>
                    <b>Melhor opção: dividir a compra — {brl(r.combo!.total)}</b>
                    {r.combo!.stores.map((p) => (
                      <Fragment key={p.storeId}>
                        <br />• {storeName(p.storeId)}: {p.itemIds.map((iid) => c.items.find((i) => i.id === iid)?.name).join(", ")} ({brl(p.subtotal + p.frete)})
                      </Fragment>
                    ))}
                  </>
                ) : (
                  <b>Melhor loja: {storeName(r.best.storeId)} — {brl(r.best.total)}</b>
                )
              ) : (
                "Sem preços preenchidos."
              )}
              {r.savings > 0 && (
                <>
                  <br />
                  Economia de {brl(r.savings)} em relação à opção mais cara.
                </>
              )}
            </div>
          </div>
          {c.notes && (
            <div>
              <div className="k">Anotações</div>
              <div className="v">{c.notes}</div>
            </div>
          )}
        </div>
        <div className="doc-foot">
          <span>Menores preços por item destacados em amarelo.</span>
          <span><Trophy size={12} /> Orça+</span>
        </div>
      </div>
    </div>
  );
}
