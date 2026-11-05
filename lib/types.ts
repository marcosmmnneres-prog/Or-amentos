export type ID = string;

export interface Company {
  name: string;
  doc: string; // CNPJ / CPF
  phone: string;
  email: string;
  address: string;
  logo?: string; // data URL (pequeno)
  pix?: string;
  defaultValidityDays: number;
  defaultPayment: string;
  defaultNotes: string;
  nextQuoteNumber: number;
  updatedAt: number;
}

interface Base {
  id: ID;
  createdAt: number;
  updatedAt: number;
}

export interface Store extends Base {
  name: string;
  phone?: string;
  site?: string;
  address?: string;
  notes?: string;
}

export interface Client extends Base {
  name: string;
  doc?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type ItemKind = "produto" | "servico";

export interface CatalogItem extends Base {
  name: string;
  unit: string;
  price?: number | null;
  category?: string;
  kind: ItemKind;
}

/* ---------- Comparativo ---------- */
export interface CompareStore {
  id: ID;
  storeId?: ID; // vínculo opcional com o cadastro
  name: string;
  frete: number;
  prazo?: string;
  pagamento?: string;
  link?: string;
  notes?: string;
}

export interface CompareItem {
  id: ID;
  name: string;
  unit: string;
  qty: number;
  prices: Record<ID, number | null>; // por CompareStore.id
}

export type CompareStatus = "aberto" | "decidido" | "comprado";

export interface Comparison extends Base {
  title: string;
  category?: string;
  status: CompareStatus;
  stores: CompareStore[];
  items: CompareItem[];
  notes: string;
}

/* ---------- Orçamento simples ---------- */
export interface QuoteItem {
  id: ID;
  desc: string;
  kind: ItemKind;
  qty: number;
  unit: string;
  price: number;
}

export type QuoteStatus = "rascunho" | "enviado" | "aprovado" | "recusado";

export interface ClientSnapshot {
  name: string;
  doc?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Quote extends Base {
  number: number;
  title: string;
  clientId?: ID;
  client: ClientSnapshot;
  items: QuoteItem[];
  discountType: "pct" | "valor";
  discount: number;
  taxPct: number;
  extra: number; // frete / deslocamento
  extraLabel: string;
  issueDate: string; // yyyy-mm-dd
  validityDays: number;
  payment: string;
  notes: string;
  status: QuoteStatus;
}

/* ---------- Modelos ---------- */
export interface Template extends Base {
  name: string;
  kind: "comparativo" | "orcamento";
  description?: string;
  builtIn?: boolean;
  comparison?: Pick<Comparison, "title" | "category" | "items" | "stores" | "notes">;
  quote?: Pick<Quote, "title" | "items" | "notes" | "payment" | "extraLabel">;
}

export interface DataState {
  company: Company;
  stores: Store[];
  clients: Client[];
  catalog: CatalogItem[];
  comparisons: Comparison[];
  quotes: Quote[];
  templates: Template[];
}

export type CollectionKey = "stores" | "clients" | "catalog" | "comparisons" | "quotes" | "templates";
