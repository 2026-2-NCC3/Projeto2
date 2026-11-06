# Programação Orientada a Objetos

## Sobre o projeto

O projeto representa um sistema acadêmico que gerencia alunos, cursos, atividades, inscrições, presenças, certificados, testes de perfil, mensagens e notificações.

## Diagrama de Classes

O diagrama apresenta as principais classes do sistema, seus atributos, métodos e relacionamentos.

Os arquivos do diagrama estão disponíveis nesta pasta nos formatos PNG e Draw.io.

## Classes principais

O sistema contém as seguintes classes:

- Aluno
- Curso
- Atividade
- Inscricao
- Presenca
- Certificado
- Card
- TestePerfil
- Pergunta
- Alternativa
- ResultadoPerfil
- Mensagem
- Notificacao

Também foram utilizadas as enumerações StatusAluno e TipoAtividade.

## Princípios de Programação Orientada a Objetos

### Encapsulamento

Os atributos das classes são privados e os métodos públicos controlam as operações realizadas pelos objetos. Isso ajuda a proteger os dados e a organizar as responsabilidades de cada classe.

### Abstração

Cada classe representa uma entidade específica do sistema. Por exemplo, Aluno representa os dados e comportamentos de um aluno, enquanto Curso representa as informações e operações relacionadas aos cursos.

### Associação

As associações representam as relações entre as classes. Por exemplo, um aluno pode realizar inscrições, receber certificados, enviar mensagens e receber notificações.

### Composição

TestePerfil é composto por Pergunta, e Pergunta é composta por Alternativa. No diagrama, essas relações são representadas pelo losango preenchido.

## Organização da solução

As classes representam as entidades do sistema e suas responsabilidades. Os relacionamentos do diagrama mostram como essas entidades interagem, permitindo que o código seja desenvolvido de forma organizada e compatível com os princípios de Programação Orientada a Objetos.
