# FECAP - Fundação de Comércio Álvares Penteado

<p align="center">
<a href= "https://www.fecap.br/"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP - Fundação de Comércio Álvares Penteado" border="0"></a>
</p>

# Próxima Etapa

## DeuBug?

## Integrantes: <a href="https://www.linkedin.com/in/guicastilho060/">Guilherme Augusto Castilho</a>, <a href="https://www.linkedin.com/in/matheus-fadini/">Matheus Fadini</a>, <a href="https://www.linkedin.com/in/michael-condori/">Michael Condori Mamani</a>, <a href="https://www.linkedin.com/in/ryan-santos-880332353/">Ryan Santos</a>

## Professores Orientadores: <a href="https://www.linkedin.com/in/katia-bossi/">Katia Milani Lara Bossi</a>, <a href="https://www.linkedin.com/in/marco-aurelio-lima-barbosa/">Marco Aurelio Lima Barbosa</a>, <a href="https://www.linkedin.com/in/rodrigo-da-rosa-phd/">Rodrigo da Rosa</a>, <a href="https://www.linkedin.com/in/victorbarq/">Victor Bruno Alexander Rosetti de Quiroz</a>

## Descrição

<p align="center">
  <img src="https://i.postimg.cc/Dy6r4T99/Imagem-Proxima-Etapa.png" alt="Logo Próxima Etapa" width="250">
</p>

<p align="center">
  <a href="https://proximaetapa.org.br">
    Próxima Etapa
  </a>
</p>

O Próxima Etapa – App do Aluno é um aplicativo Android desenvolvido no Projeto Interdisciplinar do 3º semestre do curso de Ciência da Computação da FECAP, em parceria com a organização Próxima Etapa.
<br><br>
A solução tem como  facilitar o acompanhamento da jornada educacional dos estudantes atendidos pela ONG, permitindo acesso a cursos, atividades, agenda, presença, certificados, mensagens e orientação profissional em um único ambiente digital.
<br><br>
O sistema será composto por um aplicativo mobile, uma API REST e um banco de dados integrados, possibilitando a sincronização das informações dos alunos em tempo real. Além disso, contará com recursos como registro de presença por QR Code, emissão de certificados, notificações, testes de perfil profissional e canal de comunicação entre estudantes e a organização.
<br><br>

## 🛠 Estrutura de pastas
```
📂 Projeto2/
│
├── 📄 README.md
├── 📄 LICENSE
├── 📄 .gitignore
│
├── 📂 src/
│   └── 📂 Entrega 1/
│       ├── 📂 Frontend/                 # Aplicativo Android
│       │   ├── 📂 app/
│       │   │   ├── 📄 build.gradle.kts
│       │   │   └── 📂 src/main/
│       │   │       ├── 📄 AndroidManifest.xml
│       │   │       ├── 📂 java/com/example/projetopi/
│       │   │       │   ├── 📄 MainActivity.java
│       │   │       │   ├── 📄 CadastroActivity.java
│       │   │       │   ├── 📄 TelaInicial.java
│       │   │       │   ├── 📄 ApiConfig.java
│       │   │       │   └── 📄 VolleySingleton.java
│       │   │       └── 📂 res/
│       │   │           ├── 📂 drawable/
│       │   │           ├── 📂 layout/
│       │   │           ├── 📂 mipmap-*/
│       │   │           └── 📂 values/
│       │   ├── 📂 gradle/
│       │   ├── 📄 build.gradle.kts
│       │   ├── 📄 settings.gradle.kts
│       │   ├── 📄 gradlew
│       │   └── 📄 gradlew.bat
│       │
│       └── 📂 Backend/                  # API Node.js + Express + SQLite
│           ├── 📂 database/
│           │   ├── 📄 database.js
│           │   ├── 📄 schema.sql
│           │   └── 📄 proxima_etapa.db  # Gerado pela migration
│           ├── 📂 src/
│           │   ├── 📂 config/
│           │   │   └── 📄 migrate.js
│           │   ├── 📂 controllers/
│           │   │   ├── 📄 profilesController.js
│           │   │   ├── 📄 universidadesController.js
│           │   │   └── 📄 cursosController.js
│           │   ├── 📂 models/
│           │   │   ├── 📄 profilesModel.js
│           │   │   ├── 📄 universidadesModel.js
│           │   │   └── 📄 cursosModel.js
│           │   └── 📂 routes/
│           │       ├── 📄 profilesRoutes.js
│           │       ├── 📄 universidadesRoutes.js
│           │       └── 📄 cursosRoutes.js
│           ├── 📄 server.js
│           ├── 📄 package.json
│           └── 📄 package-lock.json
│
├── 📂 documentos/
│   ├── 📂 Entrega 1/
│   ├── 📂 Entrega 2/
│   ├── 📄 Documento - Projeto de Extensão - COM Empresa - 2026_1.docx
│   └── 📄 MODELO_BANNER_FECAP_2026_1.pptx
│
├── 📂 imagens/
│   └── 📄 Bootstrap_5.0_Screenshot.png
```

