"use client";

import { useRef, useState } from "react";
import { Cloud, CloudOff, Download, ImagePlus, LogOut, RefreshCw, Trash2, Upload } from "lucide-react";
import { COLLECTIONS, defaultCompany, toast, useApp } from "@/lib/store";
import { cloudEnabled, supabase, syncNow, useSync } from "@/lib/sync";
import { backupJSON, readBackup } from "@/lib/export";
import { fmtRelative } from "@/lib/format";
import type { DataState } from "@/lib/types";
import { Field, NumInput, PageHead } from "@/components/ui";

export default function SettingsPage() {
  const company = useApp((s) => s.company);
  const setCompany = useApp((s) => s.setCompany);
  const replaceAll = useApp((s) => s.replaceAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const onLogo = async (f?: File) => {
    if (!f) return;
    const img = new Image();
    img.src = URL.createObjectURL(f);
    await img.decode();
    const size = 256;
    const scale = Math.min(1, size / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    setCompany({ logo: canvas.toDataURL("image/png") });
    URL.revokeObjectURL(img.src);
    toast("Logo atualizada");
  };

  const exportAll = () => {
    const s = useApp.getState();
    const data = { company: s.company } as DataState;
    COLLECTIONS.forEach((k) => ((data as unknown as Record<string, unknown>)[k] = s[k]));
    backupJSON(data);
  };

  const importAll = async (f?: File) => {
    if (!f) return;
    try {
      const data = await readBackup(f);
      if (!window.confirm("Importar este backup? Os dados atuais deste aparelho serão substituídos.")) return;
      replaceAll(data);
      toast("Backup restaurado");
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };

  const f = (k: keyof typeof company, label: string, props: Record<string, unknown> = {}) => (
    <Field label={label}>
      <input value={(company[k] as string) || ""} onChange={(e) => setCompany({ [k]: e.target.value })} {...props} />
    </Field>
  );

  return (
    <>
      <PageHead crumb="Ajustes" title="Minha empresa e dados" />
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          <div className="card pad">
            <h2 style={{ marginBottom: 4 }}>Dados que aparecem no PDF</h2>
            <p className="muted small" style={{ marginBottom: 16 }}>Salvos automaticamente enquanto você digita.</p>
            <div className="row" style={{ gap: 16, marginBottom: 16 }}>
              <div className="logo-mark" style={{ width: 64, height: 64, fontSize: 26 }}>
                {company.logo ? <img src={company.logo} alt="Logo" /> : (company.name || "O").charAt(0).toUpperCase()}
              </div>
              <div className="row wrap">
                <button className="btn btn-sm" onClick={() => logoRef.current?.click()}>
                  <ImagePlus /> {company.logo ? "Trocar logo" : "Enviar logo"}
                </button>
                {company.logo && (
                  <button className="btn btn-sm btn-ghost" onClick={() => setCompany({ logo: undefined })}>Remover</button>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
            </div>
            {f("name", "Nome da empresa ou seu nome", { placeholder: "Ex.: Silva Reformas" })}
            <div className="row-2">
              {f("doc", "CNPJ / CPF")}
              {f("phone", "Telefone / WhatsApp", { inputMode: "tel" })}
            </div>
            <div className="row-2">
              {f("email", "E-mail", { inputMode: "email" })}
              {f("pix", "Chave Pix (opcional)")}
            </div>
            {f("address", "Endereço")}
          </div>

          <div className="card pad">
            <h2 style={{ marginBottom: 16 }}>Padrões dos novos orçamentos</h2>
            <div className="row-2">
              <Field label="Validade (dias)">
                <NumInput money={false} value={company.defaultValidityDays} onChange={(n) => setCompany({ defaultValidityDays: Math.max(0, Math.round(n ?? 15)) })} />
              </Field>
              <Field label="Próximo número">
                <NumInput money={false} value={company.nextQuoteNumber} onChange={(n) => setCompany({ nextQuoteNumber: Math.max(1, Math.round(n ?? 1)) })} />
              </Field>
            </div>
            {f("defaultPayment", "Forma de pagamento")}
            <Field label="Observações padrão">
              <textarea value={company.defaultNotes} onChange={(e) => setCompany({ defaultNotes: e.target.value })} placeholder="Ex.: Garantia de 90 dias. Material não incluso." />
            </Field>
          </div>
        </div>

        <div className="stack">
          <CloudCard />
          <div className="card pad">
            <h2 style={{ marginBottom: 4 }}>Backup</h2>
            <p className="muted small" style={{ marginBottom: 16, lineHeight: 1.5 }}>
              Baixe uma cópia de tudo (comparativos, orçamentos, cadastros e modelos) num arquivo. Use também para passar os dados para outro aparelho.
            </p>
            <div className="row wrap">
              <button className="btn" onClick={exportAll}>
                <Download /> Baixar backup
              </button>
              <button className="btn" onClick={() => fileRef.current?.click()}>
                <Upload /> Restaurar backup
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importAll(e.target.files?.[0])} />
            </div>
          </div>
          <div className="card pad">
            <h2 style={{ marginBottom: 4 }}>Zona de perigo</h2>
            <p className="muted small" style={{ marginBottom: 16 }}>Apaga todos os dados deste aparelho.</p>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (window.prompt('Para apagar tudo, digite "APAGAR"') === "APAGAR") {
                  replaceAll({ company: defaultCompany() });
                  toast("Dados apagados");
                }
              }}
            >
              <Trash2 /> Apagar todos os dados
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function CloudCard() {
  const { session, status, lastSync, error } = useSync();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [busy, setBusy] = useState(false);

  if (!cloudEnabled)
    return (
      <div className="card pad">
        <div className="row" style={{ marginBottom: 8 }}>
          <CloudOff size={18} className="muted" />
          <h2>Sincronização na nuvem</h2>
        </div>
        <p className="muted small" style={{ lineHeight: 1.6 }}>
          No momento os dados ficam salvos <b>neste navegador</b>. Para acessar os mesmos orçamentos no celular, tablet e computador, ative a nuvem
          (gratuita) configurando o Supabase. O passo a passo está no arquivo <b>LEIA-ME.md</b> do projeto.
        </p>
      </div>
    );

  const sb = supabase()!;
  const submit = async () => {
    setBusy(true);
    const { error } =
      mode === "entrar"
        ? await sb.auth.signInWithPassword({ email, password: pass })
        : await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) toast(error.message, "err");
    else if (mode === "criar") toast("Conta criada! Confirme pelo e-mail, se for solicitado.");
  };

  if (session)
    return (
      <div className="card pad">
        <div className="row" style={{ marginBottom: 8 }}>
          <Cloud size={18} className="amber" />
          <h2>Sincronizado na nuvem</h2>
        </div>
        <p className="muted small" style={{ marginBottom: 16, lineHeight: 1.6 }}>
          Conectado como <b>{session.user.email}</b>.{" "}
          {status === "error" ? <span style={{ color: "var(--bad)" }}>Erro: {error}</span> : lastSync ? `Última sincronização ${fmtRelative(lastSync)}.` : ""}
        </p>
        <div className="row wrap">
          <button className="btn" onClick={() => syncNow().then(() => toast("Sincronizado")).catch((e) => toast(e.message, "err"))}>
            <RefreshCw /> Sincronizar agora
          </button>
          <button className="btn btn-ghost" onClick={() => sb.auth.signOut()}>
            <LogOut /> Sair
          </button>
        </div>
      </div>
    );

  return (
    <div className="card pad">
      <div className="row" style={{ marginBottom: 8 }}>
        <Cloud size={18} className="orange" />
        <h2>Entre para sincronizar</h2>
      </div>
      <p className="muted small" style={{ marginBottom: 16, lineHeight: 1.5 }}>
        Seus dados ficam salvos na nuvem e aparecem em todos os seus aparelhos.
      </p>
      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={mode === "entrar" ? "active" : ""} onClick={() => setMode("entrar")}>Entrar</button>
        <button className={mode === "criar" ? "active" : ""} onClick={() => setMode("criar")}>Criar conta</button>
      </div>
      <Field label="E-mail">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </Field>
      <Field label="Senha">
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} autoComplete={mode === "entrar" ? "current-password" : "new-password"} />
      </Field>
      <button className="btn btn-primary" onClick={submit} disabled={busy || !email || pass.length < 6}>
        {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
      </button>
    </div>
  );
}
