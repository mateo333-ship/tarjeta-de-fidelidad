#!/usr/bin/env node
// One-off admin script: grants (or revokes) the `merchant: true` custom
// claim on a Firebase Auth account, by email. Run this LOCALLY, never
// from the deployed app — it needs the same service account credentials
// as the Admin SDK, and nothing in the browser should ever be able to
// promote an account to merchant.
//
// Usage:
//   1. In the Firebase console: Project settings → Service accounts →
//      "Generate new private key". Save the JSON file somewhere OUTSIDE
//      the project folder (never commit it), e.g. ~/secrets/sello-digital-admin.json
//   2. The person must already have an account — have them register once
//      at /join (or /negocio/login will fail until this runs).
//   3. Run:
//        GOOGLE_APPLICATION_CREDENTIALS=~/secrets/sello-digital-admin.json \
//          node scripts/setMerchant.mjs dueño@ejemplo.com
//      To remove merchant access instead:
//        node scripts/setMerchant.mjs dueño@ejemplo.com --revoke

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

const [, , email, flag] = process.argv;

if (!email) {
  console.error("Uso: node scripts/setMerchant.mjs <email> [--revoke]");
  process.exit(1);
}

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error(
    "Falta GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON de la cuenta de servicio (ver la cabecera de este archivo).",
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(credPath, "utf8"));
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const user = await auth.getUserByEmail(email);
const merchant = flag !== "--revoke";

await auth.setCustomUserClaims(user.uid, { merchant });

console.log(
  merchant
    ? `✓ ${email} ahora tiene acceso de negocio (merchant: true).`
    : `✓ Se ha quitado el acceso de negocio a ${email}.`,
);
console.log(
  "La cuenta debe cerrar sesión y volver a entrar para que el cambio tenga efecto (los claims se leen del token, que se renueva al iniciar sesión).",
);
