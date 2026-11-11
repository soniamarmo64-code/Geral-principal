/* Cantinho do Amigurumi — página de abertura e senha de acesso.
 * O catálogo de receitas (assets/catalog.enc.js) é criptografado com AES-GCM;
 * a senha gera a chave (PBKDF2) e só então os nomes e links das receitas
 * ficam disponíveis no navegador. */
(function () {
  "use strict";

  // ---------- Ilustrações de amigurumi (SVG desenhado à mão) ----------
  // Cada forma é desenhada duas vezes: a cor e, por cima, a textura de pontinhos de crochê.
  const DARK = "#3b2a24";
  const CHEEK = "#f29aa8";
  const st = (tag, attrs, stitch = true) => {
    const a = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ");
    let out = `<${tag} ${a}/>`;
    if (stitch) {
      const t = Object.entries(attrs)
        .filter(([k]) => !["fill", "stroke"].includes(k))
        .map(([k, v]) => `${k}="${v}"`).join(" ");
      out += attrs.stroke && attrs.fill === "none"
        ? `<${tag} ${t} fill="none" stroke="url(#st)"/>`
        : `<${tag} ${t} fill="url(#st)"/>`;
    }
    return out;
  };
  const eyes = (y, dx = 14, cx = 60, r = 4.4) =>
    [cx - dx, cx + dx].map((x) =>
      `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.1}" fill="${DARK}"/><circle cx="${x + 1.4}" cy="${y - 1.6}" r="1.4" fill="#fff"/>`
    ).join("");
  const cheeks = (y, dx = 22, cx = 60) =>
    [cx - dx, cx + dx].map((x) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.8" fill="${CHEEK}" opacity=".7"/>`).join("");
  const smile = (y, cx = 60) => `<path d="M${cx - 5} ${y} q5 5 10 0" fill="none" stroke="${DARK}" stroke-width="2" stroke-linecap="round"/>`;
  const shadow = `<ellipse cx="60" cy="137" rx="38" ry="4" fill="#000" opacity=".08"/>`;

  const bear = (c = "#c99a72", l = "#efd9c2") => [
    shadow,
    st("circle", { cx: 30, cy: 30, r: 13, fill: c }), st("circle", { cx: 90, cy: 30, r: 13, fill: c }),
    `<circle cx="30" cy="30" r="6" fill="${l}"/><circle cx="90" cy="30" r="6" fill="${l}"/>`,
    st("ellipse", { cx: 28, cy: 100, rx: 9, ry: 15, fill: c, transform: "rotate(25 28 100)" }),
    st("ellipse", { cx: 92, cy: 100, rx: 9, ry: 15, fill: c, transform: "rotate(-25 92 100)" }),
    st("ellipse", { cx: 60, cy: 106, rx: 32, ry: 29, fill: c }),
    st("ellipse", { cx: 60, cy: 111, rx: 19, ry: 16, fill: l }),
    st("ellipse", { cx: 42, cy: 131, rx: 12, ry: 7, fill: c }), st("ellipse", { cx: 78, cy: 131, rx: 12, ry: 7, fill: c }),
    st("circle", { cx: 60, cy: 55, r: 35, fill: c }),
    st("ellipse", { cx: 60, cy: 67, rx: 14, ry: 10, fill: l }),
    `<ellipse cx="60" cy="63" rx="5" ry="3.6" fill="${DARK}"/>`,
    `<path d="M60 66 v3 M55 70 q5 4 10 0" fill="none" stroke="${DARK}" stroke-width="1.8" stroke-linecap="round"/>`,
    eyes(52), cheeks(64, 24),
  ].join("");

  const bunny = (c = "#fbeef0", inner = "#f4b9c7") => [
    shadow,
    st("ellipse", { cx: 45, cy: 30, rx: 10, ry: 27, fill: c, transform: "rotate(-10 45 30)" }),
    st("ellipse", { cx: 75, cy: 30, rx: 10, ry: 27, fill: c, transform: "rotate(10 75 30)" }),
    `<ellipse cx="45" cy="32" rx="4.5" ry="18" fill="${inner}" transform="rotate(-10 45 32)"/>`,
    `<ellipse cx="75" cy="32" rx="4.5" ry="18" fill="${inner}" transform="rotate(10 75 32)"/>`,
    st("ellipse", { cx: 60, cy: 108, rx: 29, ry: 27, fill: c }),
    st("ellipse", { cx: 36, cy: 104, rx: 8, ry: 13, fill: c, transform: "rotate(20 36 104)" }),
    st("ellipse", { cx: 84, cy: 104, rx: 8, ry: 13, fill: c, transform: "rotate(-20 84 104)" }),
    st("ellipse", { cx: 44, cy: 131, rx: 11, ry: 7, fill: c }), st("ellipse", { cx: 76, cy: 131, rx: 11, ry: 7, fill: c }),
    st("circle", { cx: 60, cy: 64, r: 31, fill: c }),
    // laço
    `<path d="M60 40 l-14 -8 v16 z M60 40 l14 -8 v16 z" fill="#e8798f"/><circle cx="60" cy="40" r="4" fill="#d9607a"/>`,
    `<path d="M57 70 h6 l-3 3.5 z" fill="#e8798f"/>`, smile(75), eyes(63, 12), cheeks(72, 20),
  ].join("");

  const cat = (c = "#f4b47c", d = "#e08f55", l = "#fde7d2") => [
    shadow,
    `<path d="M86 118 q30 -6 22 -34" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>`,
    `<path d="M86 118 q30 -6 22 -34" fill="none" stroke="url(#st)" stroke-width="10" stroke-linecap="round"/>`,
    st("ellipse", { cx: 60, cy: 108, rx: 29, ry: 27, fill: c }),
    st("ellipse", { cx: 60, cy: 113, rx: 16, ry: 15, fill: l }),
    st("ellipse", { cx: 44, cy: 131, rx: 11, ry: 7, fill: c }), st("ellipse", { cx: 76, cy: 131, rx: 11, ry: 7, fill: c }),
    st("path", { d: "M28 44 L33 12 L56 30 Z", fill: c, "stroke-linejoin": "round" }),
    st("path", { d: "M92 44 L87 12 L64 30 Z", fill: c, "stroke-linejoin": "round" }),
    `<path d="M33 36 L36 20 L47 30 Z M87 36 L84 20 L73 30 Z" fill="#f6a7b4"/>`,
    st("circle", { cx: 60, cy: 58, r: 33, fill: c }),
    `<path d="M52 28 v8 M60 26 v10 M68 28 v8" stroke="${d}" stroke-width="3.2" stroke-linecap="round"/>`,
    `<path d="M57 66 h6 l-3 3 z" fill="#e8798f"/>`,
    `<path d="M60 69 v2 M55 72 q2.5 3 5 0 q2.5 3 5 0" fill="none" stroke="${DARK}" stroke-width="1.6" stroke-linecap="round"/>`,
    `<path d="M24 64 l14 2 M24 72 l14 -2 M96 64 l-14 2 M96 72 l-14 -2" stroke="${DARK}" stroke-width="1.2" opacity=".55" stroke-linecap="round"/>`,
    eyes(57, 14), cheeks(68, 22),
  ].join("");

  const octopus = (c = "#c9b6ea") => {
    const legs = [
      "M34 92 q-10 22 4 36 q8 6 10 -3",
      "M50 96 q-4 24 -10 34",
      "M70 96 q4 24 10 34",
      "M86 92 q10 22 -4 36 q-8 6 -10 -3",
    ];
    return [
      shadow,
      ...legs.map((d) =>
        `<path d="${d}" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>` +
        `<path d="${d}" fill="none" stroke="url(#st)" stroke-width="12" stroke-linecap="round"/>`),
      st("ellipse", { cx: 60, cy: 66, rx: 38, ry: 38, fill: c }),
      st("rect", { x: 22, y: 66, width: 76, height: 30, rx: 14, fill: c }),
      // florzinha
      `<g transform="translate(84 34)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-6" rx="4" ry="6" fill="#fff6c9" transform="rotate(${a})"/>`).join("")}<circle r="3.5" fill="#f4c542"/></g>`,
      eyes(72, 14), cheeks(82, 24), smile(82),
    ].join("");
  };

  const chick = (c = "#f8d76b", o = "#f29b4b") => [
    shadow,
    `<path d="M48 130 v6 M44 136 h8 M72 130 v6 M68 136 h8" stroke="${o}" stroke-width="3.2" stroke-linecap="round"/>`,
    st("path", { d: "M60 22 q-6 -12 -14 -8 q8 2 6 10 q2 -12 10 -12 q-4 6 -2 10", fill: c, transform: "translate(0 20)" }),
    st("ellipse", { cx: 60, cy: 86, rx: 40, ry: 46, fill: c }),
    st("ellipse", { cx: 22, cy: 92, rx: 9, ry: 16, fill: c, transform: "rotate(20 22 92)" }),
    st("ellipse", { cx: 98, cy: 92, rx: 9, ry: 16, fill: c, transform: "rotate(-20 98 92)" }),
    `<path d="M53 74 L67 74 L60 83 Z" fill="${o}" stroke="${o}" stroke-width="2" stroke-linejoin="round"/>`,
    eyes(66, 14), cheeks(78, 24),
  ].join("");

  const yarn = (c = "#e8798f") => [
    `<ellipse cx="60" cy="137" rx="30" ry="4" fill="#000" opacity=".08"/>`,
    `<path d="M88 120 q20 10 30 -4" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
    `<circle cx="60" cy="104" r="32" fill="${c}"/>`,
    `<path d="M32 92 q28 -16 56 0 M30 106 q30 -18 60 0 M34 120 q26 -14 52 -2 M48 74 q-16 30 0 60 M66 72 q-20 34 4 62 M80 80 q-14 26 2 48"
      fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.2" stroke-linecap="round"/>`,
    // agulha de crochê
    `<g transform="rotate(-35 60 104)"><rect x="57" y="40" width="6" height="96" rx="3" fill="#a8c7e8"/><path d="M57 42 q3 -8 6 0" fill="#a8c7e8"/></g>`,
  ].join("");

  const svg = (inner, label) =>
    `<svg viewBox="0 0 120 140" role="img" aria-label="${label}">${inner}</svg>`;

  const art = document.getElementById("landing-art");
  if (art) {
    art.innerHTML = `
      <svg width="0" height="0" style="position:absolute">
        <defs>
          <pattern id="st" width="7" height="6" patternUnits="userSpaceOnUse">
            <path d="M0.8 0.8 L3.5 4.6 L6.2 0.8" fill="none" stroke="#000" stroke-opacity=".09" stroke-width="1.1" stroke-linecap="round"/>
          </pattern>
        </defs>
      </svg>
      <div class="ami ami--1">${svg(bunny(), "Coelhinha de crochê")}</div>
      <div class="ami ami--2">${svg(bear(), "Ursinho de crochê")}</div>
      <div class="ami ami--3">${svg(cat(), "Gatinho de crochê")}</div>
      <div class="ami ami--4">${svg(octopus(), "Polvinho de crochê")}</div>
      <div class="ami ami--5">${svg(chick(), "Pintinho de crochê")}</div>
      <div class="ami ami--6">${svg(yarn(), "Novelo de lã")}</div>`;
  }

  // ---------- Senha ----------
  const KEY = "cantinho:key";
  const enc = window.CATALOG_ENC;
  const landing = document.getElementById("landing");
  const app = document.getElementById("app");
  const form = document.getElementById("gate");
  const pw = document.getElementById("gate-pw");
  const btn = document.getElementById("gate-btn");
  const msg = document.getElementById("gate-msg");
  const remember = document.getElementById("gate-remember");
  const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const b64e = (u) => btoa(String.fromCharCode(...new Uint8Array(u)));
  const ls = {
    get: (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* modo privado */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (_) { /* modo privado */ } },
  };

  async function decryptWith(key) {
    const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(enc.iv) }, key, b64d(enc.data));
    return JSON.parse(new TextDecoder().decode(buf));
  }
  async function deriveKey(password) {
    const base = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64d(enc.salt), iterations: enc.iter, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
  }

  let started = false;
  function enter(catalog) {
    landing.hidden = true;
    app.hidden = false;
    if (!started) {
      started = true;
      window.startCatalog(catalog);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    if (!window.crypto?.subtle) {
      msg.textContent = "Este navegador não consegue abrir o cantinho. Tente pelo Chrome ou Safari atualizados.";
      return;
    }
    btn.disabled = true;
    btn.textContent = "Abrindo…";
    try {
      const key = await deriveKey(pw.value.trim());
      const catalog = await decryptWith(key);
      if (remember.checked) ls.set(KEY, b64e(await crypto.subtle.exportKey("raw", key)));
      pw.value = "";
      enter(catalog);
    } catch (_) {
      msg.textContent = "Senha incorreta. Confira e tente de novo.";
      form.classList.remove("shake");
      void form.offsetWidth;
      form.classList.add("shake");
      pw.select();
    } finally {
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    ls.del(KEY);
    location.replace(location.pathname + location.search);
  });

  // Entrada automática se a senha foi lembrada neste aparelho
  (async () => {
    const saved = ls.get(KEY);
    if (!saved || !window.crypto?.subtle) return;
    try {
      const key = await crypto.subtle.importKey("raw", b64d(saved), "AES-GCM", false, ["decrypt"]);
      enter(await decryptWith(key));
    } catch (_) {
      ls.del(KEY); // catálogo foi atualizado com outra senha
    }
  })();
})();
