// Demo database: every collection the mock API serves, persisted in localStorage.
// The first load (and "Reset demo") builds it from the seed in src/demo/seed.
import { getAppBaseUrl } from "config/api";
import { buildSeed } from "./seed";

const DB_KEY = "softvery-demo-admin:db:v1";
const ORIGIN_KEY = "softvery-demo-admin:base-url";

let state = null;

function load() {
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return null;
    // Seed image URLs are absolute; follow the app if it is served from another port or path.
    const savedBase = window.localStorage.getItem(ORIGIN_KEY);
    const base = getAppBaseUrl();
    const text = savedBase && savedBase !== base ? raw.split(savedBase).join(base) : raw;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function persist() {
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(state));
    window.localStorage.setItem(ORIGIN_KEY, getAppBaseUrl());
  } catch (error) {
    console.warn("[demo] could not persist demo data", error);
  }
}

function ensure() {
  if (!state) {
    state = load();
    if (!state) {
      state = buildSeed();
      persist();
    }
  }
  return state;
}

const clone = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

export const db = {
  all(name) {
    return clone(ensure()[name] || []);
  },
  get(name, id) {
    const item = (ensure()[name] || []).find((row) => String(row.id) === String(id));
    return clone(item) || null;
  },
  find(name, predicate) {
    return clone((ensure()[name] || []).find(predicate)) || null;
  },
  filter(name, predicate) {
    return clone((ensure()[name] || []).filter(predicate));
  },
  insert(name, item) {
    const s = ensure();
    s[name] = [...(s[name] || []), clone(item)];
    persist();
    return clone(item);
  },
  update(name, id, patch) {
    const s = ensure();
    let updated = null;
    s[name] = (s[name] || []).map((row) => {
      if (String(row.id) !== String(id)) return row;
      updated = { ...row, ...clone(patch), updatedAt: new Date().toISOString() };
      return updated;
    });
    persist();
    return clone(updated);
  },
  remove(name, id) {
    const s = ensure();
    const before = (s[name] || []).length;
    s[name] = (s[name] || []).filter((row) => String(row.id) !== String(id));
    persist();
    return before !== s[name].length;
  },
  set(name, rows) {
    ensure()[name] = clone(rows);
    persist();
  },
  // Single-value settings (objects, not lists).
  getValue(name, fallback = null) {
    const value = ensure()[name];
    return value === undefined ? fallback : clone(value);
  },
  setValue(name, value) {
    ensure()[name] = clone(value);
    persist();
  },
};

export function resetDemoData() {
  window.localStorage.removeItem(DB_KEY);
  state = null;
}
