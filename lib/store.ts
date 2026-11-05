"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CollectionKey,
  Company,
  Comparison,
  DataState,
  Quote,
  Template,
} from "./types";
import { todayISO, uid } from "./format";
import { freshComparisonFrom, freshQuoteItems, sampleData } from "./templates";

export const defaultCompany = (): Company => ({
  name: "",
  doc: "",
  phone: "",
  email: "",
  address: "",
  pix: "",
  defaultValidityDays: 15,
  defaultPayment: "Pix, dinheiro ou cartão",
  defaultNotes: "",
  nextQuoteNumber: 1,
  updatedAt: 0,
});

type Rec<K extends CollectionKey> = DataState[K][number];

interface Actions {
  setCompany: (patch: Partial<Company>) => void;
  upsert: <K extends CollectionKey>(key: K, rec: Rec<K>) => void;
  patch: <K extends CollectionKey>(key: K, id: string, patch: Partial<Rec<K>> | ((r: Rec<K>) => Rec<K>)) => void;
  remove: (key: CollectionKey, id: string) => void;

  newComparison: (t?: Template) => string;
  newQuote: (t?: Template) => string;
  duplicateComparison: (id: string) => string | null;
  duplicateQuote: (id: string) => string | null;
  saveAsTemplate: (kind: "comparativo" | "orcamento", id: string, name: string) => void;

  loadSample: () => { comparisonId: string; quoteId: string };
  replaceAll: (data: Partial<DataState>) => void;
  /** usado pela sincronização: aplica registros vindos da nuvem sem gerar novo envio */
  applyRemote: (data: Partial<DataState>) => void;
}

export type AppState = DataState & Actions;

