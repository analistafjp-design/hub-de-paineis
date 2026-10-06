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
const { HubLib } = carregar(hubSource, { URL }); // o navegador já traz o URL; no vm ele é passado
const { HUB_CONFIG } = carregar(configSource);
const { urlValida, imagemValida, normalizar, corDoLink, textoDaConfiguracao, CORES } = HubLib;

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
