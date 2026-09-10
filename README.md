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
  <img src="https://i.postimg.cc/TPFTYSp3/Imagem-Proxima-Etapa.png" alt="Logo Próxima Etapa" width="250">
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
├── 📂 app/
│   ├── 📄 build.gradle.kts
│   ├── 📂 gradle/
│   ├── 📄 gradlew
│   ├── 📄 gradlew.bat
│   ├── 📄 settings.gradle.kts
│   └── 📂 app/
│       ├── 📂 src/
│       │   ├── 📂 main/
│       │   │   ├── 📂 java/
│       │   │   ├── 📂 res/
│       │   │   │   ├── 📂 drawable/
│       │   │   │   ├── 📂 layout/
│       │   │   │   └── 📂 mipmap-*/
│       │   │   └── 📄 AndroidManifest.xml
│       │   ├── 📂 androidTest/
│       │   └── 📂 test/
│       └── 📄 build.gradle.kts
│
├── 📂 documentos/
│   ├── 📂 entrega-1/
│   ├── 📂 entrega-2/
│   ├── 📂 projeto-extensao/
│   │   └── 📄 Documento - Projeto de Extensão - COM Empresa - 2026_1.docx
│   └── 📂 apresentacoes/
│       └── 📄 MODELO_BANNER_FECAP_2026_1.pptx
│
├── 📂 imagens/
│   ├── 📂 logo/
│   ├── 📂 screenshots/
│   └── 📂 banner/
│       └── 📄 Venha para a FECAP!.txt
│
└── 📂 recursos/
    └── 📂 referencias/
```

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
Este projeto está licenciado sob a licença
Creative Commons Attribution 4.0 International (CC BY 4.0).

Para mais informações:

https://creativecommons.org/licenses/by/4.0/
## 🎓 Referências

Aqui estão as referências usadas no projeto.

1. <https://github.com/iuricode/readme-template>
2. <https://github.com/gabrieldejesus/readme-model>
3. <https://chooser-beta.creativecommons.org/>
4. <https://freesound.org/>
5. <https://www.toptal.com/developers/gitignore>
6. Músicas por: <a href="https://freesound.org/people/DaveJf/sounds/616544/"> DaveJf </a> e <a href="https://freesound.org/people/DRFX/sounds/338986/"> DRFX </a> ambas com Licença CC 0.
