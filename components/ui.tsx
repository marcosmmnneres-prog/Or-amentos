"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Ellipsis, X } from "lucide-react";
import { num, parseNum, qty as fmtQty } from "@/lib/format";

/* ---------- Modal ---------- */
export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={"modal" + (wide ? " wide" : "")} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ---------- Menu suspenso ---------- */
export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}
export function DropMenu({ items, trigger, label = "Mais opções" }: { items: MenuItem[]; trigger?: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref}>
      {trigger ? (
        <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      ) : (
        <button className="btn" onClick={() => setOpen((o) => !o)} aria-label={label}>
          <Ellipsis />
        </button>
      )}
      {open && (
        <div className="menu">
          {items.map((it, i) =>
            it.divider ? (
              <hr key={i} />
            ) : (
              <button
                key={i}
                className={it.danger ? "danger" : ""}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
              >
                {it.icon}
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Entrada numérica (formato brasileiro) ---------- */
export function NumInput({
  value,
  onChange,
  className = "input",
  placeholder,
  money = true,
  ...rest
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  className?: string;
  placeholder?: string;
  money?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const fmt = (v: number | null | undefined) => (v == null ? "" : money ? num(v) : fmtQty(v));
  const [text, setText] = useState(fmt(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);
  return (
    <input
      {...rest}
      className={className}
      inputMode="decimal"
      placeholder={placeholder}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        requestAnimationFrame(() => e.target.select());
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        setText(fmt(value));
        rest.onBlur?.(e);
      }}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseNum(e.target.value));
      }}
    />
  );
}

/* ---------- Campo ---------- */
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={"field " + (className || "")}>
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/* ---------- Estado vazio ---------- */
export function Empty({ icon, title, text, children }: { icon: ReactNode; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ico">{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

/* ---------- Cabeçalho de página ---------- */
export function PageHead({ crumb, title, children }: { crumb?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="top no-print">
      <div style={{ minWidth: 0, flex: 1 }}>
        {crumb && <div className="crumb">{crumb}</div>}
        {typeof title === "string" ? <h1>{title}</h1> : title}
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}

export const confirmDelete = (what: string) => window.confirm(`Excluir ${what}? Esta ação não pode ser desfeita.`);
