import crypto from "node:crypto";

// Talks to the Google Wallet API to create/update a "Loyalty" pass and to
// build the signed link that puts it in a customer's Google Wallet app.
//
// Deliberately implemented with plain fetch + Node's built-in crypto
// module instead of the `google-auth-library` package: this project was
// already bitten once by a dependency (`jose`, pulled in transitively by
// `firebase-admin`) that silently broke the whole server on Vercel over
// an ESM/CJS mismatch. Signing a JWT by hand is ~15 lines of code, and
// avoiding one more third-party auth library removes that entire class
// of risk for a feature that's easy to get right without it.

type WalletCreds = {
  issuerId: string;
  serviceAccountEmail: string;
  privateKey: string;
};

export function getWalletCreds(): WalletCreds | null {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID?.trim();
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!issuerId || !serviceAccountEmail || !privateKey) return null;
  return { issuerId, serviceAccountEmail, privateKey };
}

// A fixed class per deployment — this app is one business, one loyalty
// program (see SETUP.md), so there's only ever one loyaltyClass.
function classId(creds: WalletCreds): string {
  return `${creds.issuerId}.loyalty_sello_digital`;
}

function objectId(creds: WalletCreds, uid: string): string {
  return `${creds.issuerId}.cust_${uid}`;
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signJwtRS256(payload: Record<string, unknown>, privateKey: string): string {
  const header = { alg: "RS256", typ: "JWT" };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

async function getAccessToken(creds: WalletCreds): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwtRS256(
    {
      iss: creds.serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/wallet_object.issuer",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    creds.privateKey,
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`No se pudo autenticar con Google Wallet (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

const WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";

async function walletFetch(path: string, accessToken: string, init?: RequestInit) {
  return fetch(`${WALLET_API}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

// Idempotent: creates the one shared loyaltyClass for this business if it
// doesn't exist yet. New classes start in review, which is normal — see
// SETUP.md. Safe to call on every "add to wallet" click.
export async function ensureLoyaltyClass(
  creds: WalletCreds,
  accessToken: string,
  opts: { origin: string; businessName: string },
): Promise<void> {
  const id = classId(creds);
  const getRes = await walletFetch(`/loyaltyClass/${id}`, accessToken);
  if (getRes.ok) return;
  if (getRes.status !== 404) {
    throw new Error(`No se pudo comprobar la clase de Google Wallet (${getRes.status}): ${await getRes.text()}`);
  }

  const body = {
    id,
    issuerName: opts.businessName,
    programName: opts.businessName,
    reviewStatus: "UNDER_REVIEW",
    hexBackgroundColor: "#3b0f6b",
    programLogo: {
      sourceUri: { uri: `${opts.origin}/icons/icon-512.png` },
      contentDescription: { defaultValue: { language: "es", value: opts.businessName } },
    },
  };

  const createRes = await walletFetch("/loyaltyClass", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!createRes.ok) {
    throw new Error(`No se pudo crear la clase de Google Wallet (${createRes.status}): ${await createRes.text()}`);
  }
}

// Creates or refreshes one customer's pass so it shows their current
// stamp count. Called both when they tap "Add to Google Wallet" and
// (best-effort, fire-and-forget from the caller) every time a stamp is
// added or a reward redeemed, so a pass already in someone's phone keeps
// itself up to date with no action from them.
export async function upsertLoyaltyObject(
  creds: WalletCreds,
  accessToken: string,
  opts: { uid: string; name: string; stamps: number; stampsRequired: number; reward: string },
): Promise<string> {
  const id = objectId(creds, opts.uid);
  const body = {
    id,
    classId: classId(creds),
    state: "ACTIVE",
    accountId: opts.uid,
    accountName: opts.name,
    loyaltyPoints: {
      label: "Sellos",
      balance: { string: `${opts.stamps} / ${opts.stampsRequired}` },
    },
    textModulesData: [{ header: "Premio", body: opts.reward }],
    barcode: { type: "QR_CODE", value: opts.uid },
  };

  const getRes = await walletFetch(`/loyaltyObject/${id}`, accessToken);
  if (getRes.status === 404) {
    const createRes = await walletFetch("/loyaltyObject", accessToken, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!createRes.ok) {
      throw new Error(`No se pudo crear el pase (${createRes.status}): ${await createRes.text()}`);
    }
    return id;
  }
  if (!getRes.ok) {
    throw new Error(`No se pudo comprobar el pase (${getRes.status}): ${await getRes.text()}`);
  }

  const patchRes = await walletFetch(`/loyaltyObject/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!patchRes.ok) {
    throw new Error(`No se pudo actualizar el pase (${patchRes.status}): ${await patchRes.text()}`);
  }
  return id;
}

// The link that opens Google's "Save to Wallet" flow for one already-
// created loyaltyObject.
export function buildSaveLink(creds: WalletCreds, objectIdValue: string, origin: string): string {
  const now = Math.floor(Date.now() / 1000);
  const jwt = signJwtRS256(
    {
      iss: creds.serviceAccountEmail,
      aud: "google",
      typ: "savetowallet",
      origins: [origin],
      iat: now,
      payload: { loyaltyObjects: [{ id: objectIdValue }] },
    },
    creds.privateKey,
  );
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

// Full flow used by the API routes: make sure the class exists, then
// create/refresh this customer's object. Throws on any failure — callers
// that want "best effort" (the stamp/redeem routes) must catch it
// themselves so a Wallet hiccup never breaks the actual stamping.
export async function syncLoyaltyObject(
  creds: WalletCreds,
  opts: {
    origin: string;
    businessName: string;
    uid: string;
    name: string;
    stamps: number;
    stampsRequired: number;
    reward: string;
  },
): Promise<string> {
  const accessToken = await getAccessToken(creds);
  await ensureLoyaltyClass(creds, accessToken, { origin: opts.origin, businessName: opts.businessName });
  return upsertLoyaltyObject(creds, accessToken, opts);
}

export { getAccessToken };

// Wrapper for the fire-and-forget path used by /api/stamp and
// /api/redeem: refresh a customer's already-added pass right after their
// stamp count changes, without ever letting a Wallet API hiccup affect
// the stamping response itself. Callers run this inside next/server's
// `after()` so it happens once the response has already been sent.
export async function bestEffortSync(opts: {
  origin: string;
  businessName: string;
  uid: string;
  name: string;
  stamps: number;
  stampsRequired: number;
  reward: string;
}): Promise<void> {
  const creds = getWalletCreds();
  if (!creds) return; // Google Wallet not configured — nothing to do
  try {
    await syncLoyaltyObject(creds, opts);
  } catch {
    // best-effort only: the stamp/redeem already succeeded in Firestore
  }
}
