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

[Entrega 2 por disciplina e situação dos entregáveis](documentos/README.md#materiais-da-entrega-2).

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
com Volley e painel React/Vite. As referencias anteriores a PostgreSQL/Supabase
sao historicas; nao configuram o backend ativo da Entrega 2.

- [Materiais da Entrega 2 por disciplina e situação de cada item](documentos/README.md#materiais-da-entrega-2).
- [Guia de execução local](docs/ENTREGA2_GUIA_TECNICO.md#execução-local) e [evidências da Entrega 2](docs/EVIDENCIAS_TESTES_ENTREGA2.md).
- [README de POO e Estruturas de Dados](documentos/Entrega%202/Programa%C3%A7%C3%A3o%20Orientada%20a%20Objetos%20e%20Estrutura%20de%20Dados/README.md) e [diagrama de classes](docs/DIAGRAMA_CLASSES_ENTREGA2.md).

Pre-requisitos: Node.js 24 (validado), npm, Android Studio/JDK compativel com AGP
9.0.1 e SDK da plataforma 37.0. Use os wrappers e lockfiles versionados. O Gradle
wrapper atual e 9.5.0. AGP emite aviso de compatibilidade com SDK 37.0; nao foi
silenciado. Nunca use dados reais para reproduzir os testes.

No backend, execute a partir de src/Entrega 2/Backend2.0:

~~~sh
npm ci
# Crie um .env privado com JWT_SECRET aleatório próprio.
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
# Configure JAVA_HOME e ANDROID_HOME de acordo com seu ambiente.
./gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
~~~

**Debug.** Com o backend local na porta 3000, use `adb -s emulator-5554 reverse tcp:3000 tcp:3000` e substitua o serial quando necessário. O app acessa `http://127.0.0.1:3000`. O APK fica em `app/build/outputs/apk/debug/app-debug.apk`.

**Release.** Execute `gradlew.bat :app:assembleRelease :app:bundleRelease -PproximaReleaseApiUrl=https://HOST_AUTORIZADO` com a URL HTTPS real. Sem a propriedade, o app exibe um aviso de configuração. A compilação local gera artefatos sem assinatura de distribuição. A URL pública de avaliação ainda não foi confirmada.

Cursos, agenda e histórico consultam a API. A agenda usa as inscrições do aluno autenticado. O SQLite local mantém snapshots por conta e recibos de presença que o servidor confirmou. [Guia técnico](docs/ENTREGA2_GUIA_TECNICO.md)

No painel, execute em src/Entrega 2/Painel Administrativo2.0:

~~~sh
npm ci
npm run build
~~~

VITE_API_URL configura a API do painel; o padrao e http://localhost:3000.
O painel agora compila com metadados reais versionados e override Figma opcional;
veja [o guia de build](src/Entrega%202/Painel%20Administrativo2.0/BUILD.md).
O Android tambem gera AAB release local, nao assinado, com codigo 2 / nome 1.1.0;
veja [versionamento e limites de publicacao](src/Entrega%202/Frontend2.0/VERSIONING.md).
O maior versionCode publicado nao foi comprovado: este AAB nao e evidencia de
aceitacao pela loja, assinatura de producao ou publicacao.
O painel emite o QR com janela de validade e o aluno confirma a presença no Android. A integração com a API, a persistência e a reconciliação do histórico foram validadas no emulador com dados fictícios. Consulte as evidências para os limites de cada execução.

# Instalação

Para executar a Entrega 2, abra `src/Entrega 2/Frontend2.0` no Android Studio e prepare o backend e o encaminhamento ADB conforme a seção de reprodução acima. O clone remoto, por si só, não inclui os incrementos locais desta branch.

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

O debug usa o mesmo encaminhamento ADB em um aparelho conectado por USB. Use o serial exibido em `adb devices`. A instalação e os testes registrados para a Entrega 2 foram feitos no emulador. A distribuição release depende de assinatura autorizada e da URL HTTPS da API.

## 📋 Licença/License
Este projeto está licenciado sob a licença MIT — veja o arquivo 
[LICENSE](./LICENSE) para o texto completo.

O nome, o logotipo e a identidade visual da ONG Próxima Etapa são de 
propriedade da organização e não estão cobertos por esta licença, 
sendo utilizados neste projeto acadêmico com fins de identificação 
do parceiro institucional.
## 🔗 Referências e Materiais de Apoio

### Apoio operacional da Entrega 2

- [Matriz, checklist e changelog](docs/apoio/).
- [Banco novo, banco existente, transacoes e WAL](src/Entrega%202/Backend2.0/database/MIGRATIONS.md).
- [Provisionamento manual e rotacao pendente](src/Entrega%202/Backend2.0/database/ADMINISTRATORS.md).
- [Cache por usuario e limites de consulta offline](src/Entrega%202/Frontend2.0/OFFLINE.md).

### 📚 Acadêmicas e Técnicas (Material da Disciplina)
1. **Documentação Oficial Android** – [developer.android.com](https://developer.android.com/) [1, 2].
2. **DEITEL, Paul.** *Android: Como Programar*. Bookman, 2ª Ed, 2015 [1, 2].
3. **DEITEL, Paul et al.** *Android para Programadores: Uma Abordagem Baseada em Aplicativos*. Bookman, 2ª Ed, 2015 [1, 2].
4. **Roteiro do Projeto Interdisciplinar** – *Próxima Etapa – App do Aluno* (Versão FINAL 2026) [3].
5. **Inventário de Dados e API** – Documentação técnica do banco de dados PostgreSQL/Supabase e endpoints REST [4, 5].


## Programação Orientada a Objetos

A documentação da Entrega 2, incluindo o diagrama de classes, os princípios de POO e as estruturas de dados utilizadas, está disponível no link abaixo:

[Ver documentação de Programação Orientada a Objetos](documentos/Entrega%202/Programa%C3%A7%C3%A3o%20Orientada%20a%20Objetos/README.md)
