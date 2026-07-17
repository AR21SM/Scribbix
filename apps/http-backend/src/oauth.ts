import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Express, Request, RequestHandler, Response } from "express";
import {
  FRONTEND_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  PUBLIC_HTTP_URL,
} from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

type OAuthProvider = "google" | "github";

interface OAuthProfile {
  providerAccountId: string;
  email: string;
  name: string;
  photo?: string;
}

const providerCredentials = {
  google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET },
  github: { clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET },
} satisfies Record<OAuthProvider, { clientId: string; clientSecret: string }>;

function isProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "github";
}

function redirectUri(provider: OAuthProvider) {
  return `${PUBLIC_HTTP_URL}/api/oauth/${provider}/callback`;
}

function parseCookies(request: Request) {
  return Object.fromEntries(
    (request.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim().split("="))
      .filter(([name, value]) => name && value)
      .map(([name, value]) => [name, decodeURIComponent(value || "")]),
  );
}

function cookie(name: string, value: string, maxAge = 600) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/api/oauth; Max-Age=${maxAge}${secure}`;
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return (
    firstBuffer.length === secondBuffer.length &&
    timingSafeEqual(firstBuffer, secondBuffer)
  );
}

function redirectWithError(response: Response, message: string) {
  const url = new URL("/signin", FRONTEND_URL);
  url.searchParams.set("oauth_error", message);
  response.redirect(url.toString());
}

async function readJson<T>(response: globalThis.Response) {
  const body = (await response.json()) as T & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || body.error) {
    throw new Error(
      body.error_description || body.error || "OAuth request failed",
    );
  }

  return body;
}

async function getGoogleProfile(
  code: string,
  verifier: string,
): Promise<OAuthProfile> {
  const credentials = providerCredentials.google;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri("google"),
    }),
  });
  const token = await readJson<{ access_token: string }>(tokenResponse);
  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );
  const profile = await readJson<{
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  }>(profileResponse);

  if (!profile.email || profile.email_verified === false) {
    throw new Error("Google did not return a verified email address");
  }

  return {
    providerAccountId: profile.sub,
    email: profile.email.toLowerCase(),
    name: profile.name || profile.email.split("@")[0] || "Google user",
    photo: profile.picture,
  } satisfies OAuthProfile;
}

async function getGitHubProfile(
  code: string,
  verifier: string,
): Promise<OAuthProfile> {
  const credentials = providerCredentials.github;
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code,
        code_verifier: verifier,
        redirect_uri: redirectUri("github"),
      }),
    },
  );
  const token = await readJson<{ access_token: string }>(tokenResponse);
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token.access_token}`,
    "User-Agent": "Scribbix",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const profileResponse = await fetch("https://api.github.com/user", {
    headers,
  });
  const profile = await readJson<{
    id: number;
    login: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  }>(profileResponse);
  let email = profile.email;

  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers,
    });
    const emails =
      await readJson<
        Array<{ email: string; primary: boolean; verified: boolean }>
      >(emailsResponse);
    email =
      emails.find((entry) => entry.primary && entry.verified)?.email ||
      emails.find((entry) => entry.verified)?.email;
  }

  if (!email) throw new Error("GitHub did not return a verified email address");

  return {
    providerAccountId: String(profile.id),
    email: email.toLowerCase(),
    name: profile.name || profile.login,
    photo: profile.avatar_url,
  } satisfies OAuthProfile;
}

async function findOrCreateUser(
  provider: OAuthProvider,
  profile: OAuthProfile,
) {
  const existingAccount = await prismaClient.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingAccount) return existingAccount.user;

  return prismaClient.$transaction(async (transaction) => {
    const user =
      (await transaction.user.findUnique({
        where: { email: profile.email },
      })) ||
      (await transaction.user.create({
        data: {
          email: profile.email,
          password: null,
          name: profile.name,
          photo: profile.photo,
        },
      }));

    await transaction.oAuthAccount.create({
      data: {
        provider,
        providerAccountId: profile.providerAccountId,
        userId: user.id,
      },
    });

    return user;
  });
}

export function registerOAuthRoutes(
  app: Express,
  authLimiter: RequestHandler,
  createAccessToken: (userId: string) => string,
) {
  app.get("/api/oauth/:provider", authLimiter, (request, response) => {
    const provider = request.params.provider || "";
    if (!isProvider(provider)) {
      response.status(404).json({ message: "OAuth provider not found" });
      return;
    }

    const credentials = providerCredentials[provider];
    if (!credentials.clientId || !credentials.clientSecret) {
      redirectWithError(response, `${provider} login is not configured yet`);
      return;
    }

    const state = randomBytes(24).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    response.setHeader("Set-Cookie", [
      cookie(`scribbix_${provider}_state`, state),
      cookie(`scribbix_${provider}_verifier`, verifier),
    ]);

    const url = new URL(
      provider === "google"
        ? "https://accounts.google.com/o/oauth2/v2/auth"
        : "https://github.com/login/oauth/authorize",
    );
    url.searchParams.set("client_id", credentials.clientId);
    url.searchParams.set("redirect_uri", redirectUri(provider));
    url.searchParams.set("response_type", "code");
    url.searchParams.set(
      "scope",
      provider === "google" ? "openid email profile" : "read:user user:email",
    );
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    if (provider === "google") url.searchParams.set("prompt", "select_account");
    response.redirect(url.toString());
  });

  app.get(
    "/api/oauth/:provider/callback",
    authLimiter,
    async (request, response) => {
      const provider = request.params.provider || "";
      if (!isProvider(provider)) {
        response.status(404).json({ message: "OAuth provider not found" });
        return;
      }

      response.setHeader("Set-Cookie", [
        cookie(`scribbix_${provider}_state`, "", 0),
        cookie(`scribbix_${provider}_verifier`, "", 0),
      ]);

      try {
        const cookies = parseCookies(request);
        const state =
          typeof request.query.state === "string" ? request.query.state : "";
        const code =
          typeof request.query.code === "string" ? request.query.code : "";
        const savedState = cookies[`scribbix_${provider}_state`] || "";
        const verifier = cookies[`scribbix_${provider}_verifier`] || "";

        if (
          !state ||
          !savedState ||
          !safeEqual(state, savedState) ||
          !code ||
          !verifier
        ) {
          throw new Error("OAuth request expired or could not be verified");
        }

        const profile =
          provider === "google"
            ? await getGoogleProfile(code, verifier)
            : await getGitHubProfile(code, verifier);
        const user = await findOrCreateUser(provider, profile);
        const callbackUrl = new URL("/auth/callback", FRONTEND_URL);
        callbackUrl.hash = new URLSearchParams({
          token: createAccessToken(user.id),
          userId: user.id,
          name: user.name,
        }).toString();
        response.redirect(callbackUrl.toString());
      } catch (error) {
        console.error(`${provider} OAuth error:`, error);
        redirectWithError(
          response,
          error instanceof Error ? error.message : "Social login failed",
        );
      }
    },
  );
}
