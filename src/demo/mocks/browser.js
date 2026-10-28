import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";
import { API } from "./utils";
import { mediaHandlers } from "./media";
import { domainHandlers } from "./domains";

const fallback = http.all(`${API}/*`, ({ request }) => {
  console.warn(`[demo api] no mock for ${request.method} ${new URL(request.url).pathname}`);
  return HttpResponse.json({ statusCode: 404, message: "Not available in the demo" }, { status: 404 });
});

export const worker = setupWorker(...mediaHandlers, ...domainHandlers, fallback);

export function startMockApi() {
  return worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
    serviceWorker: { url: `${process.env.PUBLIC_URL || ""}/mockServiceWorker.js` },
  });
}
