import type { CompareItem, CompareStore, Comparison, Quote, QuoteItem, Template } from "./types";
import { todayISO, uid } from "./format";

type TItem = [name: string, unit: string, qty: number];
type QItem = [desc: string, kind: "produto" | "servico", qty: number, unit: string, price: number];

const ci = (list: TItem[]): CompareItem[] =>
  list.map(([name, unit, qty]) => ({ id: uid(), name, unit, qty, prices: {} }));
const qi = (list: QItem[]): QuoteItem[] =>
  list.map(([desc, kind, qty, unit, price]) => ({ id: uid(), desc, kind, qty, unit, price }));
const cs = (names: string[]): CompareStore[] => names.map((name) => ({ id: uid(), name, frete: 0 }));

const T0 = 0;

export const builtInTemplates: Template[] = [
  {
    id: "bt-reforma",
    builtIn: true,
    kind: "comparativo",
    name: "Reforma de banheiro",
    description: "Pisos, argamassa, louças e metais",
    createdAt: T0,
    updatedAt: T0,
    comparison: {
      title: "Reforma do banheiro",
      category: "Reforma",
      notes: "",
      stores: cs(["Loja 1", "Loja 2", "Loja 3"]),
      items: ci([
        ["Porcelanato 60x60", "m²", 12],
        ["Argamassa AC-III 20kg", "saco", 10],
        ["Rejunte flexível 1kg", "kg", 5],
        ["Vaso sanitário c/ caixa acoplada", "un", 1],
        ["Torneira monocomando", "un", 1],
        ["Box de vidro temperado", "un", 1],
        ["Kit acabamento de registro", "un", 2],
      ]),
    },
  },
  {
    id: "bt-mercado",
    builtIn: true,
    kind: "comparativo",
    name: "Compras do mês",
    description: "Lista básica de supermercado",
    createdAt: T0,
    updatedAt: T0,
    comparison: {
      title: "Compras do mês",
      category: "Mercado",
      notes: "",
      stores: cs(["Mercado 1", "Mercado 2", "Atacadão"]),
      items: ci([
        ["Arroz tipo 1 5kg", "pct", 2],
        ["Feijão carioca 1kg", "pct", 4],
        ["Óleo de soja 900ml", "un", 3],
        ["Café 500g", "pct", 2],
        ["Açúcar 5kg", "pct", 1],
        ["Leite integral 1L", "cx", 12],
        ["Papel higiênico 12 rolos", "pct", 1],
        ["Sabão em pó 1,6kg", "cx", 1],
      ]),
    },
  },
  {
    id: "bt-evento",
    builtIn: true,
    kind: "comparativo",
    name: "Festa / evento",
    description: "Buffet, decoração, bebidas e espaço",
    createdAt: T0,
    updatedAt: T0,
    comparison: {
      title: "Festa de aniversário",
      category: "Evento",
      notes: "",
      stores: cs(["Fornecedor 1", "Fornecedor 2", "Fornecedor 3"]),
      items: ci([
        ["Aluguel do espaço", "diária", 1],
        ["Buffet por pessoa", "pessoa", 50],
        ["Bolo", "kg", 4],
        ["Docinhos", "cento", 3],
        ["Refrigerante 2L", "un", 20],
        ["Decoração", "pacote", 1],
      ]),
    },
  },
  {
    id: "bt-eletronico",
    builtIn: true,
    kind: "comparativo",
    name: "Eletrônicos / escritório",
    description: "Notebook, monitor e periféricos",
    createdAt: T0,
    updatedAt: T0,
    comparison: {
      title: "Equipamentos do escritório",
      category: "Tecnologia",
      notes: "",
      stores: cs(["Loja online 1", "Loja online 2", "Loja física"]),
      items: ci([
        ["Notebook i5 16GB SSD 512GB", "un", 1],
        ['Monitor 24" Full HD', "un", 1],
        ["Mouse sem fio", "un", 1],
        ["Teclado sem fio", "un", 1],
        ["Suporte para notebook", "un", 1],
      ]),
    },
  },
  {
    id: "bt-eletrica",
    builtIn: true,
    kind: "orcamento",
    name: "Serviço elétrico",
    description: "Pontos, fiação, disjuntores e mão de obra",
    createdAt: T0,
    updatedAt: T0,
    quote: {
      title: "Instalação elétrica",
      payment: "Pix ou cartão em até 3x",
      extraLabel: "Deslocamento",
      notes: "Garantia de 90 dias sobre o serviço executado.",
      items: qi([
        ["Instalação de ponto de tomada", "servico", 1, "ponto", 45],
        ["Troca de disjuntor", "servico", 1, "un", 38],
        ["Fio flexível 4mm²", "produto", 1, "m", 6.5],
        ["Visita técnica e testes", "servico", 1, "un", 150],
      ]),
    },
  },
  {
    id: "bt-pintura",
    builtIn: true,
    kind: "orcamento",
    name: "Pintura residencial",
    description: "Preparação, tinta e mão de obra por m²",
    createdAt: T0,
    updatedAt: T0,
    quote: {
      title: "Pintura residencial",
      payment: "50% na entrada e 50% na entrega",
      extraLabel: "Deslocamento",
      notes: "Prazo estimado de execução: 5 dias úteis.",
      items: qi([
        ["Lixamento e preparação de paredes", "servico", 1, "m²", 8],
        ["Massa corrida / correções", "servico", 1, "m²", 10],
        ["Pintura (2 demãos)", "servico", 1, "m²", 18],
        ["Tinta acrílica premium 18L", "produto", 1, "lata", 420],
        ["Material de proteção e limpeza", "produto", 1, "kit", 80],
      ]),
    },
  },
  {
    id: "bt-manutencao",
    builtIn: true,
    kind: "orcamento",
    name: "Manutenção técnica",
    description: "Visita, diagnóstico, peças e serviço",
    createdAt: T0,
    updatedAt: T0,
    quote: {
      title: "Manutenção preventiva",
      payment: "Pix, dinheiro ou cartão",
      extraLabel: "Deslocamento",
      notes: "Peças com garantia do fabricante.",
      items: qi([
        ["Visita técnica e diagnóstico", "servico", 1, "un", 120],
        ["Limpeza e higienização", "servico", 1, "un", 180],
        ["Peça de reposição", "produto", 1, "un", 0],
      ]),
    },
  },
  {
    id: "bt-evento-orc",
    builtIn: true,
    kind: "orcamento",
    name: "Buffet / evento",
    description: "Orçamento por pessoa para eventos",
    createdAt: T0,
    updatedAt: T0,
    quote: {
      title: "Buffet para evento",
      payment: "30% de sinal para reservar a data",
      extraLabel: "Taxa de transporte",
      notes: "Valores válidos para a data e quantidade de convidados informadas.",
      items: qi([
        ["Buffet completo por pessoa", "servico", 50, "pessoa", 65],
        ["Garçom (4 horas)", "servico", 2, "profissional", 180],
        ["Bebidas não alcoólicas", "produto", 50, "pessoa", 12],
      ]),
    },
  },
];

