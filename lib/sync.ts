"use client";

import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { COLLECTIONS, useApp } from "./store";
import type { CollectionKey, DataState } from "./types";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudEnabled = Boolean(URL_ && KEY);

let client: SupabaseClient | null = null;
export const supabase = () => {
  if (!cloudEnabled) return null;
  if (!client) client = createClient(URL_!, KEY!);
  return client;
};

type SyncStatus = "off" | "idle" | "syncing" | "error";
export const useSync = create<{ session: Session | null; status: SyncStatus; lastSync: number | null; error?: string }>(() => ({
  session: null,
  status: cloudEnabled ? "idle" : "off",
  lastSync: null,
}));

type Row = { user_id: string; collection: string; id: string; data: unknown; updated_at: string; deleted: boolean };
const TABLE = "records";

let applying = false;
let started = false;
let pending = new Map<string, Row>();
let timer: ReturnType<typeof setTimeout> | null = null;

const ts = (r: { updatedAt?: number }) => r.updatedAt || 0;

async function pullAndMerge(userId: string) {
  const sb = supabase()!;
  useSync.setState({ status: "syncing" });
  const { data, error } = await sb.from(TABLE).select("*").eq("user_id", userId);
  if (error) throw error;
  const rows = (data || []) as Row[];
  const st = useApp.getState();
  const next: Partial<DataState> = {};
  const toPush: Row[] = [];

  for (const key of COLLECTIONS) {
    const local = st[key] as { id: string; updatedAt: number }[];
    const remote = rows.filter((r) => r.collection === key);
    const map = new Map(local.map((r) => [r.id, r]));
    for (const row of remote) {
      const l = map.get(row.id);
      const rTime = new Date(row.updated_at).getTime();
      if (row.deleted) {
        if (l && ts(l) <= rTime) map.delete(row.id);
        continue;
      }
      if (!l || ts(l) < rTime) map.set(row.id, row.data as { id: string; updatedAt: number });
    }
    for (const l of local) {
      const row = remote.find((r) => r.id === l.id);
      if (!row || new Date(row.updated_at).getTime() < ts(l)) toPush.push(mkRow(userId, key, l.id, l, false, ts(l)));
    }
    (next as Record<string, unknown>)[key] = [...map.values()].sort((a, b) => ts(b) - ts(a));
  }
  const rc = rows.find((r) => r.collection === "settings" && r.id === "company");
  if (rc && new Date(rc.updated_at).getTime() > (st.company.updatedAt || 0)) next.company = rc.data as DataState["company"];
  else if (st.company.updatedAt) toPush.push(mkRow(userId, "settings", "company", st.company, false, st.company.updatedAt));

  applying = true;
  useApp.getState().applyRemote(next);
  applying = false;
  if (toPush.length) await pushRows(toPush);
  useSync.setState({ status: "idle", lastSync: Date.now(), error: undefined });
}

const mkRow = (user_id: string, collection: string, id: string, data: unknown, deleted: boolean, time?: number): Row => ({
  user_id,
  collection,
  id,
  data,
  deleted,
  updated_at: new Date(time || Date.now()).toISOString(),
});

async function pushRows(rows: Row[]) {
  const sb = supabase()!;
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from(TABLE).upsert(rows.slice(i, i + 200), { onConflict: "user_id,collection,id" });
    if (error) throw error;
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const rows = [...pending.values()];
    pending = new Map();
    if (!rows.length) return;
    useSync.setState({ status: "syncing" });
    try {
      await pushRows(rows);
      useSync.setState({ status: "idle", lastSync: Date.now(), error: undefined });
    } catch (e) {
      rows.forEach((r) => pending.set(r.collection + r.id, r));
      useSync.setState({ status: "error", error: (e as Error).message });
    }
  }, 900);
}

/** Inicia a sincronização (chamado uma vez no AppShell). */
export function startSync() {
  const sb = supabase();
  if (!sb || started) return;
  started = true;

  sb.auth.getSession().then(({ data }) => {
    useSync.setState({ session: data.session });
    if (data.session) pullAndMerge(data.session.user.id).catch((e) => useSync.setState({ status: "error", error: e.message }));
  });
  sb.auth.onAuthStateChange((event, session) => {
    useSync.setState({ session });
    if (event === "SIGNED_IN" && session)
      pullAndMerge(session.user.id).catch((e) => useSync.setState({ status: "error", error: e.message }));
  });

  useApp.subscribe((s, prev) => {
    const session = useSync.getState().session;
    if (applying || !session) return;
    const uidUser = session.user.id;
    for (const key of COLLECTIONS) {
      const a = s[key] as { id: string; updatedAt: number }[];
      const b = prev[key] as { id: string; updatedAt: number }[];
      if (a === b) continue;
      const before = new Map(b.map((r) => [r.id, r]));
      for (const r of a) if (before.get(r.id) !== r) pending.set(key + r.id, mkRow(uidUser, key, r.id, r, false, ts(r)));
      const now = new Set(a.map((r) => r.id));
      for (const r of b) if (!now.has(r.id)) pending.set(key + r.id, mkRow(uidUser, key, r.id, { id: r.id }, true));
    }
    if (s.company !== prev.company) pending.set("settingscompany", mkRow(uidUser, "settings", "company", s.company, false, s.company.updatedAt));
    if (pending.size) schedule();
  });
}

export async function syncNow() {
  const s = useSync.getState().session;
  if (s) await pullAndMerge(s.user.id);
}

export type { CollectionKey };
