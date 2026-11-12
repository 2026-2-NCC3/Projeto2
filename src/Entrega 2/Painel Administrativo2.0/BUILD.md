# Build reproduzivel do painel

Execute npm ci, npm test e npm run build nesta pasta. O resultado fica em dist/.
O checkout nao precisa de .figma: site.config.json versiona os metadados reais do
produto (titulo Proxima Etapa, descricao, idioma pt-BR, robots noindex e link de
acessibilidade). Nao e um substituto ficticio do arquivo ausente.

A integracao original Figma transformava os slots figma:* de index.html e
injetava metadados, favicon, Open Graph, scripts opcionais, Analytics, robots e
link de acessibilidade. config/site-config.js carrega os metadados versionados
e, somente quando existe, aplica .figma/make/site.json como override local.
Um override malformado provoca erro. O arquivo gerenciado pelo Figma continua
ignorado; nenhum deles foi criado nesta correcao. Plugins de preview, replay de
erros, React Refresh e stories do Figma foram preservados e seguem apenas em serve.

VITE_API_URL continua sendo lida por src/services/api.js e incorporada no bundle
pelo Vite no momento do build. Sem valor, desenvolvimento e producao usam
https://projeto2-krn7.onrender.com. Para testes locais, configure explicitamente
VITE_API_URL=http://localhost:3000. Para outro ambiente, configure VITE_API_URL antes de executar
npm run build e gere novamente o bundle. Variaveis VITE_* sao publicas, nao segredos.
A configuracao de metadados e FIGMA_PUBLIC_URL nao substituem a URL da API.

FIGMA_PUBLIC_URL controla o base dos recursos estaticos, mantendo compatibilidade
com preview Figma e hospedagem em subdiretorio. Por exemplo /painel/ gera caminhos
/painel/assets/*.js e *.css. Barras finais sao normalizadas. O padrao e /.
Nao houve deploy ou alteracao da API. As fontes Google Fonts existentes no CSS
continuam externas; JS/CSS gerados sao servidos pelo proprio dist/.

Testes automatizados usam diretorios temporarios: ausencia de .figma; preservacao
dos overrides e extensoes HTML; recusa de JSON malformado; build e preview HTTP
na raiz e em /painel/; arquivos JS/CSS existentes com HTTP 200; API padrao e API
explicitamente configurada presentes nos bundles. O endereco example.invalid e
apenas um valor de teste, nao foi consultado como API. O build pode avisar sobre
chunk JS acima de 500 kB; esse aviso nao foi ocultado nem tratado como falha.

Referencias: https://vite.dev/guide/env-and-mode.html e
https://vite.dev/config/shared-options.html#base.