## Backend da Entrega 2: banco de dados

- `npm run db:init`: cria o esquema original e registra as migrações, exclusivamente em banco vazio.
- `npm run db:backup`: cria backup consistente pela API do SQLite, incluindo registros no WAL.
- `npm run migrate`: aplica migrações incrementais em banco existente; adota o v5 compatível sem recriar tabelas. Esquemas incompatíveis são recusados sem conversão automática.
- `npm start`: valida esquema, versões e integridade antes de abrir HTTP. Não cria nem migra tabelas e não cria administradores. Em banco novo, execute `db:init` antes; em v5 existente, faça backup e execute `migrate` explicitamente.
- `npm run seed:admin`: cria o primeiro administrador a partir das variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` (senha com no mínimo 12 caracteres).
- `npm test`: testes de migração e inicialização com bancos temporários e dados fictícios.

Execute os comandos em `src/Entrega 2/Backend2.0`. Consulte [o procedimento de migrações e WAL](src/Entrega%202/Backend2.0/database/MIGRATIONS.md). `CONFIRMAR_DROP` foi removido e não habilita operações destrutivas.

## Entrega 2: reproducao e estado atual

A implementacao atual usa Node.js/Express, SQLite/better-sqlite3, Android Java
com Volley e painel React/Vite.

- [Matriz de validacao funcional](documentos/Entrega%202/VALIDACAO.md).
- [Diagramas e contratos atuais](documentos/Entrega%202/ARQUITETURA.md).
- [Banco novo, banco existente, transacoes e WAL](src/Entrega%202/Backend2.0/database/MIGRATIONS.md).
- [Provisionamento de administradores](src/Entrega%202/Backend2.0/database/ADMINISTRATORS.md).
- [Cache por usuario e limites de consulta offline](src/Entrega%202/Frontend2.0/OFFLINE.md).

Pre-requisitos: Node.js 24, npm, Git e Android Studio com Android SDK 37 e
Platform-Tools. O projeto usa AGP 9.0.1 e Gradle Wrapper 9.5.0; os criterios
do daemon exigem JDK 25, embora o codigo Java seja compilado com source/target 11.
Ha aviso de compatibilidade entre AGP 9.0.1 e SDK 37; nao foi suprimido.
Use os wrappers e lockfiles versionados. Nunca use dados reais nos testes.

No backend, execute a partir de src/Entrega 2/Backend2.0:

~~~sh
npm ci
# Copie .env.example para .env e preencha JWT_SECRET com chave aleatoria local.
# DB_PATH opcional aponta para o banco desejado. Use o mesmo caminho em tudo.
# Somente em banco vazio:
npm run db:init
# Em banco existente: pare os escritores, faca backup e execute migrate:
# npm run db:backup
# npm run migrate
npm test
npm start
~~~

JWT_SECRET nao tem valor padrao. Nunca comite .env. Para criar o primeiro admin,
configure ADMIN_EMAIL/ADMIN_PASSWORD explicitamente e execute npm run seed:admin
manualmente apos preparar o banco; repeticoes recusam contas existentes. Nao
existe reset como procedimento normal nem seed/migracao automatica no startup.

No Android, execute em src/Entrega 2/Frontend2.0:

~~~sh
# Configure JAVA_HOME (JDK 25) e ANDROID_HOME de acordo com seu ambiente.
# No PowerShell, sobrescreva o caminho de JDK fixado em gradle.properties:
./gradlew.bat "-Dorg.gradle.java.home=$env:JAVA_HOME" :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
~~~

ApiConfig.BASE_URL usa http://127.0.0.1:3000 em desenvolvimento. Depois de iniciar
o backend e conectar um emulador ou aparelho autorizado por USB, execute a partir
da raiz do repositorio, no PowerShell:

~~~powershell
& .\scripts\conectar-android.ps1
# Opcional: manter a ponte apos reconexoes:
# & .\scripts\conectar-android.ps1 -Watch
~~~

O script configura adb reverse tcp:3000 tcp:3000 em cada dispositivo autorizado.
Se o SDK estiver em outro local, informe -AdbPath com o caminho de adb.exe.
A ponte e local: nao publica a API na internet. Use HTTPS fora do desenvolvimento.
Cursos, agenda e historico usam a API e respeitam o aluno autenticado.
O cache e de leitura; nao ha fila de check-in offline nem SQLite/Room no Android.
O APK gerado e de debug em app/build/outputs/apk/debug/app-debug.apk.

No painel, execute em src/Entrega 2/Painel Administrativo2.0:

~~~sh
npm ci
npm test
npm run build
npm run dev -- --host 127.0.0.1
~~~

VITE_API_URL configura a API do painel; o padrao e http://localhost:3000.
Consulte [o guia de build](src/Entrega%202/Painel%20Administrativo2.0/BUILD.md).
O Android tambem gera AAB release local, nao assinado, com codigo 2 / nome 1.1.0;
veja [versionamento e limites de publicacao](src/Entrega%202/Frontend2.0/VERSIONING.md).
O maior versionCode publicado nao foi comprovado; o AAB local nao comprova
aceitacao pela loja, assinatura de producao ou publicacao.
O painel permite gerar QR de atividades existentes, com validade definida por um
administrador. O Android le o token e somente confirma presenca apos resposta valida
da API; o historico consulta registros persistidos. A leitura pela camera precisa
ser demonstrada em dispositivo. Nao ha presenca confirmada offline.

Para continuar em outro computador (PowerShell):

~~~powershell
git clone --branch fix/p0-seguranca-entrega2 --single-branch https://github.com/2026-2-NCC3/Projeto2.git
cd Projeto2
git status
cd "src/Entrega 2/Backend2.0"
npm ci
# Cria .env apenas se ainda nao existir, com JWT_SECRET novo, sem exibi-lo:
node -e "const fs=require('node:fs'),crypto=require('node:crypto'); if(fs.existsSync('.env')) throw Error('.env ja existe; preserve-o'); const template=fs.readFileSync('.env.example','utf8'); fs.writeFileSync('.env',template.replace(/^JWT_SECRET=.*$/m,'JWT_SECRET='+crypto.randomBytes(48).toString('base64url')),{flag:'wx'});"
# Apenas numa copia nova e sem banco existente:
if (-not (Test-Path "database/proxima_etapa.db")) { npm run db:init }
npm test
npm start
~~~

Confirme DB_PATH antes de inicializar: o comando acima pressupoe o valor vazio do
modelo versionado e o banco padrao. Se houver banco existente ou DB_PATH customizado,
nao inicialize automaticamente. Nunca copie .env, bancos reais, WAL/SHM ou senhas para
o Git. Para transferir dados autorizados, use o backup consistente do SQLite por
canal privado; esta publicacao do codigo nao transfere o banco local.

Em outro terminal, na raiz do clone, inicie o painel com os comandos acima e abra
o endereco informado pelo Vite (porta padrao 8443). No Android Studio, abra
src/Entrega 2/Frontend2.0, configure o SDK local e o JDK 25, inicie o emulador e execute
o script ADB. local.properties e configuracao da maquina; nao deve ser versionado.
O caminho org.gradle.java.home atual e especifico de uma instalacao Windows:
use a sobrescrita -D mostrada acima para builds em outra instalacao.

O administrador nao e criado no startup. Configure ADMIN_EMAIL e ADMIN_PASSWORD
(senha propria com pelo menos 12 caracteres) apenas no ambiente local e execute
npm run seed:admin manualmente, antes de iniciar o backend. Nao ha credencial padrao.
Novas contas de aluno podem ser cadastradas pelo aplicativo; a agenda exige inscricoes
reais do ambiente de demonstracao. O QR exige uma atividade existente e uma inscricao
ativa; nao crie dados pessoais reais para testes.

# Instalação

## Windows

1. **Acesse o repositório no GitHub**
   Abra o navegador e acesse a página do repositório do projeto:
   `https://github.com/2026-2-NCC3/Projeto2`

