#!/usr/bin/env node
// Serves the production build on localhost with an SPA fallback. No dependencies, no network.
// Usage: node scripts/serve-demo.js [--port 4317] [--dir dist] [--open]
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const root = path.resolve(__dirname, "..", arg("dir", "dist"));
const port = Number(arg("port", process.env.PORT || 4317));
const host = "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(`No build found in ${root}. Run "npm run build:demo" first.`);
  process.exit(1);
}

function send(res, file, status = 200) {
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const headers = { "Content-Type": type };
  // The service worker must not be cached, so a new build is picked up straight away.
  headers["Cache-Control"] =
    file.endsWith("index.html") || file.endsWith("mockServiceWorker.js") ? "no-cache" : "public, max-age=3600";
  res.writeHead(status, headers);
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${host}`).pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const file = path.normalize(path.join(root, pathname));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  fs.stat(file, (err, stat) => {
    if (!err && stat.isFile()) return send(res, file);
    // Unknown asset paths 404; everything else is a client-side route.
    if (path.extname(pathname) && !pathname.startsWith("/demo-")) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
      return;
    }
    return send(res, path.join(root, "index.html"));
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is busy. Is the demo already running? Try --port 4318.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  const url = `http://localhost:${port}/`;
  console.log(`Softvery Demo Admin is running at ${url}`);
  console.log("Keep this window open during the demo. Press Ctrl+C to stop.");
  if (args.includes("--open")) {
    const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    exec(`${opener} ${url}`);
  }
});
