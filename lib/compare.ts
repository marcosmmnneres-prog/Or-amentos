import type { Comparison, ID } from "./types";

export interface ItemStat {
  min: number | null;
  max: number | null;
  count: number;
}

export interface StoreRank {
  storeId: ID;
  subtotal: number;
  total: number;
  missing: number;
  quoted: number;
}

export interface ComboPlan {
  total: number;
  stores: { storeId: ID; itemIds: ID[]; subtotal: number; frete: number }[];
  uncovered: ID[]; // itens sem nenhuma cotação
}

export interface CompareResult {
  itemStats: Record<ID, ItemStat>;
  byStore: Record<ID, StoreRank>;
  ranking: StoreRank[];
  best: StoreRank | null;
  worst: StoreRank | null;
  combo: ComboPlan | null;
  /** quanto se economiza escolhendo a melhor opção vs. a pior loja completa */
  savings: number;
  bestOption: "loja" | "combinacao" | null;
}

const has = (v: number | null | undefined): v is number => v != null && !isNaN(v);

export function analyze(c: Comparison): CompareResult {
  const itemStats: Record<ID, ItemStat> = {};
  const byStore: Record<ID, StoreRank> = {};
  c.stores.forEach((s) => (byStore[s.id] = { storeId: s.id, subtotal: 0, total: 0, missing: 0, quoted: 0 }));

  for (const it of c.items) {
    const vals = c.stores.map((s) => it.prices[s.id]).filter(has);
    itemStats[it.id] = {
      min: vals.length ? Math.min(...vals) : null,
      max: vals.length ? Math.max(...vals) : null,
      count: vals.length,
    };
    for (const s of c.stores) {
      const p = it.prices[s.id];
      if (has(p)) {
        byStore[s.id].subtotal += p * (it.qty || 0);
        byStore[s.id].quoted++;
      } else if (vals.length) {
        byStore[s.id].missing++;
      }
    }
  }
  c.stores.forEach((s) => {
    const r = byStore[s.id];
    r.total = r.quoted ? r.subtotal + (s.frete || 0) : 0;
  });

  const ranking = Object.values(byStore)
    .filter((r) => r.quoted > 0)
    .sort((a, b) => a.missing - b.missing || a.total - b.total);
  const best = ranking[0] ?? null;
  const sameCoverage = best ? ranking.filter((r) => r.missing === best.missing) : [];
  const worst = sameCoverage.length > 1 ? sameCoverage[sameCoverage.length - 1] : null;

  const combo = bestCombination(c);

  let bestOption: CompareResult["bestOption"] = best ? "loja" : null;
  let bestValue = best?.total ?? 0;
  if (combo && best && combo.stores.length > 1) {
    // combinação cobre tudo; a loja única pode não cobrir
    if (best.missing > 0 || combo.total < best.total - 0.004) {
      bestOption = "combinacao";
      bestValue = combo.total;
    }
  }
  const savings = worst ? Math.max(0, worst.total - bestValue) : 0;

  return { itemStats, byStore, ranking, best, worst, combo, savings, bestOption };
}

/**
 * Encontra o conjunto de lojas que minimiza (soma dos itens + fretes),
 * cobrindo todos os itens que têm alguma cotação. Testa todas as combinações
 * de lojas (até 14 lojas); acima disso usa a escolha item a item.
 */
export function bestCombination(c: Comparison): ComboPlan | null {
  const stores = c.stores;
  const items = c.items.filter((it) => stores.some((s) => has(it.prices[s.id])));
  const uncovered = c.items.filter((it) => !items.includes(it)).map((i) => i.id);
  if (!items.length || !stores.length) return null;

  const evalSubset = (mask: number) => {
    let total = 0;
    const assign: Record<ID, ID[]> = {};
    const subt: Record<ID, number> = {};
    for (const it of items) {
      let bestP = Infinity;
      let bestS: ID | null = null;
      stores.forEach((s, i) => {
        if (!(mask & (1 << i))) return;
        const p = it.prices[s.id];
        if (has(p) && p < bestP) {
          bestP = p;
          bestS = s.id;
        }
      });
      if (bestS == null) return null;
      const line = bestP * (it.qty || 0);
      total += line;
      (assign[bestS] ||= []).push(it.id);
      subt[bestS] = (subt[bestS] || 0) + line;
    }
    const used = stores.filter((s) => assign[s.id]);
    used.forEach((s) => (total += s.frete || 0));
    return {
      total,
      stores: used.map((s) => ({ storeId: s.id, itemIds: assign[s.id], subtotal: subt[s.id], frete: s.frete || 0 })),
      uncovered,
    };
  };

  if (stores.length <= 14) {
    let best: ComboPlan | null = null;
    for (let mask = 1; mask < 1 << stores.length; mask++) {
      const r = evalSubset(mask);
      if (r && (!best || r.total < best.total - 0.004 || (Math.abs(r.total - best.total) < 0.005 && r.stores.length < best.stores.length)))
        best = r;
    }
    return best;
  }
  return evalSubset((1 << stores.length) - 1);
}
