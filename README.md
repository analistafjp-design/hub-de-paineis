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
3. **Pela própria página**: botão **Editar links** (ou o quadro **+ Adicionar painel**).
   Edita nome, endereço, descrição, "abrir em nova aba" e a ordem. O **Salvar neste
   navegador** vale só ali. Para valer para todos, use **Copiar configuração** e cole o
   texto em `docs/paineis.js` (ou mande o texto para a Claude).
   Se a página mostrar "Links personalizados neste navegador · voltar ao padrão", o
   navegador está usando a cópia local; o botão volta para o que está no arquivo.

Só entram endereços que começam com `https://` ou `http://`.

## Logo de fundo (Águas do Rio)

A logo está em `docs/logo.png` (PNG com fundo transparente, feito a partir da imagem
enviada pelo usuário) e aparece bem clara atrás dos botões. Em `docs/paineis.js`:

- `"logo": "logo.png"` é o nome do arquivo na pasta `docs/` (vale PNG, SVG, JPG ou WebP,
  de preferência com fundo transparente). Para trocar a logo, substitua o arquivo ou
  mude o nome. Vazio (`""`) tira a imagem de fundo.
- `"logoOpacidade"` é a intensidade, de `0.02` (quase invisível) a `0.3`; hoje é `0.12`.

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
