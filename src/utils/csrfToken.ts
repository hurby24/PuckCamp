import { Context } from "hono";
import { setCookie } from "hono/cookie";
import { generateRandomString } from "@oslojs/crypto/random";
import type { RandomReader } from "@oslojs/crypto/random";

export const createCsrfToken = async (sId: string): Promise<string> => {
  const random: RandomReader = {
    read(bytes) {
      crypto.getRandomValues(bytes);
    },
  };
  const secretData = new TextEncoder().encode(process.env.HMAC_SECRET);
  const hasher = new Bun.CryptoHasher("sha256", secretData);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nonce = generateRandomString(random, alphabet, 10);
  const message = `${sId}!${nonce}`;
  const csrfToken = await hasher
    .update(new TextEncoder().encode(message))
    .digest("hex");
  return `${csrfToken}.${nonce}`;
};

export const validateCsrfToken = async (
  sId: string,
  token: string
): Promise<boolean> => {
  const secretData = new TextEncoder().encode(process.env.HMAC_SECRET);
  const hasher = new Bun.CryptoHasher("sha256", secretData);
  const [signature, nonce] = token.split(".");
  const message = `${sId}!${nonce}`;
  const csrfToken = await hasher
    .update(new TextEncoder().encode(message))
    .digest("hex");

  return signature === csrfToken;
};

export function setCSRFTokenCookie(
  context: Context,
  token: string,
  expiresAt: Date
): void {
  if (process.env.HMAC_SECRET === undefined) {
    throw new Error("HMAC_SECRET is not defined");
  }
  setCookie(context, "csrftoken", token, {
    httpOnly: true,
    path: "/",
    secure: false,
    sameSite: "lax",
    expires: expiresAt,
  });
}
