# Orça+ — instruções para o Claude

Sistema web de orçamentos e comparativos de preços. Interface, textos e mensagens de commit em **português (pt-BR)**. O usuário não é programador: explique em linguagem simples.

## Regras de trabalho
- **Nunca publique, envie ou crie nada externo** (git push, repositórios, deploy, contas) sem o usuário indicar o destino e concordar. Pergunte antes.
- Repositório oficial: https://github.com/marcosmmnneres-prog/Or-amentos (branch `main`). Autor dos commits: `marcosmmnneres-prog`.
- Ordem de publicação combinada: GitHub → Supabase → Vercel → voltar ao Supabase para configurar a Site URL.
- Depois de mudanças, rode `npm run build` para validar. A porta 3000 da máquina do usuário é usada por outro programa, então use outra (ex.: `npx next start -p 3456`).

## Stack
- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript 5. Esta versão do Next tem mudanças em relação a versões antigas: consulte `node_modules/next/dist/docs/` antes de usar APIs do framework.
- Estado: **zustand** com `persist` em `localStorage` (chave `orcamais-v1`). O app é client-side; o `AppShell` só renderiza depois de montar, para evitar erro de hidratação.
- Nuvem opcional: **Supabase** (`lib/sync.ts`), ativada pelas variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Tabela única `records (user_id, collection, id, data jsonb, deleted, updated_at)` com RLS (`supabase/schema.sql`). A sincronização é por registro e a alteração mais recente vence.
- Ícones: `lucide-react` 1.x. Confira se o nome do ícone existe antes de usar.
- Sem Tailwind: o CSS fica todo em `app/globals.css`, com classes próprias.

## Estrutura
- `app/`: rotas (`/`, `/comparativos`, `/comparativos/[id]`, `/orcamentos`, `/orcamentos/[id]`, `/lojas`, `/clientes`, `/catalogo`, `/modelos`, `/configuracoes`).
- `components/ComparisonEditor.tsx`: planilha comparativa, PDF do comparativo (`PrintComparison`) e modais de loja.
- `components/QuoteEditor.tsx` + `QuoteDoc.tsx`: editor de orçamento e documento/PDF.
- `components/Crud.tsx`: página genérica de cadastro (lojas, clientes, catálogo).
- `components/ui.tsx`: Modal, DropMenu, NumInput (números no formato BR), Field, Empty, PageHead.
- `lib/types.ts`: modelos de dados. `lib/store.ts`: store e ações. `lib/compare.ts`: melhor loja e melhor combinação de lojas (testa todas as combinações, até 14 lojas, incluindo frete). `lib/quote.ts`: totais e validade. `lib/export.ts`: CSV, WhatsApp, backup. `lib/templates.ts`: modelos prontos e dados de exemplo.
- `amostra/`: protótipo visual aprovado pelo usuário (não faz parte do app; excluído do tsconfig).

## Design
- Paleta (aprovada): fundo `#0B0B0D`, superfície `#1F1F23`, laranja `#FF6A00` (ações), âmbar `#FFB000` (melhor preço/destaques), creme `#F4EFE6` (texto e papel do PDF). Vermelho suave `#FF8B8E` para o maior preço.
- Fontes: Manrope (texto) e JetBrains Mono (números, classe `.num`).
- Precisa funcionar no celular (390px, sem rolagem horizontal): no mobile o menu vira barra inferior e a planilha rola lateralmente com a coluna de itens fixa.
- PDF = `window.print()` com CSS `@media print` (`.no-print` / `.print-only`).

## Pendências conhecidas
- Anexar fotos às cotações (adiado até a nuvem estar ativa).
