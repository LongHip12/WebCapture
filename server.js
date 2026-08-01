const dns = require("node:dns").promises;
const net = require("node:net");
const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");

const app = express();
const port = Number(process.env.PORT || 8080);
const maxWidth = 2400;
const maxHeight = 1600;
const navigationTimeout = 30000;
let browserPromise;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

class PreviewError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function privateIpv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [first, second] = parts;
  return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

function privateIpv6(address) {
  const normalized = address.toLowerCase();
  return normalized === "::" || normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb");
}

async function publicUrl(value) {
  let target;
  try {
    target = new URL(value);
  } catch {
    throw new PreviewError(400, "Source must be a valid URL");
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new PreviewError(400, "Source URL must use http or https");
  }
  if (target.username || target.password) {
    throw new PreviewError(400, "Source URL must not contain credentials");
  }
  const addresses = await dns.lookup(target.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => net.isIPv4(address) ? privateIpv4(address) : privateIpv6(address))) {
    throw new PreviewError(400, "Source URL points to a private network");
  }
  return target;
}

function requestBody(body) {
  if (!body || (body.Type !== "html" && body.Type !== "url")) {
    throw new PreviewError(400, 'Type must be "html" or "url"');
  }
  if (typeof body.Source !== "string" || !body.Source.trim()) {
    throw new PreviewError(400, "Source must be a non-empty string");
  }
  if (!body.size || typeof body.size !== "object" || Array.isArray(body.size)) {
    throw new PreviewError(400, "size must be an object with x and y numbers");
  }
  const { x, y } = body.size;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1 || x > maxWidth || y > maxHeight) {
    throw new PreviewError(400, `size.x and size.y must be whole numbers between 1 and ${maxWidth}x${maxHeight}`);
  }
  return { type: body.Type, source: body.Source, width: x, height: y };
}

function browser() {
  browserPromise ||= chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return browserPromise;
}

async function safeRequestUrl(value) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    await publicUrl(value);
  }
}

async function screenshot(request) {
  const instance = await browser();
  const context = await instance.newContext({
    viewport: { width: request.width, height: request.height },
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  try {
    await page.route("**/*", async (route) => {
      try {
        await safeRequestUrl(route.request().url());
        await route.continue();
      } catch {
        await route.abort("blockedbyclient");
      }
    });
    if (request.type === "url") {
      const target = await publicUrl(request.source);
      await page.goto(target.toString(), { waitUntil: "networkidle", timeout: navigationTimeout });
    } else {
      await page.setContent(request.source, { waitUntil: "networkidle", timeout: navigationTimeout });
    }
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
    return await page.screenshot({ type: "png", fullPage: false });
  } finally {
    await context.close();
  }
}

app.get("/", (_request, response) => {
  response.type("text/plain").send(".gg/lonelyhub");
});

app.get("/api/", (_request, response) => {
  response.type("text/plain").send(".gg/lonelyhub");
});

app.get("/api/healthz", (_request, response) => {
  response.json({ status: "ok" });
});

app.post("/api/preview", async (request, response) => {
  try {
    const payload = requestBody(request.body);
    const image = await screenshot(payload);
    response.set({
      "Cache-Control": "no-store",
      "Content-Type": "image/png",
      "Content-Length": String(image.length),
    });
    response.status(200).send(image);
  } catch (error) {
    if (error instanceof PreviewError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    const detail = error instanceof Error ? error.message : String(error);
    console.error(detail);
    response.status(502).json({
      error: "Unable to render preview",
      detail,
    });
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "Request body must be valid JSON" });
    return;
  }
  response.status(500).json({ error: "Internal server error" });
});

const server = app.listen(port, () => {
  process.stdout.write(`WebCapture listening on port ${port}\n`);
});

async function shutdown() {
  server.close();
  if (browserPromise) {
    const instance = await browserPromise;
    await instance.close();
  }
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);