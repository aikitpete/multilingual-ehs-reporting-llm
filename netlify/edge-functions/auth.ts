// Access control for anjeontok.netlify.app (HTTP Basic auth, two roles).
//   public : the pitch deck (/ and /index.html)
//   team   : prototypes + PDF reports
//   admin  : everything (adds pitch prep and internal memos)
// Anything not listed below requires admin (default deny).
// Only salted SHA-256 hashes live here, never the passwords. To rotate a
// password: sha256("anjeontok-v1:" + password) as hex, paste it below, push.
import type { Context } from "https://edge.netlify.com";

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

export function requiredLevel(rawPath: string): number {
  let p: string;
  try { p = decodeURIComponent(rawPath); } catch { return 2; }
  p = p.toLowerCase().replace(/\/+/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (PUBLIC.has(p)) return 0;
  for (const [re, lvl] of RULES) if (re.test(p)) return lvl;
  return 2;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function userLevel(header: string | null): Promise<number> {
  if (!header || !header.startsWith("Basic ")) return -1;
  let decoded = "";
  try { decoded = atob(header.slice(6)); } catch { return -1; }
  const i = decoded.indexOf(":");
  if (i < 0) return -1;
  const user = decoded.slice(0, i).trim().toLowerCase();
  const pass = decoded.slice(i + 1);
  const rec = USERS[user];
  const given = await sha256Hex(SALT + pass);
  if (!rec) return -1;
  let diff = 0;
  for (let k = 0; k < given.length; k++) diff |= given.charCodeAt(k) ^ rec.hash.charCodeAt(k);
  return diff === 0 && given.length === rec.hash.length ? rec.level : -1;
}

export default async (request: Request, context: Context) => {
  const need = requiredLevel(new URL(request.url).pathname);
  if (need === 0) return context.next();
  const have = await userLevel(request.headers.get("authorization"));
  if (have >= need) {
    const res = await context.next();
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  const msg = have >= 0 ? "Admin access required." : "Login required.";
  return new Response(msg, {
    status: have >= 0 ? 403 : 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="AnjeonTok", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
};

export const config = { path: "/*" };
