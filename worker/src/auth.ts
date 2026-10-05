import { createClerkClient, verifyToken } from "@clerk/backend";

export interface AuthEnv {
  CLERK_SECRET_KEY?: string;
  DEV_EMAIL?: string; // the one account allowed to use the developer tools
}

// Returns the signed-in user's id, or null when the request isn't authenticated.
export async function authenticate(req: Request, env: AuthEnv): Promise<string | null> {
  if (!env.CLERK_SECRET_KEY) return null;
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const claims = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    return claims.sub || null;
  } catch {
    return null;
  }
}

const developerCache = new Map<string, boolean>();

// True only for the owner's account: the Clerk user must have a verified email equal to DEV_EMAIL.
export async function isDeveloper(env: AuthEnv, userId: string): Promise<boolean> {
  const owner = env.DEV_EMAIL?.trim().toLowerCase();
  if (!owner || !env.CLERK_SECRET_KEY) return false;
  const cached = developerCache.get(userId);
  if (cached !== undefined) return cached;
  try {
    const user = await createClerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.getUser(userId);
    const ok = user.emailAddresses.some((e) => e.verification?.status === "verified" && e.emailAddress.toLowerCase() === owner);
    developerCache.set(userId, ok);
    return ok;
  } catch {
    return false;
  }
}
