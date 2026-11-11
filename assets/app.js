/* Cantinho do Amigurumi — lógica do site (sem dependências) */
(function () {
  "use strict";

  const { categories, recipes, generated } = window.CATALOG;
  const PAGE = 48;
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const byId = new Map(recipes.map((r) => [r.id, r]));

  // ---------- armazenamento local (favoritas, feitas, notas…) ----------
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("cantinho:" + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (_) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("cantinho:" + key, JSON.stringify(value)); } catch (_) { /* modo privado */ }
    },
  };
  const favs = new Set(store.get("favs", []));
  const done = new Set(store.get("done", []));
  let recent = store.get("recent", []);
  const notes = store.get("notes", {});
  const counters = store.get("counters", {});

  // ---------- utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtSize = (b) => (b > 1e6 ? (b / 1e6).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");
  const fmtDate = (d) => (d ? d.split("-").reverse().join("/") : "—");
  const drive = {
    view: (id) => `https://drive.google.com/file/d/${id}/view`,
    preview: (id) => `https://drive.google.com/file/d/${id}/preview`,
    thumb: (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w400`,
  };

  // Texto de busca pré-calculado (nome + nome do arquivo + categorias + idioma)
  for (const r of recipes) {
    r._q = fold([r.t, r.o, r.l, r.f, ...r.c.map((c) => catById[c]?.name || "")].join(" "));
    r._s = fold(r.t);
    r._n = /^\d/.test(r._s) ? 1 : 0; // nomes que começam com número vão para o fim
  }

  // ---------- estado ----------
  const state = { q: "", cat: "", tab: "all", lang: "", sort: "az" };
  let filtered = [];
  let shown = 0;

  // ---------- elementos ----------
  const grid = $("#grid");
  const chipsEl = $("#chips");
  const searchEl = $("#search");
  const clearEl = $("#search-clear");
  const countEl = $("#result-count");
  const emptyEl = $("#empty");
  const sentinel = $("#sentinel");
  const langEl = $("#lang");
  const sortEl = $("#sort");

  $("#total-count").textContent = `${recipes.length.toLocaleString("pt-BR")} receitas de crochê`;
  $("#generated").textContent = `Catálogo atualizado em ${fmtDate(generated)}`;

  // Idiomas disponíveis
  const langs = {};
  recipes.forEach((r) => (langs[r.l] = (langs[r.l] || 0) + 1));
  Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .forEach(([l, n]) => langEl.insertAdjacentHTML("beforeend", `<option value="${esc(l)}">${esc(l)} (${n})</option>`));

  // ---------- filtros ----------
  function baseList() {
    if (state.tab === "fav") return recipes.filter((r) => favs.has(r.id));
    if (state.tab === "done") return recipes.filter((r) => done.has(r.id));
    if (state.tab === "recent") return recent.map((id) => byId.get(id)).filter(Boolean);
    return recipes;
  }

  function applyFilters() {
    const words = fold(state.q).split(/\s+/).filter(Boolean);
    let list = baseList().filter(
      (r) =>
        (!state.cat || r.c.includes(state.cat)) &&
        (!state.lang || r.l === state.lang) &&
        words.every((w) => r._q.includes(w))
    );
    if (state.tab !== "recent") {
      const cmp = {
        az: (a, b) => a._n - b._n || a._s.localeCompare(b._s, "pt-BR"),
        za: (a, b) => b._n - a._n || b._s.localeCompare(a._s, "pt-BR"),
        new: (a, b) => (b.d || "").localeCompare(a.d || "") || a._s.localeCompare(b._s, "pt-BR"),
        old: (a, b) => (a.d || "").localeCompare(b.d || "") || a._s.localeCompare(b._s, "pt-BR"),
      }[state.sort];
      list = list.slice().sort(cmp);
    }
    filtered = list;
    renderChips();
    renderGrid(true);
  }

  // ---------- chips de categoria ----------
  function renderChips() {
    const words = fold(state.q).split(/\s+/).filter(Boolean);
    const pool = baseList().filter((r) => (!state.lang || r.l === state.lang) && words.every((w) => r._q.includes(w)));
    const counts = {};
    pool.forEach((r) => r.c.forEach((c) => (counts[c] = (counts[c] || 0) + 1)));
    const html = [
      `<button class="chip ${state.cat ? "" : "is-active"}" data-cat="" role="listitem" type="button">🧶 Todas <span class="chip__n">${pool.length}</span></button>`,
    ];
    for (const c of categories) {
      const n = counts[c.id] || 0;
      if (!n && state.cat !== c.id) continue;
      html.push(
        `<button class="chip ${state.cat === c.id ? "is-active" : ""}" data-cat="${c.id}" role="listitem" type="button">${c.emoji} ${esc(c.name)} <span class="chip__n">${n}</span></button>`
      );
    }
    chipsEl.innerHTML = html.join("");
  }

  // ---------- grade ----------
  function cardHTML(r) {
    const cat = catById[r.c[0]] || catById.outros;
    const isFav = favs.has(r.id);
    const tags = [`<span class="tag">${cat.emoji} ${esc(cat.name)}</span>`];
    if (r.l !== "Português") tags.push(`<span class="tag tag--lang">${esc(r.l)}</span>`);
    if (done.has(r.id)) tags.push(`<span class="tag tag--done">✓ feita</span>`);
    return `
      <a class="card" href="#r=${r.id}" data-id="${r.id}" style="--c:${cat.color}">
        <div class="card__thumb">
          <span class="card__emoji" aria-hidden="true">${cat.emoji}</span>
          <img class="card__img" data-src="${drive.thumb(r.id)}" alt="" loading="lazy" referrerpolicy="no-referrer">
        </div>
        <button class="card__fav" type="button" data-fav="${r.id}" aria-pressed="${isFav}"
                aria-label="${isFav ? "Remover das favoritas" : "Favoritar"}">${isFav ? "♥" : "♡"}</button>
        <div class="card__body">
          <h3 class="card__title">${esc(r.t)}</h3>
          <div class="card__meta">${tags.join("")}</div>
        </div>
      </a>`;
  }

  // As miniaturas vêm do Google Drive; só aparecem se o navegador tiver acesso
  // (logado na conta dona da pasta, ou pasta compartilhada por link).
  // Se falharem, o card fica com o desenho da categoria.
  let thumbsBroken = 0;
  function hydrateImages(root) {
    root.querySelectorAll("img[data-src]").forEach((img) => {
      if (thumbsBroken > 12) { img.remove(); return; }
      img.onload = () => {
        if (img.naturalWidth > 20) img.classList.add("is-loaded");
        else img.remove();
      };
      img.onerror = () => { thumbsBroken++; img.remove(); };
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    });
  }

  function renderGrid(reset) {
    if (reset) {
      grid.innerHTML = "";
      shown = 0;
      window.scrollTo({ top: 0 });
    }
    const next = filtered.slice(shown, shown + PAGE);
    if (next.length) {
      const frag = document.createElement("template");
      frag.innerHTML = next.map(cardHTML).join("");
      const nodes = frag.content;
      hydrateImages(nodes);
      grid.appendChild(nodes);
      shown += next.length;
    }
    const total = filtered.length;
    countEl.textContent =
      total === 0 ? "Nenhuma receita" : `${total.toLocaleString("pt-BR")} ${total === 1 ? "receita" : "receitas"}`;
    emptyEl.hidden = total !== 0;
    if (total === 0) emptyEl.innerHTML = emptyMessage();
  }

  function emptyMessage() {
    if (state.tab === "fav" && !favs.size)
      return `<div class="empty__big">💕</div><h3>Nenhuma favorita ainda</h3><p>Toque no ♡ de uma receita para guardar aqui.</p>`;
    if (state.tab === "done" && !done.size)
      return `<div class="empty__big">🧸</div><h3>Nenhuma receita marcada como feita</h3><p>Abra uma receita e toque em “Marcar como feita”.</p>`;
    if (state.tab === "recent" && !recent.length)
      return `<div class="empty__big">🕘</div><h3>Você ainda não abriu nenhuma receita</h3>`;
    return `<div class="empty__big">🔍</div><h3>Não encontrei nada</h3><p>Tente outra palavra ou escolha “Todas”.</p>`;
  }

  // Rolagem infinita
  new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && shown < filtered.length) renderGrid(false);
    },
    { rootMargin: "800px" }
  ).observe(sentinel);

  // ---------- contadores das abas ----------
  function renderTabCounts() {
    $("#n-fav").textContent = favs.size || "";
    $("#n-done").textContent = done.size || "";
    $("#n-recent").textContent = recent.length || "";
  }

  function toggleFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id);
    store.set("favs", [...favs]);
    renderTabCounts();
    document.querySelectorAll(`[data-fav="${id}"]`).forEach((b) => {
      const on = favs.has(id);
      b.setAttribute("aria-pressed", on);
      b.textContent = on ? "♥" : "♡";
      b.setAttribute("aria-label", on ? "Remover das favoritas" : "Favoritar");
    });
    if (state.tab === "fav") applyFilters();
  }

  // ---------- eventos da lista ----------
  let searchTimer;
  searchEl.addEventListener("input", () => {
    clearEl.hidden = !searchEl.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.q = searchEl.value.trim();
      applyFilters();
    }, 160);
  });
  clearEl.addEventListener("click", () => {
    searchEl.value = "";
    clearEl.hidden = true;
    state.q = "";
    applyFilters();
    searchEl.focus();
  });
  chipsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    state.cat = b.dataset.cat;
    applyFilters();
    b.scrollIntoView?.({ inline: "nearest", block: "nearest" });
  });
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("is-active", x === t));
      state.tab = t.dataset.tab;
      applyFilters();
    })
  );
  langEl.addEventListener("change", () => { state.lang = langEl.value; applyFilters(); });
  sortEl.addEventListener("change", () => { state.sort = sortEl.value; applyFilters(); });
  grid.addEventListener("click", (e) => {
    const fav = e.target.closest("[data-fav]");
    if (fav) {
      e.preventDefault();
      toggleFav(fav.dataset.fav);
    }
  });
  $("#random-btn").addEventListener("click", () => {
    const pool = filtered.length ? filtered : recipes;
    location.hash = "r=" + pool[Math.floor(Math.random() * pool.length)].id;
  });
  $("#home-link").addEventListener("click", (e) => {
    e.preventDefault();
    Object.assign(state, { q: "", cat: "", tab: "all", lang: "" });
    searchEl.value = "";
    clearEl.hidden = true;
    langEl.value = "";
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("is-active", x.dataset.tab === "all"));
    if (location.hash) history.pushState("", "", location.pathname + location.search);
    closeSheet();
    applyFilters();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      searchEl.focus();
    } else if (e.key === "Escape" && !sheet.hidden) {
      goBack();
    }
  });

  // ---------- página da receita ----------
  const sheet = $("#sheet");
  const frame = $("#d-frame");
  const favBtn = $("#d-fav");
  const doneBtn = $("#d-done");
  const notesEl = $("#d-notes");
  const notesStatus = $("#d-notes-status");
  const cValue = $("#c-value");
  let current = null;
  let lastFocus = null;

  function openSheet(id) {
    const r = byId.get(id);
    if (!r) return;
    current = r;
    lastFocus = document.activeElement;

    $("#d-title").textContent = r.t;
    $("#d-original").textContent = r.o ? `Arquivo: ${r.o}` : "";
    document.title = `${r.t} · Cantinho do Amigurumi`;

    $("#d-tags").innerHTML =
      r.c.map((c) => catById[c]).filter(Boolean)
        .map((c) => `<button class="chip" type="button" data-goto-cat="${c.id}">${c.emoji} ${esc(c.name)}</button>`)
        .join("") + (r.l !== "Português" ? `<span class="tag tag--lang">${esc(r.l)}</span>` : "");

    $("#d-open").href = drive.view(r.id);
    $("#d-hint").hidden = false;
    frame.src = drive.preview(r.id);

    syncFav();
    syncDone();
    notesEl.value = notes[r.id] || "";
    notesStatus.textContent = "Salvo automaticamente neste aparelho.";
    cValue.textContent = counters[r.id] || 0;

    $("#d-meta").innerHTML = `
      <dt>Formato</dt><dd>${r.k === "pdf" ? "PDF" : "Documento do Word"} · ${fmtSize(r.s)}</dd>
      <dt>Pasta</dt><dd>${esc(r.f || "—")}</dd>
      <dt>Adicionada</dt><dd>${fmtDate(r.d)}</dd>`;

    recent = [r.id, ...recent.filter((x) => x !== r.id)].slice(0, 40);
    store.set("recent", recent);
    renderTabCounts();

    sheet.hidden = false;
    document.body.classList.add("no-scroll");
    $(".sheet__head [data-close]").focus({ preventScroll: true });
  }

  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true;
    frame.src = "about:blank";
    document.body.classList.remove("no-scroll");
    document.title = "Cantinho do Amigurumi";
    current = null;
    if (state.tab === "recent" || state.tab === "done") applyFilters();
    lastFocus?.focus?.({ preventScroll: true });
  }

  function goBack() {
    if (history.state && history.state.fromList) history.back();
    else {
      history.pushState("", "", location.pathname + location.search);
      closeSheet();
    }
  }

  frame.addEventListener("load", () => {
    if (frame.src.startsWith("https://")) $("#d-hint").hidden = true;
  });
  sheet.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) goBack();
    const goto = e.target.closest("[data-goto-cat]");
    if (goto) {
      state.cat = goto.dataset.gotoCat;
      state.tab = "all";
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("is-active", x.dataset.tab === "all"));
      goBack();
      applyFilters();
    }
  });

  function syncFav() {
    const on = favs.has(current.id);
    favBtn.setAttribute("aria-pressed", on);
    favBtn.textContent = on ? "♥" : "♡";
    favBtn.setAttribute("aria-label", on ? "Remover das favoritas" : "Favoritar");
  }
  function syncDone() {
    const on = done.has(current.id);
    doneBtn.setAttribute("aria-pressed", on);
    doneBtn.textContent = on ? "✅ Feita!" : "✅ Já fiz";
  }
  favBtn.addEventListener("click", () => { toggleFav(current.id); syncFav(); });
  doneBtn.addEventListener("click", () => {
    done.has(current.id) ? done.delete(current.id) : done.add(current.id);
    store.set("done", [...done]);
    syncDone();
    renderTabCounts();
    const card = grid.querySelector(`[data-id="${current.id}"]`);
    if (card) card.outerHTML = cardHTML(current);
  });

  let notesTimer;
  notesEl.addEventListener("input", () => {
    clearTimeout(notesTimer);
    notesStatus.textContent = "Salvando…";
    notesTimer = setTimeout(() => {
      const v = notesEl.value.trim();
      if (v) notes[current.id] = notesEl.value; else delete notes[current.id];
      store.set("notes", notes);
      notesStatus.textContent = "✓ Anotação salva neste aparelho.";
    }, 400);
  });

  function setCounter(n) {
    n = Math.max(0, n);
    cValue.textContent = n;
    if (n) counters[current.id] = n; else delete counters[current.id];
    store.set("counters", counters);
  }
  $("#c-plus").addEventListener("click", () => setCounter((counters[current.id] || 0) + 1));
  $("#c-minus").addEventListener("click", () => setCounter((counters[current.id] || 0) - 1));
  $("#c-reset").addEventListener("click", () => setCounter(0));

  // ---------- rotas (#r=ID abre a receita; voltar fecha) ----------
  grid.addEventListener("click", (e) => {
    const card = e.target.closest("a.card");
    if (!card || e.target.closest("[data-fav]") || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    history.pushState({ fromList: true }, "", "#r=" + card.dataset.id);
    openSheet(card.dataset.id);
  });
  function route() {
    const m = location.hash.match(/^#r=([\w-]+)/);
    if (m) openSheet(m[1]);
    else closeSheet();
  }
  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);

  // ---------- início ----------
  renderTabCounts();
  applyFilters();
  route();
})();
