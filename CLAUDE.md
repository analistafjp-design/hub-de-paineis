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
3. **Nada de fora**: sem CDN, fonte externa, biblioteca ou requisição de rede. A página
   tem Content-Security-Policy (`script-src 'self'`); não use `onclick=` nem script inline.
4. **Só `http(s)` vira link.** Nenhum texto da configuração entra na página como HTML
   (só `textContent` e ícones fixos): um teste confere.
5. **As cores dos botões são as dos painéis** (`CORES` em `hub.js`): Executivo
   `#0B3B66`→`#146B88`, Pós-Corte `#0f2a5c`→`#1e4fd6`. Um teste confere.
6. **Modelo escolhido pelo usuário (06/10/2026): o "D"** — barra lateral escura + cartões
   grandes coloridos + quadro tracejado "+ Adicionar painel". Os outros modelos (A, B, C)
   foram só proposta e foram descartados; não os recrie sem o usuário pedir.
7. **Logo da Águas do Rio**: `docs/logo.png`, feita a partir da imagem que o usuário enviou
   (06/10/2026; o fundo branco virou transparência). É configurada em `paineis.js`
   (`"logo"` e `"logoOpacidade"`), fica encostada embaixo e bem clara, atrás dos cartões.
   Não invente nem redesenhe a logo; para trocá-la, use o arquivo que o usuário mandar.
8. **Todo ajuste ganha um teste** em `tests/*.test.mjs`. Antes de cada commit rode
   `npm test`.
9. **Mudança visível**: confira no Chromium (Playwright pré-instalado em
   `/opt/pw-browsers`) no computador e no celular (390 px), sem rolagem lateral e sem
   erro no console.

## Fluxo no GitHub

- Para cada pedido, um branch a partir do `main` atualizado (`feature/<descricao>`),
  commit e PR como **draft**. Mensagens de commit e descrição de PR em português.
- **Só mescle quando o usuário disser "Pode mesclar"** (o check `build-and-test` precisa
  estar `success`, sem conflito). Depois de mesclar, avise o que foi mesclado.
- Nunca diga que algo foi publicado sem conferir; deixe claro se você não abriu o site.
