# Hub de Painéis

Página inicial com um botão para cada painel: **Painel Executivo** e **Pós-Corte**
(e os que vierem depois). É só uma página estática: nada de servidor, nenhum dado
dos painéis passa por aqui, a página só guarda o endereço de cada um.

- Layout: barra lateral escura + cartões coloridos, nas cores dos painéis
  (Executivo: `#0B3B66` → `#146B88`; Pós-Corte: `#0f2a5c` → `#1e4fd6`).
- Funciona no computador e no celular.
- Sem biblioteca, sem fonte e sem CDN: tudo está na pasta `docs/`.

## Como trocar o endereço de um botão

Há três jeitos; o 1 e o 2 valem para todo mundo, o 3 só para o seu navegador.

1. **Pelo arquivo** `docs/paineis.js`: mude o campo `"url"` do painel e salve (no
   GitHub, pelo lápis do arquivo → *Commit changes*). Para acrescentar um painel,
   copie um bloco `{ ... }` da lista e mude os campos. O arquivo explica cada campo.
2. **Pedindo para a Claude**: passe o nome e o endereço e ela atualiza o arquivo.
3. **Pela própria página, em modo de edição**: abra o Hub com `?editar` no final do
   endereço (`https://analistafjp-design.github.io/hub-de-paineis/?editar`). Só assim
   aparecem o botão **Editar links** e o quadro **+ Adicionar painel**; quem abre o
   endereço de sempre vê apenas os botões dos painéis.
   Edita nome, endereço, descrição, "abrir em nova aba" (já marcado em todo painel novo)
   e a ordem. O **Salvar neste navegador** vale só ali. Para valer para todos, use
   **Copiar configuração** e cole o texto em `docs/paineis.js` (ou mande o texto para a
   Claude).
   Se a página mostrar "Links personalizados neste navegador · voltar ao padrão", o
   navegador está usando a cópia local; o botão volta para o que está no arquivo.

## Quem pode mudar o que todos veem

Só quem tem permissão de escrita neste repositório do GitHub (a conta do dono e quem ele
convidar em Settings → Collaborators). O modo de edição da página **não é uma senha** e
não dá poder nenhum sobre o que os outros veem: ele só grava no próprio navegador de
quem o usa. Foi escondido para o botão não aparecer para quem só quer abrir os painéis
(e ninguém achar que "editou para todos"). O que está publicado só muda por *commit*.

Só entram endereços que começam com `https://` ou `http://`.

Todo painel **abre em outra aba**, e o Hub continua aberto (campo `"novaAba": true`, que
também é o valor de quem não escreve o campo). Só com `"novaAba": false` o painel abre
na mesma aba e o Hub some.

## Logo de fundo (Águas do Rio)

A logo está em `docs/logo.png` (PNG com fundo transparente, feito a partir da imagem
enviada pelo usuário) e aparece bem clara atrás dos botões. Em `docs/paineis.js`:

- `"logo": "logo.png"` é o nome do arquivo na pasta `docs/` (vale PNG, SVG, JPG ou WebP,
  de preferência com fundo transparente). Para trocar a logo, substitua o arquivo ou
  mude o nome. Vazio (`""`) tira a imagem de fundo.
- `"logoOpacidade"` é a intensidade, de `0.02` (quase invisível) a `0.3`; hoje é `0.12`.

## Favicon (o ícone da aba)

É a marca da Águas do Rio (fundo azul-esverdeado, "ae ÁGUAS DO RIO" em branco), enviada pelo
usuário, em três tamanhos na pasta `docs/`: `favicon-32.png` (aba do navegador),
`favicon-192.png` (atalhos e telas de alta resolução) e `apple-touch-icon.png` (180 px,
tela inicial do iPhone/iPad). Os três são declarados no `<head>` de `docs/index.html`. Para
trocar, gere os três tamanhos a partir da nova imagem e substitua os arquivos. Depois de
publicar, o navegador pode demorar a trocar o ícone da aba (fecha e abre a aba, ou Ctrl+F5).

## Publicar (GitHub Pages)

Mesmo esquema do Pós-Corte: no GitHub, **Settings → Pages → Build and deployment →
Source: Deploy from a branch → Branch `main`, pasta `/docs` → Save**. O endereço será
`https://analistafjp-design.github.io/hub-de-paineis/`.

Observações: a página publicada é pública (quem tiver o endereço vê os botões, mas os
painéis seguem com o login/acesso que já têm). Em repositório privado, o GitHub Pages
exige plano pago.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `docs/index.html` | A página (visual e editor de links) |
| `docs/paineis.js` | **Os endereços e textos dos botões** (o que se edita) |
| `docs/logo.png` | A logo de fundo (Águas do Rio) |
| `docs/favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` | O ícone da aba |
| `docs/hub.js` | A lógica (validação dos endereços, desenho dos botões, editor) |
| `tests/hub.test.mjs` | Testes automáticos |

## Testes

```
npm test
```

Não precisa instalar nada (só o Node 22 ou mais novo). Confere a configuração, a
recusa de endereços perigosos (`javascript:` etc.), as cores dos painéis, que
"Copiar configuração" gera um `paineis.js` válido e que a página não depende de nada
de fora.
