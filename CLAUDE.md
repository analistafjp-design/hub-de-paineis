# Hub de Painéis — instruções para a Claude

Converse com o usuário sempre em **português do Brasil**, de forma direta. Leia o
`README.md` antes de mexer: ele explica como o Hub funciona e como se troca um endereço.

## O que é

Página estática (`docs/`) com um botão para cada painel do usuário (hoje: Painel
Executivo e Pós-Corte), publicada pelo GitHub Pages (branch `main`, pasta `/docs`).
Os dois painéis têm repositório próprio: `analistafjp-design/painel-executivo`
(Cloudflare Workers) e `analistafjp-design/pos-corte` (GitHub Pages).

## Regras permanentes

1. **Os endereços e textos dos botões ficam só em `docs/paineis.js`.** Nunca coloque um
   endereço de painel dentro de `index.html` ou `hub.js`. Os dois primeiros endereços
   (Executivo e Pós-Corte) já estão preenchidos; **os próximos, o usuário insere ele mesmo**
   (pelo botão "Editar links" ou pelo arquivo). Não deixe "endereço a definir" nos botões
   que já existem.
2. **Os painéis abrem em outra aba** (`"novaAba": true`, padrão de todo botão e de todo painel
   novo): o Hub não pode sumir quando o usuário abre um painel (pedido dele, 06/10/2026:
   "o hub está sumindo toda vez que abro algum painel… não quero isso"). Um teste confere.
3. **O editor de links fica escondido**: o botão "Editar links" e o quadro "+ Adicionar
   painel" só existem com `?editar` no endereço (`modoEdicao` em `hub.js`). Para quem usa o
   Hub no dia a dia não aparece nada de edição (pedido do usuário, 06/10/2026: "qualquer um
   pode editar os links? isso não é bom"). Isso não é segurança: o que vale para todos só
   muda por commit, e o editor só grava no navegador de quem o usa. Não coloque o editor
   de volta à vista e não prometa que `?editar` protege algo.
4. **Nada de fora**: sem CDN, fonte externa, biblioteca ou requisição de rede. A página
   tem Content-Security-Policy (`script-src 'self'`); não use `onclick=` nem script inline.
5. **Só `http(s)` vira link.** Nenhum texto da configuração entra na página como HTML
   (só `textContent` e ícones fixos): um teste confere.
6. **As cores dos botões são as dos painéis** (`CORES` em `hub.js`): Executivo
   `#0B3B66`→`#146B88`, Pós-Corte `#0f2a5c`→`#1e4fd6`. Um teste confere.
7. **Modelo escolhido pelo usuário (06/10/2026): o "D"** — barra lateral escura + cartões
   grandes coloridos + quadro tracejado "+ Adicionar painel". Os outros modelos (A, B, C)
   foram só proposta e foram descartados; não os recrie sem o usuário pedir.
8. **Logo da Águas do Rio**: `docs/logo.png`, feita a partir da imagem que o usuário enviou
   (06/10/2026; o fundo branco virou transparência). É configurada em `paineis.js`
   (`"logo"` e `"logoOpacidade"`), fica encostada embaixo e bem clara, atrás dos cartões.
   Não invente nem redesenhe a logo; para trocá-la, use o arquivo que o usuário mandar.
9. **Favicon**: a marca da Águas do Rio que o usuário enviou (06/10/2026), em `favicon-32.png`,
   `favicon-192.png` e `apple-touch-icon.png` (todos em `docs/`). Não volte ao ícone
   desenhado à mão. Um teste confere os arquivos e os tamanhos declarados no HTML.
10. **Ícone da barra de tarefas = manifesto**: o favicon da aba não basta; sem
   `manifest.webmanifest` (ícones de 192 e 512 px, `start_url` e `display`) o Chrome/Edge põe uma
   letra "H" na barra de tarefas (queixa do usuário, 06/10/2026). A CSP precisa de
   `manifest-src 'self'`. Um atalho já criado não troca de ícone sozinho: o usuário precisa
   desafixar, apagar e instalar de novo (está no README).
11. **Todo ajuste ganha um teste** em `tests/*.test.mjs`. Antes de cada commit rode
   `npm test`.
12. **Mudança visível**: confira no Chromium (Playwright pré-instalado em
   `/opt/pw-browsers`) no computador e no celular (390 px), sem rolagem lateral e sem
   erro no console.

## Fluxo no GitHub

- Para cada pedido, um branch a partir do `main` atualizado (`feature/<descricao>`),
  commit e PR como **draft**. Mensagens de commit e descrição de PR em português.
- **Só mescle quando o usuário disser "Pode mesclar"** (o check `build-and-test` precisa
  estar `success`, sem conflito). Depois de mesclar, avise o que foi mesclado.
- Nunca diga que algo foi publicado sem conferir; deixe claro se você não abriu o site.
