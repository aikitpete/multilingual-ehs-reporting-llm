// Access control for anjeontok.netlify.app: login page, 30-day session cookie,
// logout, and a "signed in as ..." badge injected into every HTML page.
//   public : the pitch deck (/ and /index.html)
//   team   : prototypes + PDF reports
//   admin  : everything (adds pitch prep and internal memos)
// Anything not listed in RULES requires admin (default deny).
// Only salted SHA-256 password hashes live here, never the passwords.
// Rotate a password: sha256("anjeontok-v1:" + password) as hex -> USERS, push.
// Optional hardening: set a SESSION_SECRET env var in Netlify to sign cookies
// with a secret that is not in the repo (changing it logs everyone out).
import type { Context } from "https://edge.netlify.com";

declare const Netlify: { env: { get(k: string): string | undefined } } | undefined;

const SALT = "anjeontok-v1:";
const USERS: Record<string, { hash: string; level: number }> = {
  team: { hash: "f6c4ba4fa45a105d077c6c096cd0cdadef612c1581baaf82f10fdf5a03c4bdc5", level: 1 },
  admin: { hash: "61bd75bf02d7fb3c6cfd2b3b79f1a912e335feca580b6ed3021afb9d16f9b63d", level: 2 },
};
const PUBLIC = new Set(["/", "/index.html"]);
const RULES: Array<[RegExp, number]> = [
  [/^\/(supervisor|manager|government)(\.html)?$/, 1],
  [/^\/reports\/[\w.-]+\.pdf$/, 1],
  [/^\/(pitch-prep|knowledge|governance|backend)(\.html)?$/, 2],
];
const COOKIE = "at_session";
const SESSION_DAYS = 30;

const secret = () =>
  (typeof Netlify !== "undefined" && Netlify?.env.get("SESSION_SECRET")) ||
  "anjeontok-session-v1:" + USERS.team.hash + USERS.admin.hash;

