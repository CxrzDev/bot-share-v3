import { createHmac } from "crypto";

const SECRET = () => process.env.NEXTAUTH_SECRET ?? "fallback-dev-secret";

export function encodeState(userId: string): string {
  const ts = Date.now();
  const payload = `${userId}:${ts}`;
  const sig = createHmac("sha256", SECRET()).update(payload).digest("hex").slice(0, 16);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function decodeState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString();
    const lastColon = decoded.lastIndexOf(":");
    const secondLastColon = decoded.lastIndexOf(":", lastColon - 1);
    const userId = decoded.slice(0, secondLastColon);
    const ts = parseInt(decoded.slice(secondLastColon + 1, lastColon), 10);
    const sig = decoded.slice(lastColon + 1);

    if (isNaN(ts) || Date.now() - ts > 15 * 60 * 1000) return null;

    const expectedSig = createHmac("sha256", SECRET())
      .update(`${userId}:${ts}`)
      .digest("hex")
      .slice(0, 16);

    return sig === expectedSig ? userId : null;
  } catch {
    return null;
  }
}
