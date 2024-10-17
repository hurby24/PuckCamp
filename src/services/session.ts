import { getRedisClient } from "../db/redisClient";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

export async function createSession(
  token: string,
  userId: string,
  options?: SessionOptions
): Promise<Session> {
  const hasher = new Bun.CryptoHasher("sha256");
  const sessionId = hasher
    .update(new TextEncoder().encode(token))
    .digest("hex");
  const session: Session = {
    id: sessionId,
    userId,
    emailVerified: options?.emailVerified ?? true,
    temporary: options?.temporary ?? false,
    expiresAt: options?.temporary
      ? new Date(Date.now() + 1000 * 60 * 60 * 1)
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
  };

  const redis = getRedisClient();

  await redis.set(
    `session:${sessionId}`,
    JSON.stringify({
      id: session.id,
      user_id: session.userId,
      email_verified: session.emailVerified,
      temporary: session.temporary,
      expires_at: Math.floor(session.expiresAt.getTime() / 1000),
    }),
    "EX",
    Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
  );
  await redis.sadd(`user:${userId}:sessions`, sessionId);

  return session;
}

export async function validateSessionToken(
  token: string
): Promise<Session | null> {
  const hasher = new Bun.CryptoHasher("sha256");
  const sessionId = hasher
    .update(new TextEncoder().encode(token))
    .digest("hex");
  const redis = getRedisClient();
  const item = await redis.get(`session:${sessionId}`);
  if (item === null) {
    return null;
  }
  const result = JSON.parse(item);

  const session: Session = {
    id: result.id,
    userId: result.user_id,
    emailVerified: result.email_verified,
    temporary: result.temporary,
    expiresAt: new Date(result.expires_at * 1000),
  };
  if (Date.now() >= session.expiresAt.getTime()) {
    await redis.del(`session:${session.id}`);
    await redis.srem(`user:${session.userId}:sessions`, session.id);
    return null;
  }
  if (
    Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 7 &&
    !session.temporary
  ) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        id: session.id,
        user_id: session.userId,
        email_verified: session.emailVerified,
        temporary: session.temporary,
        expires_at: Math.floor(session.expiresAt.getTime() / 1000),
      }),
      "EX",
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
    );
  }
  return session;
}

export async function invalidateSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`session:${sessionId}`);
  await redis.srem(`user:${userId}:sessions`, sessionId);
}

export async function invalidateAllSessions(userId: string): Promise<void> {
  const redis = getRedisClient();
  const sessionIds = await redis.smembers(`user:${userId}:sessions`);
  await redis.del(...sessionIds.map((id) => `session:${id}`));
  await redis.del(`user:${userId}:sessions`);
}

export interface Session {
  id: string;
  userId: string;
  emailVerified: boolean;
  temporary: boolean;
  expiresAt: Date;
}

export interface SessionOptions {
  emailVerified: boolean;
  temporary: boolean;
}
