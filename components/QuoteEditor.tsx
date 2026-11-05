"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  LayoutTemplate,
  MessageCircle,
  Plus,
  Share2,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast, useApp } from "@/lib/store";
import type { Quote, QuoteItem, QuoteStatus } from "@/lib/types";
import { quoteStatusLabel, quoteTotals, quoteValidity } from "@/lib/quote";
import { brl, normalize, quoteCode, uid } from "@/lib/format";
import { openWhatsApp, quoteCSV, quoteText, shareText } from "@/lib/export";
import { DropMenu, Empty, Field, NumInput, confirmDelete } from "./ui";
import QuoteDoc from "./QuoteDoc";

export default function QuoteEditor({ id }: { id: string }) {
  const router = useRouter();
  const q = useApp((s) => s.quotes.find((x) => x.id === id));
  const company = useApp((s) => s.company);
  const clients = useApp((s) => s.clients);
  const catalog = useApp((s) => s.catalog);
  const allQuotes = useApp((s) => s.quotes);
  const patch = useApp((s) => s.patch);
  const upsert = useApp((s) => s.upsert);
  const remove = useApp((s) => s.remove);
  const duplicate = useApp((s) => s.duplicateQuote);
  const saveAsTemplate = useApp((s) => s.saveAsTemplate);
  const [tab, setTab] = useState<"editar" | "previa">("editar");

  const suggestions = useMemo(() => {
    const m = new Map<string, string>();
    catalog.forEach((i) => m.set(normalize(i.name), i.name));
    allQuotes.forEach((x) => x.items.forEach((i) => i.desc && m.set(normalize(i.desc), i.desc)));
    return [...m.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [catalog, allQuotes]);

  if (!q)
    return (
      <Empty icon={<FileText />} title="Orçamento não encontrado" text="Ele pode ter sido excluído.">
        <Link href="/orcamentos" className="btn">Voltar para orçamentos</Link>
      </Empty>
    );

  const t = quoteTotals(q);
  const v = quoteValidity(q);
  const up = (p: Partial<Quote>) => patch("quotes", id, p);
  const setItem = (iid: string, p: Partial<QuoteItem>) => up({ items: q.items.map((i) => (i.id === iid ? { ...i, ...p } : i)) });
  const addItem = () => {
    const nid = uid();
    up({ items: [...q.items, { id: nid, desc: "", kind: "servico", qty: 1, unit: "un", price: 0 }] });
    setTimeout(() => document.querySelector<HTMLInputElement>(`[data-desc="${nid}"]`)?.focus(), 30);
  };
  const onDesc = (it: QuoteItem, desc: string) => {
    const cat = catalog.find((c) => normalize(c.name) === normalize(desc));
    if (cat) setItem(it.id, { desc, unit: cat.unit || it.unit, kind: cat.kind, price: it.price || cat.price || 0 });
    else setItem(it.id, { desc });
  };
  const setClientField = (k: keyof Quote["client"], val: string) => up({ client: { ...q.client, [k]: val } });

  const saveClient = () => {
    if (!q.client.name.trim()) return;
    const cid = uid();
    upsert("clients", { id: cid, ...q.client, createdAt: Date.now(), updatedAt: Date.now() });
    up({ clientId: cid });
    toast("Cliente salvo no cadastro");
  };

  const sendWhats = () => {
    openWhatsApp(quoteText(q, company), q.client.phone);
    if (q.status === "rascunho") up({ status: "enviado" });
  };

  return (
    <>
      <div className="top no-print">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="crumb">
            <Link href="/orcamentos">Orçamentos</Link>
            <ChevronRight size={12} />
            <span className="num">{quoteCode(q.number)}</span>
            {q.status === "enviado" && (v.expired || v.soon) && (
              <span className={v.expired ? "chip bad" : "chip sent"}>{v.expired ? "vencido" : `vence em ${v.left}d`}</span>
            )}
          </div>
          <input className="title-input" value={q.title} onChange={(e) => up({ title: e.target.value })} aria-label="Título" />
        </div>
        <div className="actions">
          <select className="input status-select" value={q.status} onChange={(e) => up({ status: e.target.value as QuoteStatus })} aria-label="Situação">
            {(Object.keys(quoteStatusLabel) as QuoteStatus[]).map((k) => (
              <option key={k} value={k}>{quoteStatusLabel[k]}</option>
            ))}
          </select>
          <button className="btn" onClick={sendWhats}>
            <MessageCircle /> WhatsApp
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Download /> Gerar PDF
          </button>
          <DropMenu
            items={[
              { label: "Exportar planilha (CSV/Excel)", icon: <FileSpreadsheet />, onClick: () => quoteCSV(q) },
              {
                label: "Compartilhar texto",
                icon: <Share2 />,
                onClick: async () => {
                  if (!(await shareText(q.title, quoteText(q, company)))) toast("Texto copiado para a área de transferência");
                },
              },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "Duplicar",
                icon: <Copy />,
                onClick: () => {
                  const nid = duplicate(q.id);
                  if (nid) {
                    toast("Orçamento duplicado");
                    router.push(`/orcamentos/${nid}`);
                  }
                },
              },
              {
                label: "Salvar como modelo",
                icon: <LayoutTemplate />,
                onClick: () => {
                  const name = window.prompt("Nome do modelo:", q.title);
                  if (name) {
                    saveAsTemplate("orcamento", q.id, name);
                    toast("Modelo salvo");
                  }
                },
              },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "Excluir orçamento",
                icon: <Trash2 />,
                danger: true,
                onClick: () => {
                  if (confirmDelete("este orçamento")) {
                    remove("quotes", q.id);
                    router.push("/orcamentos");
                  }
                },
              },
            ]}
          />
        </div>
      </div>

      <div className="seg no-print mobile-tabs" style={{ marginBottom: 14 }}>
        <button className={tab === "editar" ? "active" : ""} onClick={() => setTab("editar")}>Editar</button>
        <button className={tab === "previa" ? "active" : ""} onClick={() => setTab("previa")}>Prévia do PDF</button>
      </div>

      <div className="simple-layout">
        <div className={"stack no-print " + (tab === "previa" ? "tab-hidden" : "")}>
          {/* Cliente */}
          <div className="card pad">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <h2>Cliente</h2>
              {clients.length > 0 && (
                <select
                  className="input"
                  style={{ width: "auto", padding: "7px 34px 7px 12px", fontSize: 13 }}
                  value={q.clientId || ""}
                  onChange={(e) => {
                    const c = clients.find((x) => x.id === e.target.value);
                    if (c) up({ clientId: c.id, client: { name: c.name, doc: c.doc, phone: c.phone, email: c.email, address: c.address } });
                    else up({ clientId: undefined });
                  }}
                >
                  <option value="">Escolher cadastrado…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="row-2">
              <Field label="Nome">
                <input value={q.client.name} onChange={(e) => setClientField("name", e.target.value)} placeholder="Nome do cliente" />
              </Field>
              <Field label="CPF / CNPJ">
                <input value={q.client.doc || ""} onChange={(e) => setClientField("doc", e.target.value)} />
              </Field>
            </div>
            <div className="row-2">
              <Field label="Telefone / WhatsApp">
                <input value={q.client.phone || ""} inputMode="tel" onChange={(e) => setClientField("phone", e.target.value)} />
              </Field>
              <Field label="E-mail">
                <input value={q.client.email || ""} inputMode="email" onChange={(e) => setClientField("email", e.target.value)} />
              </Field>
            </div>
            <Field label="Endereço">
              <input value={q.client.address || ""} onChange={(e) => setClientField("address", e.target.value)} />
            </Field>
            {!q.clientId && q.client.name.trim() && (
              <button className="btn btn-sm" onClick={saveClient}>
                <UserPlus /> Salvar no cadastro de clientes
              </button>
            )}
          </div>

          {/* Itens */}
          <div className="card">
            <div className="card-head bordered">
              <h2>Itens</h2>
              <span className="small muted hide-m-inline">Clique em SERV/PROD para alternar o tipo</span>
            </div>
            <div style={{ padding: "6px 14px 14px", overflowX: "auto" }}>
              <table className="qitems">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th className="hide-m">Tipo</th>
                    <th className="r" style={{ width: 76 }}>Qtd</th>
                    <th className="hide-m" style={{ width: 70 }}>Un</th>
                    <th className="r" style={{ width: 110 }}>Unitário</th>
                    <th className="r" style={{ width: 100 }}>Total</th>
                    <th style={{ width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {q.items.map((it, k) => (
                    <tr key={it.id}>
                      <td style={{ minWidth: 170 }}>
                        <input className="input" list="quote-items" data-desc={it.id} value={it.desc} placeholder="Descrição do item ou serviço" onChange={(e) => onDesc(it, e.target.value)} />
                      </td>
                      <td className="hide-m">
                        <button className={"kind-btn " + it.kind} onClick={() => setItem(it.id, { kind: it.kind === "servico" ? "produto" : "servico" })}>
                          {it.kind === "servico" ? "SERV" : "PROD"}
                        </button>
                      </td>
                      <td>
                        <NumInput className="input r" money={false} value={it.qty} onChange={(n) => setItem(it.id, { qty: n ?? 0 })} />
                      </td>
                      <td className="hide-m">
                        <input className="input" value={it.unit} onChange={(e) => setItem(it.id, { unit: e.target.value })} />
                      </td>
                      <td>
                        <NumInput
                          className="input r"
                          value={it.price}
                          onChange={(n) => setItem(it.id, { price: n ?? 0 })}
                          onKeyDown={(e) => e.key === "Enter" && k === q.items.length - 1 && addItem()}
                        />
                      </td>
                      <td className="tot">{brl(t.lines[k])}</td>
                      <td>
                        <button className="icon-btn danger" onClick={() => up({ items: q.items.filter((x) => x.id !== it.id) })} aria-label="Remover">
                          <X />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="quote-items">
                {suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <button className="btn btn-sm btn-dashed" style={{ marginTop: 12 }} onClick={addItem}>
                <Plus /> Adicionar item
              </button>
            </div>
          </div>

          {/* Condições */}
          <div className="card pad">
            <h2 style={{ marginBottom: 14 }}>Condições e valores</h2>
            <div className="row-3">
              <Field label="Emissão">
                <input type="date" value={q.issueDate} onChange={(e) => up({ issueDate: e.target.value })} />
              </Field>
              <Field label="Validade (dias)">
                <NumInput money={false} value={q.validityDays} onChange={(n) => up({ validityDays: Math.max(0, Math.round(n ?? 0)) })} />
              </Field>
              <Field label="Impostos (%)">
                <NumInput money={false} value={q.taxPct} onChange={(n) => up({ taxPct: n ?? 0 })} />
              </Field>
            </div>
            <div className="row-2">
              <Field label="Desconto">
                <div className="row" style={{ gap: 6 }}>
                  <div className="seg">
                    <button className={q.discountType === "pct" ? "active" : ""} onClick={() => up({ discountType: "pct" })}>%</button>
                    <button className={q.discountType === "valor" ? "active" : ""} onClick={() => up({ discountType: "valor" })}>R$</button>
                  </div>
                  <NumInput value={q.discount} money={q.discountType === "valor"} onChange={(n) => up({ discount: n ?? 0 })} />
                </div>
              </Field>
              <Field label={q.extraLabel || "Adicional"}>
                <NumInput value={q.extra} onChange={(n) => up({ extra: n ?? 0 })} />
              </Field>
            </div>
            <div className="row-2">
              <Field label="Forma de pagamento">
                <input value={q.payment} onChange={(e) => up({ payment: e.target.value })} placeholder="Ex.: Pix ou 3x no cartão" />
              </Field>
              <Field label="Nome do adicional">
                <input value={q.extraLabel} onChange={(e) => up({ extraLabel: e.target.value })} placeholder="Frete, deslocamento…" />
              </Field>
            </div>
            <Field label="Observações">
              <textarea value={q.notes} onChange={(e) => up({ notes: e.target.value })} placeholder="Garantia, prazo de execução, o que está incluso…" />
            </Field>
            <div className="totals-box">
              <div className="l"><span>Subtotal</span><span className="num">{brl(t.subtotal)}</span></div>
              {t.discount > 0 && <div className="l"><span>Desconto</span><span className="num">− {brl(t.discount)}</span></div>}
              {t.tax > 0 && <div className="l"><span>Impostos</span><span className="num">{brl(t.tax)}</span></div>}
              {t.extra > 0 && <div className="l"><span>{q.extraLabel}</span><span className="num">{brl(t.extra)}</span></div>}
              <div className="g"><span>Total</span><span className="num">{brl(t.total)}</span></div>
            </div>
          </div>
        </div>

        <div className={"preview-col " + (tab === "editar" ? "tab-hidden-m" : "")}>
          <div className="lbl-sm no-print" style={{ marginBottom: 8 }}>Prévia do PDF</div>
          <QuoteDoc q={q} company={company} />
        </div>
      </div>
    </>
  );
}
