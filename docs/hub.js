// Lógica do Hub de Painéis. A parte de cima (HubLib) não mexe na página e é a que os
// testes exercitam; a de baixo desenha os botões e o editor de links.
(function (global) {
  "use strict";

  // As cores de cada painel existente (as mesmas dos painéis).
  const CORES = {
    executivo: { c1: "#0B3B66", c2: "#146B88" },
    poscorte: { c1: "#0f2a5c", c2: "#1e4fd6" },
    cadastro: { c1: "#5b21b6", c2: "#7c3aed" }, // roxo: cor própria, diferente do azul-petróleo do Executivo e do azul do Pós-Corte
  };
  const PALETA_EXTRA = [
    { c1: "#0b5d4f", c2: "#17a58a" },
    { c1: "#5b21b6", c2: "#7c3aed" },
    { c1: "#9a3412", c2: "#ea580c" },
  ];
  const ICONES = ["grafico", "prancheta", "link"];
  const MAX_LINKS = 24;

  // Só http(s): nada de javascript:, data: etc.
  function urlValida(texto) {
    try {
      const u = new URL(String(texto == null ? "" : texto).trim());
      return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
    } catch {
      return null;
    }
  }

  // A logo: um arquivo da própria pasta (logo.png) ou um endereço https/http de imagem.
  function imagemValida(texto) {
    const t = String(texto == null ? "" : texto).trim();
    if (!t) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return urlValida(t) || "";
    if (t.startsWith("//") || t.includes("..")) return "";
    return /^[\w./-]+\.(png|jpe?g|svg|webp|gif)$/i.test(t) ? t : "";
  }

  function normalizar(cfg, padrao) {
    const base = cfg && typeof cfg === "object" ? cfg : padrao || {};
    const usados = new Set();
    const links = (Array.isArray(base.links) ? base.links : []).slice(0, MAX_LINKS).map((l, i) => {
      const item = l && typeof l === "object" ? l : {};
      let id = String(item.id || `painel-${i + 1}`).trim().replace(/\s+/g, "-") || `painel-${i + 1}`;
      while (usados.has(id)) id += "-2";
      usados.add(id);
      return {
        id,
        titulo: String(item.titulo || "Painel").slice(0, 60),
        descricao: String(item.descricao || "").slice(0, 160),
        url: urlValida(item.url) || "",
        cor: String(item.cor || ""),
        icone: ICONES.includes(item.icone) ? item.icone : "link",
        novaAba: item.novaAba !== false, // abrir em outra aba é o padrão: o Hub fica aberto
      };
    });
    const opac = Number(base.logoOpacidade);
    return {
      titulo: String(base.titulo || (padrao && padrao.titulo) || "Hub de Painéis"),
      subtitulo: String(base.subtitulo || ""),
      logo: imagemValida(base.logo),
      logoOpacidade: Number.isFinite(opac) ? Math.min(0.3, Math.max(0.02, opac)) : 0.07,
      links,
    };
  }

  function corDoLink(link, i) {
    if (CORES[link.cor]) return CORES[link.cor];
    if (/^#[0-9a-f]{6}$/i.test(link.cor)) return { c1: link.cor, c2: link.cor };
    return PALETA_EXTRA[i % PALETA_EXTRA.length];
  }

  // O texto do arquivo docs/paineis.js que corresponde a uma configuração.
  function textoDaConfiguracao(cfg) {
    return `window.HUB_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;
  }

  // O editor de links só aparece para quem abre o Hub com ?editar no endereço. Não é senha:
  // o que vale para todos só muda por commit no repositório; o editor só mexe na cópia
  // do próprio navegador. Esconder evita que um colega "edite" achando que vale para todos.
  function modoEdicao(busca) {
    try {
      return new URLSearchParams(String(busca || "")).has("editar");
    } catch {
      return false;
    }
  }

  global.HubLib = { CORES, urlValida, imagemValida, normalizar, corDoLink, textoDaConfiguracao, modoEdicao };

  if (typeof document === "undefined") return;

  // ---------------------------------------------------------------- a página
  const STORAGE_KEY = "hub-paineis:config:v1";
  const SVG_ICONES = {
    grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    prancheta: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 14l2 2 4-4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  };
  // Só strings fixas daqui entram como HTML; nenhum texto da configuração entra.
  const svg = (nome, tam) =>
    `<svg viewBox="0 0 24 24" width="${tam || 24}" height="${tam || 24}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG_ICONES[nome] || SVG_ICONES.link}</svg>`;
  const SETA =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

  const modoEditar = modoEdicao(location.search);
  const padrao = normalizar(global.HUB_CONFIG, { titulo: "Hub de Painéis" });
  const lerSalva = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const gravar = (cfg) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      return true;
    } catch {
      return false;
    }
  };
  const apagarSalva = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sem armazenamento: nada a apagar */
    }
  };

  const salva = lerSalva();
  let personalizada = Boolean(salva);
  let config = salva ? normalizar(salva, padrao) : padrao;
  const host = (u) => {
    try {
      return new URL(u).host;
    } catch {
      return "";
    }
  };

  function el(tag, props, ...filhos) {
    const e = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    filhos.forEach((f) => e.append(f));
    return e;
  }

  function abrirLink(a, l) {
    a.href = l.url;
    if (l.novaAba) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  }

  function desenhar() {
    document.title = config.titulo;
    $$("[data-titulo]").forEach((n) => { n.textContent = config.titulo; });
    $$("[data-subtitulo]").forEach((n) => { n.textContent = config.subtitulo; });
    $$("[data-brand-mark]").forEach((n) => { n.innerHTML = svg("grafico", 20); });

    // a logo de fundo (sem logo configurada, não há fundo)
    const fundo = $("#watermark");
    fundo.replaceChildren();
    if (config.logo) {
      const img = el("img", { alt: "", src: config.logo });
      img.style.opacity = String(config.logoOpacidade);
      fundo.append(img);
    }

    const ul = $("#links");
    const nav = $("#side-nav");
    ul.replaceChildren();
    nav.replaceChildren();
    config.links.forEach((l, i) => {
      const c = corDoLink(l, i);
      const usavel = Boolean(l.url);
      const li = el("li", { class: "link" });
      li.style.setProperty("--c1", c.c1);
      li.style.setProperty("--c2", c.c2);
      const a = el(usavel ? "a" : "div", { class: "tile" });
      if (usavel) {
        abrirLink(a, l);
        a.setAttribute("aria-label", `Abrir ${l.titulo}`);
      }
      const ir = el("span", { class: "go", html: `<span>Abrir painel</span>${SETA}` });
      a.append(
        el("div", {}, el("span", { class: "ico", html: svg(l.icone) })),
        el("div", { class: "t-body" }, el("div", { class: "t-title" }, l.titulo), el("p", { class: "t-desc" }, l.descricao)),
        el("div", { class: "t-foot" }, el("span", { class: "t-host" }, usavel ? host(l.url) : "Sem endereço: use “Editar links”"), ir),
      );
      li.append(a);
      ul.append(li);

      const item = el(usavel ? "a" : "span", {});
      item.append(el("i"), document.createTextNode(l.titulo));
      if (usavel) abrirLink(item, l);
      const cel = el("div");
      cel.style.setProperty("--c2", c.c2);
      cel.append(item);
      nav.append(cel);
    });

    if (modoEditar) {
      const add = el("li", { class: "add", role: "button", tabindex: "0" }, "+ Adicionar painel");
      add.addEventListener("click", abrirEditor);
      add.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirEditor();
        }
      });
      ul.append(add);
    }

    $("#foot-note").textContent = `${config.links.length} painel${config.links.length === 1 ? "" : "is"} · ${config.titulo}${modoEditar ? " · modo de edição" : ""}`;
    $("#voltar-padrao").hidden = !personalizada;
  }

  // ---------------------------------------------------------------- o editor
  const dlg = $("#editor");
  let rascunho = [];

  function linhaEditor(l, i) {
    const row = el("div", { class: "ed-row" });
    const campo = (rotulo, tipo, valor, chave, ph) => {
      const input = el("input", { type: tipo, "data-k": chave, placeholder: ph || "" });
      input.value = valor;
      input.addEventListener("input", () => {
        rascunho[i][chave] = input.value;
        input.classList.remove("bad");
      });
      return el("label", {}, rotulo, input);
    };
    row.append(
      el("div", { class: "ed-grid" },
        campo("Nome do botão", "text", l.titulo, "titulo", "Ex.: Painel Executivo"),
        campo("Endereço (URL)", "url", l.url, "url", "https://…")),
      campo("Descrição curta", "text", l.descricao, "descricao", "O que o painel mostra"),
    );
    const chk = el("input", { type: "checkbox" });
    chk.checked = l.novaAba;
    chk.addEventListener("change", () => { rascunho[i].novaAba = chk.checked; });
    const mover = (d) => () => {
      const j = i + d;
      if (j < 0 || j >= rascunho.length) return;
      [rascunho[i], rascunho[j]] = [rascunho[j], rascunho[i]];
      renderEditor();
    };
    const sobe = el("button", { type: "button", "aria-label": "Mover para cima" }, "↑");
    sobe.addEventListener("click", mover(-1));
    const desce = el("button", { type: "button", "aria-label": "Mover para baixo" }, "↓");
    desce.addEventListener("click", mover(1));
    const del = el("button", { type: "button", class: "del" }, "Remover");
    del.addEventListener("click", () => { rascunho.splice(i, 1); renderEditor(); });
    row.append(el("div", { class: "ed-tools" }, el("label", { class: "chk" }, chk, "Abrir em nova aba"), el("div", { class: "ed-btns" }, sobe, desce, del)));
    return row;
  }
  function renderEditor() { $("#ed-body").replaceChildren(...rascunho.map(linhaEditor)); }
  function msg(texto, ok) {
    const m = $("#ed-msg");
    m.textContent = texto;
    m.className = "ed-msg" + (ok ? " ok" : "");
  }
  function abrirEditor() {
    if (!modoEditar) return;
    rascunho = config.links.map((l) => ({ ...l }));
    renderEditor();
    msg("");
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }
  function validarRascunho() {
    let ok = true;
    $$("#ed-body .ed-row").forEach((row) => {
      const u = $('[data-k="url"]', row);
      const t = $('[data-k="titulo"]', row);
      const bomU = Boolean(urlValida(u.value));
      const bomT = Boolean(t.value.trim());
      u.classList.toggle("bad", !bomU);
      t.classList.toggle("bad", !bomT);
      if (!bomU || !bomT) ok = false;
    });
    return ok;
  }
  // Os campos já validados viram a configuração do painel.
  const doRascunho = () => normalizar({ ...config, links: rascunho.map((l) => ({ ...l, url: urlValida(l.url) })) }, padrao);

  $$("[data-open-editor]").forEach((b) => {
    b.hidden = !modoEditar;
    b.addEventListener("click", abrirEditor);
  });
  $("#ed-close").addEventListener("click", () => dlg.close());
  $("#ed-add").addEventListener("click", () => {
    rascunho.push({ id: `painel-${Date.now().toString(36)}`, titulo: "", descricao: "", url: "", cor: "", icone: "link", novaAba: true });
    renderEditor();
    msg("");
  });
  function voltarAoPadrao() {
    apagarSalva();
    personalizada = false;
    config = padrao;
    desenhar();
  }
  $("#ed-reset").addEventListener("click", () => {
    voltarAoPadrao();
    rascunho = config.links.map((l) => ({ ...l }));
    renderEditor();
    msg("Voltou ao padrão da página.", true);
  });
  $("#voltar-padrao").addEventListener("click", voltarAoPadrao);
  $("#ed-save").addEventListener("click", () => {
    if (!validarRascunho()) {
      msg("Confira o nome e o endereço dos campos em vermelho (o endereço começa com https://).");
      return;
    }
    config = doRascunho();
    const gravou = gravar(config);
    personalizada = gravou;
    desenhar();
    if (gravou) {
      msg("Salvo neste navegador.", true);
      setTimeout(() => dlg.close(), 700);
    } else {
      msg("Não consegui salvar neste navegador (armazenamento bloqueado). Use “Copiar configuração”.");
    }
  });
  $("#ed-copy").addEventListener("click", async () => {
    const valido = validarRascunho();
    try {
      await navigator.clipboard.writeText(textoDaConfiguracao(valido ? doRascunho() : config));
      msg(valido ? "Configuração copiada." : "Há campos em vermelho: copiei a versão que está na tela, sem essas mudanças.", valido);
    } catch {
      msg("Não consegui copiar automaticamente.");
    }
  });

  desenhar();
})(globalThis);
