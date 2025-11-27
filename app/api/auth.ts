"use server";

import * as Iron from "@hapi/iron";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getForethoughtAuth } from "./forethought";

// Token utilities
interface TokenData {
  email: string;
  password: string;
  exp: number; // Expiration timestamp
}

const TOKEN_COOKIE_NAME = "auth_token";
const TOKEN_MAX_AGE_DAYS = 1;
const TOKEN_MAX_AGE_MS = TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function getEncryptionSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_TOKEN_SECRET environment variable is required for token encryption"
    );
  }
  return secret;
}
export async function encodeToken(
  email: string,
  password: string
): Promise<string> {
  const tokenData: TokenData = {
    email,
    password,
    exp: Date.now() + TOKEN_MAX_AGE_MS,
  };

  const secret = getEncryptionSecret();
  return await Iron.seal(tokenData, secret, Iron.defaults);
}
export async function decodeToken(token: string): Promise<TokenData | null> {
  try {
    const secret = getEncryptionSecret();
    const tokenData = (await Iron.unseal(
      token,
      secret,
      Iron.defaults
    )) as TokenData;

    // Verificar expiración
    if (Date.now() > tokenData.exp) {
      return null; // Token expirado
    }

    return tokenData;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}
export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const bearerToken = await getForethoughtAuth({ email, password });

  if (!bearerToken) {
    throw new Error("Failed to get bearer token");
  }

  const cookieStore = await cookies();
  const token = await encodeToken(email, password);

  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE_MS,
  });

  redirect("/");
};

export const logout = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
  redirect("/login");
};
export const isAuthenticated = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const tokenData = await decodeToken(token);
  if (!tokenData) {
    // Token inválido o expirado, limpiar cookie
    cookieStore.delete(TOKEN_COOKIE_NAME);
    return false;
  }

  return true;
};
export const getEmailAndPassword = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const tokenData = await decodeToken(token);
  if (!tokenData) {
    // Token inválido o expirado, limpiar cookie y redirigir
    cookieStore.delete(TOKEN_COOKIE_NAME);
    redirect("/login");
  }

  return { email: tokenData.email, password: tokenData.password };
};
