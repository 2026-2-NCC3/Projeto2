# Programação Orientada a Objetos e Estrutura de Dados — Entrega 2

O Android organiza o código em telas, serviços de apoio e modelos Java. O backend Express usa módulos JavaScript de rotas, controladores e acesso a dados. O diagrama separa os modelos declarados do fluxo Android que consome JSON. [Diagrama de classes](../../../docs/DIAGRAMA_CLASSES_ENTREGA2.md)

## Princípios aplicados

| Princípio | Aplicação no código |
| --- | --- |
| Encapsulamento | `Aluno` e `Curso` mantêm o identificador privado e final. `atualizarDados` centraliza validações. `Presenca` verifica se a atividade pertence ao curso da inscrição. `SessionManager` concentra acesso e limpeza da sessão. |
| Abstração e herança | `DataListActivity` concentra carregamento, cache e ciclo de vida. `CursosActivity`, `AgendaActivity`, `HistoricoActivity`, `CertificatesActivity`, `MessagesActivity` e `NotificationsActivity` fornecem rota, tipo e título próprios. |
| Polimorfismo | As telas sobrescrevem os métodos da classe-base. O transporte de `PresenceSynchronizer` é expresso por uma interface e permite substituir o acesso à rede nos testes. |
| Composição e delegação | `ApiClient` delega requisições ao Volley. `DataListActivity` combina cliente HTTP, sessão, persistência e sincronizador. Os controladores do backend delegam consultas e escritas aos módulos de modelo. |

## Estruturas de dados

- **Conjuntos.** `ApiRecords.parse` usa `HashSet` para rejeitar IDs duplicados no snapshot. O histórico usa um conjunto de IDs já detalhados para evitar repetir recibos locais. A inserção e a consulta têm custo médio constante por ID.
- **Mapas.** `SyncGate` usa `HashMap` para controlar o ticket pendente por versão de sessão e recurso. Os métodos sincronizados evitam alterações concorrentes ao registro de tickets. `ApiClient` usa um mapa para os cabeçalhos HTTP.
- **Sequências JSON.** `JSONArray` mantém a sequência retornada pela API. `ApiRecords` valida os registros e seleciona os campos permitidos antes do uso e armazenamento.
- **Tabelas e chaves compostas.** `LocalStudentStore` separa snapshots por proprietário e recurso, e recibos por proprietário e origem. O SQLite impede duplicatas por inscrição e atividade no escopo do recibo. No backend, a restrição `UNIQUE(inscricao_id, atividade_id)` protege a presença persistida.

Os cinco modelos do pacote `model` são classes Java existentes. As telas integradas leem os registros projetados da API em JSON. Certificados, mensagens e notificações usam contratos e módulos de backend próprios. A existência de tabelas de card e testes de perfil não comprova integração dessas funções.

- [Código Android da Entrega 2](../../../src/Entrega%202/Frontend2.0/app/src/main/java/com/example/projetopi/)
- [Modelos do backend](../../../src/Entrega%202/Backend2.0/src/models/)
- [Evidências de integração](../../../docs/EVIDENCIAS_TESTES_ENTREGA2.md)
