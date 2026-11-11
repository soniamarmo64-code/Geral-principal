#!/usr/bin/env node
/*
 * Criptografa o catálogo POR CATEGORIA.
 *
 *   MASTER_CODE="MESTRE-XXXX-XXXX-XXXX" node scripts/encrypt_catalog.mjs [--rotate natal,coelhos]
 *
 * - Cada categoria tem uma chave AES própria; as receitas dela são criptografadas com essa chave.
 * - Cada categoria tem um código de acesso (ex.: NATAL-7K4Q-9XPM). O código "abre" só a chave dela.
 * - O código mestre abre a chave de todas as categorias.
 * - Códigos e chaves ficam em secrets.enc.json, criptografado com o código mestre,
 *   para que atualizações futuras mantenham os mesmos códigos.
 * - --rotate troca o código (e a chave) das categorias indicadas: o código antigo deixa de funcionar.
 * - Sem MASTER_CODE e sem secrets.enc.json, um código mestre novo é gerado.
 *
 * Saídas: assets/catalog.enc.js (público), secrets.enc.json (público, criptografado)
 *         e data/codigos.txt (privado, lista legível dos códigos para a dona).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ITER = 310000;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I para não confundir
const enc = new TextEncoder();
const b64 = (u) => Buffer.from(u).toString("base64");
const unb64 = (s) => new Uint8Array(Buffer.from(s, "base64"));
const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
const normCode = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function randomChunk(len) {
  const bytes = rand(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
const newCode = (prefix) => `${prefix}-${randomChunk(4)}-${randomChunk(4)}`;
const prefixFor = (id) => fold(id).toUpperCase().replace(/[^A-Z]/g, "");

async function deriveKey(code, salt, usage) {
  const base = await crypto.subtle.importKey("raw", enc.encode(normCode(code)), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, usage);
}
async function aesEncrypt(key, bytes) {
  const iv = rand(12);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
  return { iv: b64(iv), d: b64(data) };
}
async function aesDecrypt(key, box) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, key, unb64(box.d)));
}
const importRaw = (raw, usage) => crypto.subtle.importKey("raw", raw, "AES-GCM", false, usage);

// ---------- argumentos ----------
const rotateArg = process.argv.find((a) => a.startsWith("--rotate"));
const rotate = new Set(
  rotateArg ? (rotateArg.includes("=") ? rotateArg.split("=")[1] : process.argv[process.argv.indexOf(rotateArg) + 1] || "")
    .split(",").map((s) => s.trim()).filter(Boolean) : []
);

// ---------- segredos (códigos + chaves) ----------
const secretsPath = join(root, "secrets.enc.json");
let master = process.env.MASTER_CODE;
let secrets = { codes: {}, keys: {} };
if (existsSync(secretsPath)) {
  if (!master) {
    console.error("secrets.enc.json existe: informe MASTER_CODE para manter os códigos atuais.");
    process.exit(1);
  }
  const box = JSON.parse(readFileSync(secretsPath, "utf8"));
  const k = await deriveKey(master, unb64(box.salt), ["decrypt"]);
  try {
    secrets = JSON.parse(new TextDecoder().decode(await aesDecrypt(k, box)));
  } catch {
    console.error("Código mestre incorreto.");
    process.exit(1);
  }
} else if (!master) {
  master = `MESTRE-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`;
  console.log("Código mestre novo gerado.");
}

// ---------- catálogo ----------
const catalog = JSON.parse(readFileSync(join(root, "data", "catalog.json"), "utf8"));
const salt = rand(16);
const masterKey = await deriveKey(master, salt, ["encrypt"]);
const out = { v: 2, iter: ITER, salt: b64(salt), generated: catalog.generated, total: catalog.recipes.length, categories: [], blobs: {}, wraps: {} };

for (const cat of catalog.categories) {
  const recipes = catalog.recipes.filter((r) => r.c.includes(cat.id));
  if (!recipes.length) continue;
  if (!secrets.codes[cat.id] || rotate.has(cat.id)) {
    secrets.codes[cat.id] = newCode(prefixFor(cat.id));
    secrets.keys[cat.id] = b64(rand(32));
  }
  const raw = unb64(secrets.keys[cat.id]);
  const catKey = await importRaw(raw, ["encrypt"]);
  out.blobs[cat.id] = await aesEncrypt(catKey, enc.encode(JSON.stringify(recipes)));
  const codeKey = await deriveKey(secrets.codes[cat.id], salt, ["encrypt"]);
  out.wraps[cat.id] = [await aesEncrypt(codeKey, raw), await aesEncrypt(masterKey, raw)];
  out.categories.push({ ...cat, n: recipes.length });
}

writeFileSync(
  join(root, "assets", "catalog.enc.js"),
  "/* Catálogo criptografado por categoria — gerado por scripts/encrypt_catalog.mjs */\n" +
    `window.CATALOG_ENC=${JSON.stringify(out)};\n`
);

// segredos criptografados com o código mestre
const sSalt = rand(16);
const sKey = await deriveKey(master, sSalt, ["encrypt"]);
writeFileSync(secretsPath, JSON.stringify({ salt: b64(sSalt), ...(await aesEncrypt(sKey, enc.encode(JSON.stringify(secrets)))) }) + "\n");

// lista legível (privada)
mkdirSync(join(root, "data"), { recursive: true });
const lines = [
  "CÓDIGOS DE ACESSO — Cantinho do Amigurumi",
  "(guarde em lugar seguro; não compartilhe o código mestre)",
  "",
  `CÓDIGO MESTRE (abre tudo): ${master}`,
  "",
  ...out.categories.map((c) => `${c.emoji} ${c.name} (${c.n} receitas): ${secrets.codes[c.id]}`),
  "",
];
writeFileSync(join(root, "data", "codigos.txt"), lines.join("\n"));
console.log(`assets/catalog.enc.js gerado com ${out.categories.length} categorias.`);
if (rotate.size) console.log("Códigos trocados:", [...rotate].join(", "));
console.log("Lista de códigos em data/codigos.txt");
