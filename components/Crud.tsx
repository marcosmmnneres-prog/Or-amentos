"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast, useApp } from "@/lib/store";
import type { DataState } from "@/lib/types";
import { normalize, uid } from "@/lib/format";
import { Empty, Field, Modal, NumInput, PageHead, confirmDelete } from "./ui";

type Key = "stores" | "clients" | "catalog";
type Rec = DataState[Key][number] & Record<string, unknown>;

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "money" | "textarea" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  half?: boolean;
  inputMode?: "tel" | "email" | "url" | "text";
}

export interface ColDef {
  label: string;
  render: (r: Rec) => ReactNode;
  className?: string;
}

export default function CrudPage({
  collection,
  title,
  crumb,
  singular,
  fields,
  cols,
  emptyIcon,
  emptyText,
  defaults,
  extra,
  headerExtra,
}: {
  collection: Key;
  title: string;
  crumb: string;
  singular: string;
  fields: FieldDef[];
  cols: ColDef[];
  emptyIcon: ReactNode;
  emptyText: string;
  defaults?: Record<string, unknown>;
  extra?: (r: Rec) => ReactNode;
  headerExtra?: ReactNode;
}) {
  const list = useApp((s) => s[collection]) as Rec[];
  const upsert = useApp((s) => s.upsert);
  const remove = useApp((s) => s.remove);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Rec | null>(null);

  const rows = useMemo(() => {
    const nq = normalize(q);
    return [...list]
      .filter((r) => !nq || normalize(Object.values(r).filter((v) => typeof v === "string").join(" ")).includes(nq))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));
  }, [list, q]);

  const openNew = () => setEdit({ id: "", name: "", createdAt: 0, updatedAt: 0, ...defaults } as Rec);

  const save = () => {
    if (!edit || !String(edit.name || "").trim()) return;
    const rec = { ...edit, id: edit.id || uid(), name: String(edit.name).trim() };
    upsert(collection, rec as never);
    toast(edit.id ? "Alterações salvas" : `${singular} cadastrado(a)`);
    setEdit(null);
  };

  return (
    <>
      <PageHead crumb={crumb} title={title}>
        {headerExtra}
        <button className="btn btn-primary" onClick={openNew}>
          <Plus /> Novo
        </button>
      </PageHead>
      <div className="toolbar">
        <label className="search">
          <Search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" />
        </label>
        <span className="muted small">{list.length} cadastrado(s)</span>
      </div>
      <div className="card">
        {!rows.length ? (
          <Empty icon={emptyIcon} title={list.length ? "Nada encontrado" : `Nenhum(a) ${singular.toLowerCase()} ainda`} text={list.length ? undefined : emptyText}>
            {!list.length && (
              <button className="btn btn-primary" onClick={openNew}>
                <Plus /> Cadastrar
              </button>
            )}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c.label} className={c.className}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="click" onClick={() => setEdit({ ...r })}>
                    {cols.map((c) => (
                      <td key={c.label} className={c.className}>{c.render(r)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {edit && (
        <Modal
          title={edit.id ? `Editar ${singular.toLowerCase()}` : `Novo(a) ${singular.toLowerCase()}`}
          onClose={() => setEdit(null)}
          footer={
            <>
              {edit.id && (
                <button
                  className="btn btn-danger"
                  style={{ marginRight: "auto" }}
                  onClick={() => {
                    if (confirmDelete(String(edit.name))) {
                      remove(collection, edit.id);
                      setEdit(null);
                    }
                  }}
                >
                  <Trash2 /> Excluir
                </button>
              )}
              <button className="btn" onClick={() => setEdit(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={!String(edit.name || "").trim()}>
                Salvar
              </button>
            </>
          }
        >
          <div className="row-2">
            {fields.map((f, i) => {
              const val = edit[f.key];
              const set = (v: unknown) => setEdit({ ...edit, [f.key]: v });
              return (
                <Field key={f.key} label={f.label} className="" >
                  {f.type === "money" ? (
                    <NumInput value={(val as number) ?? null} onChange={set} placeholder={f.placeholder} />
                  ) : f.type === "textarea" ? (
                    <textarea value={(val as string) || ""} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} />
                  ) : f.type === "select" ? (
                    <select value={(val as string) || ""} onChange={(e) => set(e.target.value)}>
                      {f.options!.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      autoFocus={i === 0}
                      value={(val as string) || ""}
                      inputMode={f.inputMode}
                      onChange={(e) => set(e.target.value)}
                      placeholder={f.placeholder}
                      onKeyDown={(e) => e.key === "Enter" && save()}
                    />
                  )}
                </Field>
              );
            }).map((el, i) => (
              <div key={i} style={{ gridColumn: fields[i].half ? undefined : "1 / -1" }}>{el}</div>
            ))}
          </div>
          {edit.id && extra?.(edit)}
        </Modal>
      )}
    </>
  );
}
