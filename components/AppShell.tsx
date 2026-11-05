"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChartColumn,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Menu as MenuIcon,
  Package,
  Settings,
  Store,
  Users,
} from "lucide-react";
import { useApp, useToasts } from "@/lib/store";
import { cloudEnabled, startSync, useSync } from "@/lib/sync";
import { fmtRelative } from "@/lib/format";
import { Modal } from "./ui";

const main = [
  { href: "/", label: "Painel", short: "Painel", icon: LayoutDashboard },
  { href: "/comparativos", label: "Comparativos", short: "Comparar", icon: ChartColumn, count: "comparisons" as const },
  { href: "/orcamentos", label: "Orçamentos", short: "Orçamentos", icon: FileText, count: "quotes" as const },
];
const regs = [
  { href: "/lojas", label: "Lojas e fornecedores", icon: Store },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/catalogo", label: "Catálogo de itens", icon: Package },
  { href: "/modelos", label: "Modelos", icon: LayoutTemplate },
  { href: "/configuracoes", label: "Minha empresa e dados", icon: Settings },
];

export function LogoMark({ size }: { size?: number }) {
  const logo = useApp((s) => s.company.logo);
  return (
    <div className="logo-mark" style={size ? { width: size, height: size } : undefined}>
      {logo ? <img src={logo} alt="" /> : "O"}
    </div>
  );
}

function SyncPill() {
  const { session, status, lastSync } = useSync();
  let title = "Salvo neste aparelho";
  let sub = cloudEnabled ? "Entre para sincronizar" : "Faça backup em Ajustes";
  let dot = "";
  if (cloudEnabled && session) {
    dot = status === "syncing" ? "busy" : status === "error" ? "err" : "on";
    title = status === "error" ? "Erro ao sincronizar" : status === "syncing" ? "Sincronizando…" : "Sincronizado na nuvem";
    sub = session.user.email || "";
    if (status === "idle" && lastSync) sub = `${fmtRelative(lastSync)} · ${session.user.email}`;
  }
  return (
    <Link href="/configuracoes" className="sync-pill">
      <span className={"dot " + dot} />
      <span className="ellipsis">
        <b>{title}</b>
        <span className="ellipsis" style={{ display: "block" }}>{sub}</span>
      </span>
    </Link>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [more, setMore] = useState(false);
  const path = usePathname();
  const nComparisons = useApp((s) => s.comparisons.length);
  const nQuotes = useApp((s) => s.quotes.length);
  const counts = { comparisons: nComparisons, quotes: nQuotes };
  const toasts = useToasts((s) => s.list);

  useEffect(() => {
    setMounted(true);
    startSync();
  }, []);
  useEffect(() => setMore(false), [path]);

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  if (!mounted)
    return (
      <div className="splash">
        <div className="logo-mark">O</div>
      </div>
    );

  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="logo">
          <LogoMark />
          Orça<span>+</span>
        </Link>
        <div className="nav-label">Menu</div>
        {main.map((n) => (
          <Link key={n.href} href={n.href} className={"nav-btn" + (active(n.href) ? " active" : "")}>
            <n.icon />
            {n.label}
            {n.count && <span className="count">{counts[n.count]}</span>}
          </Link>
        ))}
        <div className="nav-label">Cadastros</div>
        {regs.map((n) => (
          <Link key={n.href} href={n.href} className={"nav-btn" + (active(n.href) ? " active" : "")}>
            <n.icon />
            {n.label}
          </Link>
        ))}
        <div className="side-foot">
          <SyncPill />
        </div>
      </aside>

      <div className="mobile-top">
        <LogoMark />
        Orça<span>+</span>
      </div>

      <main className="main">
        <div className="view" key={path}>
          {children}
        </div>
      </main>

      <nav className="mobile-nav">
        {main.map((n) => (
          <Link key={n.href} href={n.href} className={"nav-btn" + (active(n.href) ? " active" : "")}>
            <n.icon />
            {n.short}
          </Link>
        ))}
        <button className={"nav-btn" + (regs.some((r) => active(r.href)) ? " active" : "")} onClick={() => setMore(true)}>
          <MenuIcon />
          Mais
        </button>
      </nav>

      {more && (
        <Modal title="Mais opções" onClose={() => setMore(false)}>
          <div className="stack" style={{ gap: 6 }}>
            {regs.map((n) => (
              <Link key={n.href} href={n.href} className={"nav-btn" + (active(n.href) ? " active" : "")}>
                <n.icon />
                {n.label}
              </Link>
            ))}
            <div style={{ marginTop: 10 }}>
              <SyncPill />
            </div>
          </div>
        </Modal>
      )}

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + (t.tone === "err" ? "err" : "")}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