export function normalize(rawPath: string): string | null {
  let p: string;
  try { p = decodeURIComponent(rawPath); } catch { return null; }
  p = p.toLowerCase().replace(/\/+/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export function requiredLevel(rawPath: string): number {
  const p = normalize(rawPath);
  if (p === null) return 2;
  if (PUBLIC.has(p)) return 0;
  for (const [re, lvl] of RULES) if (re.test(p)) return lvl;
  return 2;
}

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const enc = new TextEncoder();

async function sha256Hex(s: string) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}
async function hmacHex(msg: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function checkLogin(user: string, pass: string): Promise<string | null> {
  const u = user.trim().toLowerCase();
  const given = await sha256Hex(SALT + pass.trim());
  const rec = USERS[u];
  return rec && same(given, rec.hash) ? u : null;
}

async function makeToken(user: string) {
  const payload = user + "." + (Date.now() + SESSION_DAYS * 864e5);
  return payload + "." + (await hmacHex(payload));
}

export async function readSession(cookieHeader: string | null): Promise<string | null> {
  const m = (cookieHeader || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  if (!m) return null;
  const [user, exp, sig] = m[1].split(".");
  if (!user || !exp || !sig || !USERS[user] || Number(exp) < Date.now()) return null;
  return same(sig, await hmacHex(user + "." + exp)) ? user : null;
}

const cookie = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

const safeNext = (n: string | null) =>
  n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/login") &&
  !n.startsWith("/logout") ? n : "/";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const PAGE_CSS = `
:root{color-scheme:dark;--bg:#14161d;--card:#1d2029;--ink:#f4f1ea;--mut:#9a98a0;--acc:#f5c542;--err:#ff8a7a}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;padding:24px}
main{width:100%;max-width:380px;background:var(--card);border:1px solid #2c303c;border-radius:14px;padding:28px}
h1{font-size:1.25rem;margin:0 0 4px}p{color:var(--mut);margin:0 0 18px;font-size:.92rem}
label{display:block;font-size:.8rem;color:var(--mut);margin:14px 0 6px}
input{width:100%;padding:11px 12px;border-radius:9px;border:1px solid #3a3f4e;background:#12141a;color:var(--ink);font:inherit}
input:focus{outline:2px solid var(--acc);outline-offset:1px}
button,.btn{display:inline-block;margin-top:20px;width:100%;padding:12px;border:0;border-radius:9px;background:var(--acc);color:#1a1a1a;font:600 1rem inherit;text-align:center;text-decoration:none;cursor:pointer}
.err{color:var(--err);margin:14px 0 0;font-size:.9rem}.sub{margin-top:16px;font-size:.85rem;text-align:center}.sub a{color:var(--mut)}
.row{display:flex;gap:8px}.row input{flex:1}.row button{margin:0;width:auto;padding:0 12px;background:#2c303c;color:var(--ink);font-size:.8rem;font-weight:500}
`;
const shell = (title: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>${PAGE_CSS}</style></head><body><main>${body}</main></body></html>`;

function loginPage(next: string, error = "") {
  return shell("Sign in · AnjeonTok", `
<h1>안전톡 · AnjeonTok</h1><p>Sign in to open the prototypes and internal pages.</p>
<form method="post" action="/login">
<input type="hidden" name="next" value="${esc(next)}">
<label for="u">Username</label><input id="u" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required autofocus>
<label for="p">Password</label>
<div class="row"><input id="p" name="password" type="password" autocomplete="current-password" required>
<button type="button" onclick="var i=document.getElementById('p');i.type=i.type==='password'?'text':'password';this.textContent=i.type==='password'?'Show':'Hide'">Show</button></div>
${error ? `<p class="err">${esc(error)}</p>` : ""}
<button type="submit">Sign in</button></form>
<p class="sub"><a href="/">← Back to the public pitch deck</a></p>`);
}

function forbiddenPage(user: string) {
  return shell("Admin only · AnjeonTok", `
<h1>Admin access required</h1><p>You're signed in as <strong>${esc(user)}</strong>, which can't open this page.</p>
<a class="btn" href="/logout?next=/login">Switch account</a>
<p class="sub"><a href="/">← Back to the pitch deck</a></p>`);
}

function badge(user: string | null) {
  const inner = user
    ? `<span style="opacity:.75">Signed in as</span> <b>${esc(user)}</b> · <a href="/logout" style="color:#f5c542">Log out</a>`
    : `<span style="opacity:.75">Not signed in</span> · <a href="/login" style="color:#f5c542">Log in</a>`;
  return `<div id="at-auth" style="position:fixed;top:10px;right:10px;z-index:2147483000;background:rgba(20,22,29,.92);color:#f4f1ea;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 12px;font:12px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.3)">${inner}</div>`;
}

const redirect = (to: string, headers: Record<string, string> = {}) =>
  new Response(null, { status: 303, headers: { Location: to, "Cache-Control": "no-store", ...headers } });
const html = (body: string, status = 200, extra: Record<string, string> = {}) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...extra } });

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const path = normalize(url.pathname) ?? "/";
  const user = await readSession(request.headers.get("cookie"));

  if (path === "/logout")
    return redirect(safeNext(url.searchParams.get("next")), { "Set-Cookie": cookie("", 0) });

  if (path === "/login") {
    if (request.method === "POST") {
      const f = await request.formData();
      const next = safeNext(String(f.get("next") || "/"));
      const who = await checkLogin(String(f.get("username") || ""), String(f.get("password") || ""));
      if (who) return redirect(next, { "Set-Cookie": cookie(await makeToken(who), SESSION_DAYS * 86400) });
      await new Promise((r) => setTimeout(r, 600));
      return html(loginPage(next, "Wrong username or password."), 401);
    }
    return html(loginPage(safeNext(url.searchParams.get("next"))));
  }

  const need = requiredLevel(url.pathname);
  const have = user ? USERS[user].level : 0;
  if (have < need) {
    if (!user) return redirect("/login?next=" + encodeURIComponent(url.pathname));
    return html(forbiddenPage(user), 403);
  }

  const res = await context.next();
  const headers = new Headers(res.headers);
  headers.set("Vary", "Cookie");
  if (need > 0) { headers.set("Cache-Control", "private, no-store"); headers.set("X-Robots-Tag", "noindex, nofollow"); }
  if (res.status === 200 && (headers.get("content-type") || "").includes("text/html")) {
    headers.set("Cache-Control", "private, no-cache");
    headers.delete("content-length"); headers.delete("content-encoding");
    let body = await res.text();
    const i = body.toLowerCase().lastIndexOf("</body>");
    const b = badge(user);
    body = i >= 0 ? body.slice(0, i) + b + body.slice(i) : body + b;
    return new Response(body, { status: 200, headers });
  }
  return new Response(res.body, { status: res.status, headers });
};

export const config = { path: "/*" };
