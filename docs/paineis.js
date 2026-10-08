// Configuração do Hub de Painéis: é aqui que se coloca o endereço de cada botão.
//
// Para trocar um endereço: mude o campo "url" do painel e salve (no GitHub, pelo
// lápis do arquivo). A página publicada atualiza em alguns minutos.
// Para acrescentar um painel: copie um bloco { ... } da lista e mude os campos.
// Também dá para editar pela própria página (botão "Editar links") e usar
// "Copiar configuração" para colar o resultado aqui.
//
// Campos de cada painel:
//   id         nome interno, sem espaços e sem repetir
//   titulo     texto do botão
//   descricao  frase curta embaixo do título
//   url        endereço do painel (só https:// ou http://)
//   cor        "executivo", "poscorte", "cadastro" (as cores dos painéis existentes),
//              um código como "#0b5d4f", ou vazio para uma cor automática
//   icone      "grafico", "prancheta" ou "link"
//   novaAba    true abre o painel em outra aba, e o Hub continua aberto (o certo para
//              um hub); false abre na mesma aba e o Hub some. Sem o campo, vale true.
//
// A logo de fundo: coloque o arquivo na pasta docs (ex.: docs/logo.png) e escreva
// o nome em "logo". "logoOpacidade" vai de 0.02 (quase invisível) a 0.3.
window.HUB_CONFIG = {
  "titulo": "Hub de Painéis",
  "subtitulo": "Interior Lagos",
  "logo": "logo.png",
  "logoOpacidade": 0.12,
  "links": [
    {
      "id": "executivo",
      "titulo": "Painel Executivo",
      "descricao": "Vendas, implantações, faturamento, termos e produtividade VCG.",
      "url": "https://painel-executivo.analistafjp.workers.dev/",
      "cor": "executivo",
      "icone": "grafico",
      "novaAba": true
    },
    {
      "id": "poscorte",
      "titulo": "Pós-Corte",
      "descricao": "Negociações, termos aplicados, frentes de serviço e bases de campo.",
      "url": "https://analistafjp-design.github.io/pos-corte/",
      "cor": "poscorte",
      "icone": "prancheta",
      "novaAba": true
    },
    {
      "id": "cadastro",
      "titulo": "Cadastro e Venda",
      "descricao": "Efetividade das equipes de cadastro e venda: visitas, resultados, tempos e novos alvos.",
      "url": "https://analistafjp-design.github.io/cadastro-venda/",
      "cor": "cadastro",
      "icone": "grafico",
      "novaAba": true
    }
  ]
};
