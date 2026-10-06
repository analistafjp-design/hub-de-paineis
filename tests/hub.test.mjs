import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

// O Hub é uma página estática: docs/index.html + docs/paineis.js (os endereços) +
// docs/hub.js (a lógica). Aqui se confere a configuração, a validação dos endereços
// (nada de javascript:), as cores dos painéis e que a página não depende de nada de fora.

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [html, hubSource, configSource] = await Promise.all([
  read("docs/index.html"),
  read("docs/hub.js"),
  read("docs/paineis.js"),
]);

const plain = (valor) => JSON.parse(JSON.stringify(valor));
function carregar(codigo, contexto = {}) {
  const context = vm.createContext(contexto);
  context.window = context; // paineis.js escreve em window.HUB_CONFIG
  vm.runInContext(codigo, context);
  return context;
}
// hub.js sem `document` só define a HubLib (a parte de desenhar fica de fora).
const { HubLib } = carregar(hubSource, { URL, URLSearchParams }); // o navegador já traz os dois; no vm eles são passados
const { HUB_CONFIG } = carregar(configSource);
const { urlValida, imagemValida, normalizar, corDoLink, textoDaConfiguracao, modoEdicao, CORES } = HubLib;

test("a configuração traz o Painel Executivo e o Pós-Corte, com os endereços combinados", () => {
  const links = plain(HUB_CONFIG.links.map((l) => [l.id, l.titulo, l.url]));
  assert.deepEqual(links, [
    ["executivo", "Painel Executivo", "https://painel-executivo.analistafjp.workers.dev/"],
    ["poscorte", "Pós-Corte", "https://analistafjp-design.github.io/pos-corte/"],
  ]);
});

test("todo botão da configuração tem endereço válido, id único, ícone e cor conhecidos", () => {
  const ids = new Set();
  for (const l of HUB_CONFIG.links) {
    assert.ok(urlValida(l.url), `${l.id}: endereço`);
    assert.ok(!ids.has(l.id), `${l.id}: id repetido`);
    ids.add(l.id);
    assert.ok(["grafico", "prancheta", "link"].includes(l.icone), `${l.id}: ícone`);
    assert.ok(l.titulo.trim() && l.titulo.length <= 60, `${l.id}: título`);
    assert.ok(l.descricao.length <= 160, `${l.id}: descrição`);
    assert.equal(typeof l.novaAba, "boolean");
  }
  // O que o normalizar devolve é o mesmo que está no arquivo: nada foi descartado.
  assert.deepEqual(plain(normalizar(HUB_CONFIG).links), plain(HUB_CONFIG.links));
});