const emptyData = (): DataState => ({
  company: defaultCompany(),
  stores: [],
  clients: [],
  catalog: [],
  comparisons: [],
  quotes: [],
  templates: [],
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...emptyData(),

      setCompany: (patch) => set((s) => ({ company: { ...s.company, ...patch, updatedAt: Date.now() } })),

      upsert: (key, rec) =>
        set((s) => {
          const list = s[key] as Rec<typeof key>[];
          const now = Date.now();
          const r = { ...rec, updatedAt: now, createdAt: rec.createdAt || now };
          const exists = list.some((x) => x.id === rec.id);
          return { [key]: exists ? list.map((x) => (x.id === rec.id ? r : x)) : [r, ...list] } as Partial<DataState>;
        }),

      patch: (key, id, p) =>
        set((s) => {
          const list = s[key] as Rec<typeof key>[];
          return {
            [key]: list.map((x) => {
              if (x.id !== id) return x;
              const next = typeof p === "function" ? p(x as never) : { ...x, ...p };
              return { ...next, updatedAt: Date.now() };
            }),
          } as Partial<DataState>;
        }),

      remove: (key, id) =>
        set((s) => ({ [key]: (s[key] as { id: string }[]).filter((x) => x.id !== id) }) as Partial<DataState>),

      newComparison: (t) => {
        const now = Date.now();
        const base = t?.comparison
          ? freshComparisonFrom(t.comparison)
          : {
              title: "Novo comparativo",
              category: "",
              notes: "",
              stores: [
                { id: uid(), name: "Loja 1", frete: 0 },
                { id: uid(), name: "Loja 2", frete: 0 },
                { id: uid(), name: "Loja 3", frete: 0 },
              ],
              items: [{ id: uid(), name: "", unit: "un", qty: 1, prices: {} }],
            };
        const c: Comparison = { id: uid(), status: "aberto", createdAt: now, updatedAt: now, ...base };
        set((s) => ({ comparisons: [c, ...s.comparisons] }));
        return c.id;
      },

      newQuote: (t) => {
        const now = Date.now();
        const { company } = get();
        const q: Quote = {
          id: uid(),
          number: company.nextQuoteNumber || 1,
          title: t?.quote?.title || "Novo orçamento",
          client: { name: "" },
          items: t?.quote ? freshQuoteItems(t.quote.items) : [{ id: uid(), desc: "", kind: "servico", qty: 1, unit: "un", price: 0 }],
          discountType: "pct",
          discount: 0,
          taxPct: 0,
          extra: 0,
          extraLabel: t?.quote?.extraLabel || "Frete / deslocamento",
          issueDate: todayISO(),
          validityDays: company.defaultValidityDays || 15,
          payment: t?.quote?.payment || company.defaultPayment || "",
          notes: t?.quote?.notes || company.defaultNotes || "",
          status: "rascunho",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          quotes: [q, ...s.quotes],
          company: { ...s.company, nextQuoteNumber: q.number + 1, updatedAt: now },
        }));
        return q.id;
      },

      duplicateComparison: (id) => {
        const src = get().comparisons.find((c) => c.id === id);
        if (!src) return null;
        const now = Date.now();
        const c: Comparison = {
          ...src,
          ...freshComparisonFrom(src),
          id: uid(),
          title: src.title + " (cópia)",
          status: "aberto",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ comparisons: [c, ...s.comparisons] }));
        return c.id;
      },

      duplicateQuote: (id) => {
        const src = get().quotes.find((q) => q.id === id);
        if (!src) return null;
        const now = Date.now();
        const number = get().company.nextQuoteNumber || 1;
        const q: Quote = {
          ...src,
          id: uid(),
          number,
          title: src.title + " (cópia)",
          items: freshQuoteItems(src.items),
          status: "rascunho",
          issueDate: todayISO(),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          quotes: [q, ...s.quotes],
          company: { ...s.company, nextQuoteNumber: number + 1, updatedAt: now },
        }));
        return q.id;
      },

      saveAsTemplate: (kind, id, name) => {
        const now = Date.now();
        let t: Template | null = null;
        if (kind === "comparativo") {
          const c = get().comparisons.find((x) => x.id === id);
          if (!c) return;
          t = {
            id: uid(),
            kind,
            name,
            description: `${c.items.length} itens · ${c.stores.length} lojas`,
            createdAt: now,
            updatedAt: now,
            comparison: {
              title: c.title,
              category: c.category,
              notes: c.notes,
              stores: c.stores.map((s) => ({ ...s })),
              items: c.items.map((i) => ({ ...i, prices: {} })),
            },
          };
        } else {
          const q = get().quotes.find((x) => x.id === id);
          if (!q) return;
          t = {
            id: uid(),
            kind,
            name,
            description: `${q.items.length} itens`,
            createdAt: now,
            updatedAt: now,
            quote: { title: q.title, items: q.items, notes: q.notes, payment: q.payment, extraLabel: q.extraLabel },
          };
        }
        set((s) => ({ templates: [t!, ...s.templates] }));
      },

      loadSample: () => {
        const { comparison, quote } = sampleData(get().company.nextQuoteNumber || 1);
        set((s) => ({
          comparisons: [comparison, ...s.comparisons],
          quotes: [quote, ...s.quotes],
          company: { ...s.company, nextQuoteNumber: quote.number + 1, updatedAt: Date.now() },
        }));
        return { comparisonId: comparison.id, quoteId: quote.id };
      },

      replaceAll: (data) => set(() => ({ ...emptyData(), ...data })),
      applyRemote: (data) => set(() => data),
    }),
    {
      name: "orcamais-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        company: s.company,
        stores: s.stores,
        clients: s.clients,
        catalog: s.catalog,
        comparisons: s.comparisons,
        quotes: s.quotes,
        templates: s.templates,
      }),
    }
  )
);

export const COLLECTIONS: CollectionKey[] = ["stores", "clients", "catalog", "comparisons", "quotes", "templates"];

/* ---------- Toasts (não persistidos) ---------- */
interface Toast {
  id: string;
  text: string;
  tone?: "ok" | "err";
}
export const useToasts = create<{ list: Toast[]; push: (text: string, tone?: Toast["tone"]) => void }>((set) => ({
  list: [],
  push: (text, tone = "ok") => {
    const id = uid();
    set((s) => ({ list: [...s.list, { id, text, tone }] }));
    setTimeout(() => set((s) => ({ list: s.list.filter((t) => t.id !== id) })), 2800);
  },
}));
export const toast = (text: string, tone?: "ok" | "err") => useToasts.getState().push(text, tone);