/** Gera cópias com IDs novos (para não compartilhar IDs entre documentos). */
export function freshComparisonFrom(t: Template["comparison"]): Pick<Comparison, "title" | "category" | "items" | "stores" | "notes"> {
  const src = t!;
  const map: Record<string, string> = {};
  const stores = src.stores.map((s) => {
    const id = uid();
    map[s.id] = id;
    return { ...s, id };
  });
  const items = src.items.map((it) => {
    const prices: Record<string, number | null> = {};
    Object.entries(it.prices || {}).forEach(([k, v]) => map[k] && (prices[map[k]] = v));
    return { ...it, id: uid(), prices };
  });
  return { title: src.title, category: src.category, notes: src.notes, stores, items };
}

export function freshQuoteItems(items: QuoteItem[]): QuoteItem[] {
  return items.map((i) => ({ ...i, id: uid() }));
}

/* ---------- Dados de exemplo ---------- */
export function sampleData(nextNumber: number) {
  const now = Date.now();
  const st = ["Casa & Obra", "Depósito Central", "MaxConstrução", "Loja do Bairro"].map((name, i) => ({
    id: uid(),
    name,
    frete: [45, 0, 79.9, 25][i],
    prazo: ["3 dias", "Retirar hoje", "7 dias", "2 dias"][i],
    pagamento: ["10x sem juros", "Pix 5% off", "12x", "À vista"][i],
  }));
  const P: [string, string, number, (number | null)[]][] = [
    ["Porcelanato 60x60 acetinado", "m²", 12, [69.9, 64.5, 59.9, 72]],
    ["Argamassa AC-III 20kg", "saco", 10, [38.9, 34.9, 36.5, 41]],
    ["Rejunte flexível 1kg", "kg", 5, [18.5, 16.9, 19.9, 15.5]],
    ["Vaso sanitário c/ caixa acoplada", "un", 1, [589, 549, 612, null]],
    ["Torneira monocomando", "un", 2, [219.9, 239, 199.9, 229]],
    ["Box de vidro temperado 8mm", "un", 1, [890, 820, null, 780]],
    ["Kit acabamento registro", "un", 2, [89.9, 79.9, 84.5, 92]],
  ];
  const comparison: Comparison = {
    id: uid(),
    title: "Reforma do banheiro (exemplo)",
    category: "Reforma",
    status: "aberto",
    notes: "Depósito Central dá 5% no Pix.",
    stores: st,
    items: P.map(([name, unit, q, prices]) => ({
      id: uid(),
      name,
      unit,
      qty: q,
      prices: Object.fromEntries(st.map((s, i) => [s.id, prices[i]])),
    })),
    createdAt: now - 86400000,
    updatedAt: now - 3600000,
  };
  const quote: Quote = {
    id: uid(),
    number: nextNumber,
    title: "Instalação elétrica (exemplo)",
    client: { name: "Ana Paula Ribeiro", phone: "(11) 98888-7777", address: "Rua das Flores, 120 – São Paulo/SP" },
    items: qi([
      ["Ponto de tomada 20A (instalação)", "servico", 8, "ponto", 45],
      ["Troca de disjuntores no quadro", "servico", 6, "un", 38],
      ["Fio flexível 4mm²", "produto", 40, "m", 6.5],
      ["Instalação de chuveiro elétrico", "servico", 1, "un", 120],
      ["Visita técnica e testes", "servico", 1, "un", 350],
    ]),
    discountType: "pct",
    discount: 5,
    taxPct: 0,
    extra: 0,
    extraLabel: "Deslocamento",
    issueDate: todayISO(),
    validityDays: 15,
    payment: "Pix ou cartão em até 3x",
    notes: "Material incluso. Garantia de 90 dias sobre o serviço.",
    status: "enviado",
    createdAt: now - 7200000,
    updatedAt: now - 7200000,
  };
  return { comparison, quote };
}
