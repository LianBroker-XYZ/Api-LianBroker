// LIAN API BRIDGE — Vercel Serverless Function
// Environment variables required:
// API_BASE_URL       = https://api-provider.example.com
// PROVIDER_API_KEY   = API key from the provider you purchased
// CLIENT_API_KEYS    = JSON array, e.g. ["LIAN-demo-123","LIAN-test-456"]
//
// Request:
// GET /api/search?q=naruto&apikey=LIAN-demo-123
//
// The provider's API key is NEVER exposed to the client.

const json = (data, status = 200) => ({
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  },
  body: JSON.stringify(data)
});

function getClientKeys() {
  try {
    const raw = process.env.CLIENT_API_KEYS || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function isAuthorized(req) {
  const url = new URL(req.url, "http://localhost");
  const key =
    url.searchParams.get("apikey") ||
    req.headers.get("x-api-key") ||
    "";

  if (!key) return false;
  return getClientKeys().includes(key);
}

function copySafeQuery(searchParams) {
  const out = new URLSearchParams();

  for (const [key, value] of searchParams.entries()) {
    if (key.toLowerCase() === "apikey") continue;
    out.append(key, value);
  }

  return out;
}

export default async function handler(req) {
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ status: false, message: "Method not allowed" }, 405);
  }

  if (!isAuthorized(req)) {
    return json({
      status: false,
      message: "Invalid or missing API key"
    }, 401);
  }

  const baseUrl = process.env.API_BASE_URL;
  const providerKey = process.env.PROVIDER_API_KEY;

  if (!baseUrl || !providerKey) {
    return json({
      status: false,
      message: "Bridge is not configured. Set API_BASE_URL and PROVIDER_API_KEY."
    }, 500);
  }

  try {
    const incoming = new URL(req.url, "http://localhost");

    // Everything after /api/ becomes the provider path.
    // Example: /api/search -> https://provider.com/search
    const pathname = incoming.pathname.replace(/^\/api\/?/, "");

    if (!pathname) {
      return json({
        status: true,
        name: "LIAN API Bridge",
        message: "Bridge is online",
        usage: "/api/<provider-path>?apikey=YOUR_CLIENT_KEY"
      });
    }

    const target = new URL(
      pathname + (incoming.search ? incoming.search : ""),
      baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"
    );

    target.search = copySafeQuery(incoming.searchParams).toString();

    const headers = new Headers();

    // Default provider authentication.
    // Change this if your purchased API expects another header.
    headers.set("Authorization", `Bearer ${providerKey}`);
    headers.set("Accept", "application/json");

    let body;
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        body = JSON.stringify(req.body ?? {});
        headers.set("Content-Type", "application/json");
      } else {
        body = await req.text();
        if (contentType) headers.set("Content-Type", contentType);
      }
    }

    const response = await fetch(target, {
      method: req.method,
      headers,
      body
    });

    const contentType =
      response.headers.get("content-type") || "application/json";

    const text = await response.text();

    return {
      status: response.status,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store"
      },
      body: text
    };
  } catch (error) {
    return json({
      status: false,
      message: "Upstream request failed",
      error: error?.message || String(error)
    }, 502);
  }
}