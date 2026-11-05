"use client";

import type { Company, Quote } from "@/lib/types";
import { quoteTotals } from "@/lib/quote";
import { addDays, brl, fmtDate, qty, quoteCode } from "@/lib/format";

export default function QuoteDoc({ q, company }: { q: Quote; company: Company }) {
  const t = quoteTotals(q);
  const valid = addDays(q.issueDate, q.validityDays).toLocaleDateString("pt-BR");
  const hasKinds = q.items.some((i) => i.kind === "produto") && q.items.some((i) => i.kind === "servico");
  return (
    <div className="doc">
      <div className="doc-head">
        <div className="doc-co">
          <div className="logo-mark">{company.logo ? <img src={company.logo} alt="" /> : (company.name || "S").charAt(0).toUpperCase()}</div>
          <div>
            <b>{company.name || "Sua empresa"}</b>
            {company.doc && <span>{company.doc}</span>}
            <span>{[company.phone, company.email].filter(Boolean).join(" · ") || "Configure seus dados em Minha empresa"}</span>
            {company.address && <span>{company.address}</span>}
          </div>
        </div>
        <div className="doc-num">
          <div className="k">Orçamento</div>
          <div className="v">#{quoteCode(q.number)}</div>
          <div className="d">Emitido em {fmtDate(q.issueDate)}</div>
          <div className="d">Válido até {valid}</div>
        </div>
      </div>

      <div className="doc-meta">
        <div>
          <div className="k">Cliente</div>
          <div className="v">
            <b>{q.client.name || "—"}</b>
            {q.client.doc && <><br />{q.client.doc}</>}
            {(q.client.phone || q.client.email) && <><br />{[q.client.phone, q.client.email].filter(Boolean).join(" · ")}</>}
            {q.client.address && <><br />{q.client.address}</>}
          </div>
        </div>
        <div>
          <div className="k">Referente a</div>
          <div className="v">
            <b>{q.title}</b>
            {q.payment && <><br />Pagamento: {q.payment}</>}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th className="r">Qtd</th>
            <th className="r">Unitário</th>
            <th className="r">Total</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((i, k) => (
            <tr key={i.id}>
              <td>
                {i.desc || "—"}
                {hasKinds && <div className="kind">{i.kind === "servico" ? "Serviço" : "Produto"}</div>}
              </td>
              <td className="r">{qty(i.qty)} {i.unit}</td>
              <td className="r">{brl(i.price)}</td>
              <td className="r">{brl(t.lines[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="doc-total">
        <table>
          <tbody>
            {hasKinds && (
              <>
                <tr><td>Produtos</td><td className="r">{brl(t.products)}</td></tr>
                <tr><td>Serviços</td><td className="r">{brl(t.services)}</td></tr>
              </>
            )}
            <tr><td>Subtotal</td><td className="r">{brl(t.subtotal)}</td></tr>
            {t.discount > 0 && (
              <tr><td>Desconto{q.discountType === "pct" ? ` (${qty(q.discount)}%)` : ""}</td><td className="r">− {brl(t.discount)}</td></tr>
            )}
            {t.tax > 0 && <tr><td>Impostos ({qty(q.taxPct)}%)</td><td className="r">{brl(t.tax)}</td></tr>}
            {t.extra > 0 && <tr><td>{q.extraLabel || "Adicional"}</td><td className="r">{brl(t.extra)}</td></tr>}
            <tr className="grand"><td>Total</td><td className="r">{brl(t.total)}</td></tr>
          </tbody>
        </table>
      </div>

      {(q.notes || company.pix) && (
        <div className="doc-notes">
          {q.notes && (
            <div>
              <div className="k">Observações</div>
              <div className="v">{q.notes}</div>
            </div>
          )}
          {company.pix && (
            <div>
              <div className="k">Chave Pix</div>
              <div className="v">{company.pix}</div>
            </div>
          )}
        </div>
      )}

      <div className="doc-foot">
        <span>Orçamento válido por {q.validityDays} dias a partir da emissão.</span>
        <span className="sign">{q.client.name || "Assinatura do cliente"}</span>
      </div>
    </div>
  );
}
