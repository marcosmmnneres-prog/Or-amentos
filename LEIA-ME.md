# Orça+ — Orçamentos e comparativos

Sistema web para criar orçamentos e comparar preços entre lojas, item a item. Funciona no computador, no tablet e no celular, e pode ser instalado como aplicativo na tela inicial.

## O que o sistema faz

- **Comparativos:** uma planilha com os itens nas linhas e as lojas nas colunas.
  - O menor preço de cada item aparece em amarelo e o maior em vermelho.
  - Cada loja tem frete, prazo e forma de pagamento.
  - O sistema calcula a **melhor loja única** e a **melhor combinação de lojas**, já com os fretes.
  - Para navegar como no Excel, use Enter ou as setas ↑ ↓.
- **Orçamentos simples:**
  - Cliente, itens (produto ou serviço), desconto em % ou em R$, impostos, frete ou deslocamento, validade e situação (rascunho, enviado, aprovado, recusado).
  - Prévia ao vivo do documento com a sua marca.
- **PDF:** use o botão "Gerar PDF" / "Exportar PDF". Na janela que abrir, escolha **Salvar como PDF**.
- **Exportar e compartilhar:**
  - Planilha CSV, que abre no Excel.
  - WhatsApp, já com o resumo pronto.
  - Compartilhamento nativo do celular.
- **Cadastros:**
  - Lojas.
  - Clientes.
  - Catálogo de itens, com **histórico de preços** e gráfico.
  - Os itens do catálogo aparecem como sugestão enquanto você digita.
- **Modelos:** 8 modelos prontos (reforma, mercado, festa, eletrônicos, elétrica, pintura, manutenção, buffet). Você também pode salvar seus próprios modelos.
- **Painel:**
  - Economia identificada.
  - Orçamentos aguardando resposta.
  - Valor aprovado no mês e taxa de aprovação.
  - Aviso de orçamentos perto de vencer.
- **Dados:**
  - Tudo é salvo automaticamente no navegador.
  - Backup e restauração em arquivo.
  - Sincronização na nuvem é opcional (veja abaixo).

## Rodar no computador

Requisito: [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm run dev
```

Depois abra http://localhost:3000.

## Publicar no Vercel

1. Crie um repositório no GitHub e envie esta pasta para ele:
   ```bash
   git init
   git add .
   git commit -m "Orça+"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/orcamentos.git
   git push -u origin main
   ```
2. Em https://vercel.com, clique em **Add New → Project** e importe o repositório. O Vercel detecta o Next.js sozinho.
3. Clique em **Deploy**. Pronto, você terá um endereço como `orcamentos.vercel.app`.

> Sem a nuvem configurada, os dados ficam salvos **no navegador de cada aparelho**. Use **Ajustes → Baixar backup** com frequência, ou ative a nuvem.

## (Opcional) Ativar a nuvem para usar os mesmos dados em todos os aparelhos

1. Crie uma conta gratuita em https://supabase.com e depois um novo projeto.
2. No projeto, abra **SQL Editor**, cole o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
4. No Vercel, abra **Settings → Environment Variables** e adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = a Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = a chave anon
5. Faça um novo deploy. Para testar no computador, copie `.env.example` para `.env.local` e preencha os mesmos valores.
6. No sistema, vá em **Minha empresa e dados**, crie a sua conta e entre. O que já estava salvo no aparelho é enviado para a nuvem automaticamente.

Em **Authentication → URL Configuration** do Supabase, coloque o endereço do Vercel em *Site URL*. Isso faz o link de confirmação do e-mail apontar para o lugar certo.

## Estrutura do projeto

```
app/            páginas (painel, comparativos, orçamentos, cadastros, ajustes)
components/     componentes de tela (planilha, editor de orçamento, documento PDF…)
lib/            dados e regras (cálculos, armazenamento, exportação, sincronização)
supabase/       script do banco de dados (nuvem opcional)
amostra/        a amostra visual aprovada (não faz parte do sistema)
```
