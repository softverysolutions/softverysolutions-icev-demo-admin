// Uploaded files live in IndexedDB and are served back by the mock API at /demo-media/<key>,
// so an upload survives a reload and "Reset demo" can wipe it.
import { http, HttpResponse } from "msw";
import { getAppBaseUrl } from "config/api";
import { API, json, readJson } from "./utils";

const DB_NAME = "softvery-demo-admin-media";
const STORE = "files";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function tx(mode, run) {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const t = database.transaction(STORE, mode);
    const result = run(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result);
    t.onerror = () => reject(t.error);
  });
}

export const mediaUrl = (key) => `${getAppBaseUrl()}/demo-media/${encodeURIComponent(key)}`;

export async function clearMedia() {
  try {
    await tx("readwrite", (store) => store.clear());
  } catch {
    // nothing stored yet
  }
}

const keyFromUrl = (url) => decodeURIComponent(new URL(url).pathname.replace(/^.*\/demo-media\//, ""));

export const mediaHandlers = [
  http.post(`${API}/media/presigned-upload-url`, async ({ request }) => {
    const { key = `upload-${Date.now()}` } = await readJson(request);
    const url = mediaUrl(key);
    return json({ url, uploadUrl: url, publicUrl: url, fileUrl: url, key, bucket: "demo-media" });
  }),
  http.get(`${API}/media/file-url`, ({ request }) => {
    const key = new URL(request.url).searchParams.get("key");
    return json({ url: mediaUrl(key), fileUrl: mediaUrl(key), key });
  }),
  http.put("*/demo-media/*", async ({ request }) => {
    const blob = await request.blob();
    await tx("readwrite", (store) => store.put(blob, keyFromUrl(request.url)));
    return new HttpResponse(null, { status: 200 });
  }),
  http.get("*/demo-media/*", async ({ request }) => {
    const blob = await tx("readonly", (store) => store.get(keyFromUrl(request.url)));
    if (!blob) return new HttpResponse(null, { status: 404 });
    return new HttpResponse(blob, { headers: { "Content-Type": blob.type || "image/jpeg" } });
  }),
];