test("só endereços http(s) viram botão: javascript:, data: e file: são recusados", () => {
  assert.equal(urlValida("https://exemplo.com/a"), "https://exemplo.com/a");
  assert.equal(urlValida("  http://intranet.local/x  "), "http://intranet.local/x");
  for (const ruim of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<b>oi</b>", "file:///etc/passwd", "exemplo.com", "", null, undefined, "https://"])
    assert.equal(urlValida(ruim), null, String(ruim));
  const n = normalizar({ links: [{ titulo: "X", url: "javascript:alert(1)" }] });
  assert.equal(n.links[0].url, "");
});

test("a logo de fundo é um arquivo da pasta ou uma imagem https; o resto é descartado", () => {
  assert.equal(imagemValida(""), "");
  assert.equal(imagemValida("logo.png"), "logo.png");
  assert.equal(imagemValida("img/logo-aguas.svg"), "img/logo-aguas.svg");
  assert.equal(imagemValida("https://exemplo.com/logo.png"), "https://exemplo.com/logo.png");
  for (const ruim of ["javascript:alert(1)", "data:image/svg+xml,<svg/>", "../logo.png", "//evil.com/logo.png", "logo.exe", "logo", "https://", "file:///x.png"])
    assert.equal(imagemValida(ruim), "", ruim);
});

test("normalizar: ids repetidos ganham sufixo, a opacidade fica entre 0,02 e 0,3 e há um limite de botões", () => {
  const n = normalizar({
    logoOpacidade: 5,
    links: [{ id: "a", url: "https://a.com" }, { id: "a", url: "https://b.com" }, { id: "c d", url: "https://c.com", icone: "estranho" }],
  });
  assert.deepEqual(plain(n.links.map((l) => l.id)), ["a", "a-2", "c-d"]);
  assert.equal(n.links[2].icone, "link");
  assert.equal(n.logoOpacidade, 0.3);
  assert.equal(normalizar({ logoOpacidade: 0 }).logoOpacidade, 0.02);
  assert.equal(normalizar({ logoOpacidade: "abc" }).logoOpacidade, 0.07);
  assert.equal(normalizar({ links: Array.from({ length: 50 }, (_, i) => ({ url: `https://x${i}.com` })) }).links.length, 24);
  // Sem configuração nenhuma, a página ainda sobe (sem botões).
  assert.equal(normalizar(null, { titulo: "Hub" }).titulo, "Hub");
  assert.deepEqual(plain(normalizar(undefined).links), []);
});

test("as cores dos dois painéis existentes são as deles; os novos ganham cor própria", () => {
  assert.deepEqual(plain(CORES.executivo), { c1: "#0B3B66", c2: "#146B88" });
  assert.deepEqual(plain(CORES.poscorte), { c1: "#0f2a5c", c2: "#1e4fd6" });
  assert.deepEqual(plain(corDoLink({ cor: "executivo" }, 0)), plain(CORES.executivo));
  assert.deepEqual(plain(corDoLink({ cor: "#aa22cc" }, 0)), { c1: "#aa22cc", c2: "#aa22cc" });
  // Cor desconhecida ou vazia: uma da paleta automática, e não a mesma em botões seguidos.
  const a = corDoLink({ cor: "" }, 0);
  const b = corDoLink({ cor: "nao-existe" }, 1);
  assert.notDeepEqual(plain(a), plain(b));
});

test("\"Copiar configuração\" gera o conteúdo de docs/paineis.js, que volta igual ao ser lido", () => {
  const texto = textoDaConfiguracao(normalizar(HUB_CONFIG));
  assert.match(texto, /^window\.HUB_CONFIG = \{/);
  const { HUB_CONFIG: lida } = carregar(texto);
  assert.deepEqual(plain(normalizar(lida)), plain(normalizar(HUB_CONFIG)));
});

test("a página carrega paineis.js antes de hub.js e não depende de nada de fora", () => {
  const scripts = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(scripts, ["paineis.js", "hub.js"]);
  // Nada de CDN, fonte ou folha de estilo externa; nada de manipulador inline (a CSP não deixa).
  assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/);
  assert.doesNotMatch(html, /\son(click|load|error)=/i);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/);
  // A política de conteúdo só deixa rodar scripts da própria pasta.
  assert.match(html, /Content-Security-Policy[^>]+script-src 'self'/);
  assert.match(html, /<title>Hub de Painéis<\/title>/);
});

