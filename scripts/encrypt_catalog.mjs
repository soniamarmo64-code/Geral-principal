#!/usr/bin/env node
// Criptografa data/catalog.json -> assets/catalog.enc.js (AES-GCM, chave via PBKDF2-SHA256).
// Uso: CATALOG_PASSWORD="minha senha" node scripts/encrypt_catalog.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const password = process.env.CATALOG_PASSWORD;
if (!password) {
  console.error('Defina a senha: CATALOG_PASSWORD="..." node scripts/encrypt_catalog.mjs');
  process.exit(1);
}
const ITER = 310000;
const plain = readFileSync(join(root, "data", "catalog.json"));
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
const b64 = (u) => Buffer.from(u).toString("base64");
writeFileSync(
  join(root, "assets", "catalog.enc.js"),
  "/* Catálogo criptografado — gerado por scripts/encrypt_catalog.mjs */\n" +
    `window.CATALOG_ENC=${JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) })};\n`
);
console.log(`assets/catalog.enc.js gerado (${(data.length / 1024).toFixed(0)} KB criptografados)`);