2. **Copie a URL HTTPS do repositório**
   Na página do repositório, clique no botão verde **"Code"**. Na aba **"Local"**, certifique-se de que a opção **HTTPS** esteja selecionada e clique no ícone de copiar ao lado da URL (algo como `https://github.com/2026-2-NCC3/Projeto2.git`).

3. **Abra o Android Studio**
   Inicie o Android Studio no seu computador. Se ainda não tiver instalado, veja a seção [Testando no PC](#testando-no-pc) abaixo antes de continuar.

4. **Selecione "Clone Repository"**
   Na tela inicial do Android Studio (Welcome Screen), clique no botão **"Clone Repository"**, localizado ao lado de "New Project" e "Open".

5. **Cole a URL do GitHub**
   Na janela "Clone Repository", cole a URL copiada no passo 2 no campo **URL**.

6. **Escolha a pasta de destino**
   No campo **Directory**, escolha (ou digite) o caminho onde o projeto será salvo no seu computador — por exemplo: `C:\Users\SeuUsuario\Desktop\Projeto2`. Você pode usar o ícone de pasta ao lado do campo para navegar visualmente até o local desejado.

7. **Conclua o clone**
   Clique em **"Clone"**. O Android Studio irá baixar todos os arquivos do repositório para a pasta escolhida. Aguarde a barra de progresso finalizar.

8. **Aguarde o Gradle sincronizar**
   Após o clone, o Android Studio inicia automaticamente o processo de sincronização do Gradle (aparece uma barra de progresso na parte inferior da tela, geralmente com o texto "Gradle Sync" ou similar). Esse processo baixa as dependências do projeto e pode levar alguns minutos, dependendo da velocidade da internet — **não feche o Android Studio durante esse processo**.

9. **Resolva dependências faltantes**
   Caso apareçam avisos em vermelho ou uma barra amarela no topo do editor informando dependências ausentes (ex: "SDK não instalado" ou "Gradle version incompatível"), clique nos links de correção sugeridos pelo próprio Android Studio (geralmente "Install missing SDK(s)" ou "Update Gradle"). O Android Studio resolve a maioria desses problemas automaticamente com um clique.

10. **Abra o Device Manager**
    No menu superior, vá em **View → Tool Windows → Device Manager**, ou clique no ícone de celular na barra lateral direita.

11. **Crie um emulador Android (caso não exista nenhum)**
    Dentro do Device Manager, clique em **"Create Device"**. Escolha um modelo de celular (recomendado: **Pixel 6** ou similar), clique em **Next**, selecione uma imagem de sistema (recomendado: a versão mais recente com o ícone de download, caso ainda não esteja baixada) e clique em **Finish**.

12. **Inicie o emulador**
    Com o emulador criado, clique no ícone de **play (▶)** ao lado dele na lista do Device Manager. Aguarde a tela do emulador carregar completamente (pode levar 1-2 minutos na primeira vez).

13. **Selecione o dispositivo**
    No topo do Android Studio, verifique se o emulador criado está selecionado na lista suspensa de dispositivos (ao lado do botão de "Run").

14. **Compile o projeto**
    Clique no ícone de **martelo (Build)** na barra de ferramentas, ou vá em **Build → Make Project**, para verificar se o código compila sem erros.

15. **Execute o aplicativo**
    Clique no botão verde de **play (▶ Run 'app')** no topo do Android Studio. O aplicativo será instalado e aberto automaticamente no emulador selecionado.

16. **Verifique erros no Logcat**
    Caso o app feche sozinho ou apresente comportamento inesperado, abra a aba **Logcat** (geralmente na parte inferior do Android Studio). Filtre por **"Error"** no menu suspenso de nível de log para visualizar mensagens de erro detalhadas, que ajudam a identificar a causa do problema.

> **Observação para iniciantes:** é normal que a primeira sincronização do Gradle demore bastante — isso acontece porque o Android Studio está baixando todas as bibliotecas necessárias pela primeira vez. Da segunda vez em diante, o processo é bem mais rápido.

---

# Testando no PC

Este tutorial é indicado para quem nunca utilizou o Android Studio.

1. **Instale o Android Studio**
   Baixe o instalador oficial em [developer.android.com/studio](https://developer.android.com/studio) e siga o assistente de instalação, mantendo as opções padrão marcadas (isso já instala o SDK do Android e o emulador).

2. **Clone o projeto**
   Siga os passos 1 a 7 da seção **Windows** acima para clonar o repositório usando a opção "Clone Repository" do Android Studio.

3. **Abra o projeto**
   Se o Android Studio não abrir o projeto automaticamente após o clone, vá em **File → Open** e selecione a pasta onde o projeto foi salvo.

4. **Aguarde a sincronização**
   Espere a barra de progresso do **Gradle Sync** finalizar na parte inferior da tela. Isso pode demorar alguns minutos na primeira vez.

5. **Crie um emulador Android**
   Siga os passos 10 e 11 da seção **Windows** acima para criar um dispositivo virtual, caso ainda não tenha um.

6. **Execute o app**
   Clique no botão verde **Run (▶)** no topo do Android Studio para compilar e abrir o aplicativo no emulador.

7. **Teste as funcionalidades**
   Navegue pelas telas do aplicativo (login, dashboard, cursos, agenda, carteirinha) para verificar se tudo está funcionando conforme esperado.

8. **Leia mensagens de erro no Logcat**
   Se algo não funcionar como esperado, abra a aba **Logcat** na parte inferior do Android Studio. Ali aparecem mensagens detalhadas sobre erros e exceções (crashes), que ajudam a identificar exatamente onde e por que o app falhou.

---

# Testando no Celular

## Em breve

A versão para testes diretamente em dispositivos móveis será disponibilizada futuramente.

## 📋 Licença/License
Este projeto está licenciado sob a licença MIT — veja o arquivo 
[LICENSE](./LICENSE) para o texto completo.

O nome, o logotipo e a identidade visual da ONG Próxima Etapa são de 
propriedade da organização e não estão cobertos por esta licença, 
sendo utilizados neste projeto acadêmico com fins de identificação 
do parceiro institucional.
## 🔗 Referências e Materiais de Apoio

### 📚 Acadêmicas e Técnicas (Material da Disciplina)
1. **Documentação Oficial Android** – [developer.android.com](https://developer.android.com/) [1, 2].
2. **DEITEL, Paul.** *Android: Como Programar*. Bookman, 2ª Ed, 2015 [1, 2].
3. **DEITEL, Paul et al.** *Android para Programadores: Uma Abordagem Baseada em Aplicativos*. Bookman, 2ª Ed, 2015 [1, 2].
4. **Roteiro do Projeto Interdisciplinar** – *Próxima Etapa – App do Aluno* (Versão FINAL 2026) [3].