test("nenhum texto da configuração entra na página como HTML: só os ícones fixos", () => {
  const usosDeHtml = hubSource.split("\n").filter((linha) => /\bhtml:|innerHTML/.test(linha));
  assert.ok(usosDeHtml.length > 0);
  for (const linha of usosDeHtml)
    assert.match(linha, /innerHTML = svg\(|innerHTML = v|html: svg\(|html: `<span>Abrir painel<\/span>\$\{SETA\}`|k === "html"|else if \(k === "html"\)/, linha.trim());
});

test("a logo de fundo existe na pasta docs, é um PNG com transparência e fica clara", async () => {
  assert.equal(HUB_CONFIG.logo, "logo.png");
  assert.equal(imagemValida(HUB_CONFIG.logo), "logo.png");
  await access(new URL("../docs/logo.png", import.meta.url));
  const png = await readFile(new URL("../docs/logo.png", import.meta.url));
  // Assinatura PNG e tipo de cor 6 (RGBA): o fundo branco do original virou transparência.
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(png[25], 6);
  assert.ok(png.length < 400 * 1024, "a logo não deve pesar mais de 400 KB");
  assert.ok(HUB_CONFIG.logoOpacidade >= 0.05 && HUB_CONFIG.logoOpacidade <= 0.2, "logo clara, sem atrapalhar a leitura");
});

test("os painéis abrem em outra aba, para o Hub continuar aberto (pedido do usuário, 06/10/2026)", () => {
  // Os dois botões de hoje.
  for (const l of HUB_CONFIG.links) assert.equal(l.novaAba, true, l.id);
  // Sem o campo, vale "outra aba"; só um false escrito de propósito abre na mesma.
  const n = normalizar({ links: [{ url: "https://a.com" }, { url: "https://b.com", novaAba: false }, { url: "https://c.com", novaAba: true }] });
  assert.deepEqual(plain(n.links.map((l) => l.novaAba)), [true, false, true]);
  // Um painel novo, criado pelo "+ Adicionar painel" do editor, já nasce abrindo em outra aba.
  assert.match(hubSource, /icone: "link", novaAba: true \}\);/);
  // O link da página e o da barra lateral usam _blank com noopener/noreferrer.
  assert.match(hubSource, /if \(l\.novaAba\) \{\s*a\.target = "_blank";\s*a\.rel = "noopener noreferrer";/);
});

test("o editor de links só aparece para quem abre o Hub com ?editar no endereço", () => {
  // Quem só usa o Hub (o endereço de sempre) não vê nada de edição.
  for (const busca of ["", "?", "?x=1", "?outro=editar", "?editarr", undefined, null])
    assert.equal(modoEdicao(busca), false, String(busca));
  for (const busca of ["?editar", "?editar=1", "?a=1&editar", "editar"])
    assert.equal(modoEdicao(busca), true, busca);
  // O botão "Editar links" já nasce escondido no HTML (não pisca na tela de ninguém)...
  assert.match(html, /<button[^>]*\bdata-open-editor\b[^>]*\bhidden\b[^>]*>/);
  // ...só é mostrado no modo de edição, e o quadro "+ Adicionar painel" nem é criado fora dele.
  assert.match(hubSource, /b\.hidden = !modoEditar;/);
  assert.match(hubSource, /if \(modoEditar\) \{\s*const add = el\("li", \{ class: "add"/);
  // E, mesmo que alguém chame o editor por fora, ele não abre sem o modo de edição.
  assert.match(hubSource, /function abrirEditor\(\) \{\s*if \(!modoEditar\) return;/);
});

test("o favicon é o da Águas do Rio: três PNGs na pasta docs, do tamanho que o HTML declara", async () => {
  const icones = [...html.matchAll(/<link rel="(icon|apple-touch-icon)"[^>]*>/g)].map((m) => m[0]);
  assert.equal(icones.length, 3);
  // Nada do ícone antigo (um desenho embutido no HTML).
  assert.doesNotMatch(html, /rel="icon"[^>]*href="data:/);
  const esperados = { "favicon-32.png": 32, "favicon-192.png": 192, "apple-touch-icon.png": 180 };
  const declarados = {};
  for (const tag of icones) {
    const href = tag.match(/href="([^"]+)"/)[1];
    const tamanho = Number(tag.match(/sizes="(\d+)x\1"/)[1]);
    declarados[href] = tamanho;
    const png = await readFile(new URL(`../docs/${href}`, import.meta.url));
    assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${href}: PNG`);
    // IHDR: largura e altura (4 bytes cada) a partir do byte 16.
    assert.equal(png.readUInt32BE(16), tamanho, `${href}: largura`);
    assert.equal(png.readUInt32BE(20), tamanho, `${href}: altura`);
    assert.ok(png.length < 100 * 1024, `${href}: leve`);
  }
  assert.deepEqual(declarados, esperados);
});

test("o Hub é instalável como aplicativo: o ícone da barra de tarefas vem do manifesto (192 e 512 px)", async () => {
  // O HTML aponta para o manifesto, a política de conteúdo deixa carregá-lo e a cor da barra é a do painel.
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /Content-Security-Policy[^>]+manifest-src 'self'/);
  assert.match(html, /<meta name="theme-color" content="#0B3B66">/);
  const manifesto = JSON.parse(await read("docs/manifest.webmanifest"));
  assert.equal(manifesto.name, "Hub de Painéis");
  assert.ok(manifesto.short_name && manifesto.short_name.length <= 12);
  assert.equal(manifesto.start_url, "./");
  assert.equal(manifesto.scope, "./");
  assert.equal(manifesto.display, "standalone");
  assert.equal(manifesto.theme_color, "#0B3B66");
  // O navegador só aceita instalar com ícones de 192 e de 512 px, e eles têm de existir e ter o tamanho dito.
  const lados = [];
  for (const icone of manifesto.icons) {
    assert.equal(icone.type, "image/png");
    const lado = Number(icone.sizes.split("x")[0]);
    const png = await readFile(new URL(`../docs/${icone.src}`, import.meta.url));
    assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${icone.src}: PNG`);
    assert.equal(png.readUInt32BE(16), lado, `${icone.src}: largura`);
    assert.equal(png.readUInt32BE(20), lado, `${icone.src}: altura`);
    assert.ok(png.length < 300 * 1024, `${icone.src}: leve`);
    lados.push(lado);
  }
  assert.ok(lados.includes(192) && lados.includes(512), `ícones do manifesto: ${lados}`);
});
