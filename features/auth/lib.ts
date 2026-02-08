import { createAuthClient, type AuthClient } from "@alien_org/auth-client";
import { getServerEnv } from "@/lib/env";

let authClient: AuthClient | null = null;

function getAuthClient(): AuthClient {
  if (!authClient) {
    authClient = createAuthClient({
      jwksUrl: getServerEnv().ALIEN_JWKS_URL,
    });
  }
  return authClient;
}

export type TokenInfo = Awaited<ReturnType<AuthClient["verifyToken"]>>;

export async function verifyToken(accessToken: string): Promise<TokenInfo> {
  if (
    process.env.NODE_ENV === "development" &&
    accessToken.startsWith("dev:")
  ) {
    const sub = accessToken.slice(4);
    return { sub } as TokenInfo;
  }
  return getAuthClient().verifyToken(accessToken);
}

export function extractBearerToken(header: string | null): string | null {
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}
