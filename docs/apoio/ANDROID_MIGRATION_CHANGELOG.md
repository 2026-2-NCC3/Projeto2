# Changelog da migração Android

## Fase 1 — Estabilização — 05/11/2026

Base verificada: `90e472c0f35cf775fa50aa5be1e39eb7c50fe058`. Commit local da estabilização: `94bac71241964c22432b10e667db127e6f4c85e3`.

### Correção e rastreabilidade

| Escopo | Antes | Depois | Evidência |
| --- | --- | --- | --- |
| Configuração de rede Android, RNF de segurança e ambiente acessível | O endereço de desenvolvimento era fixo também no release | Debug preserva o loopback via ADB. Release aceita `proximaReleaseApiUrl` por HTTPS e informa quando está sem endereço | Gradle aceitou URL HTTPS de teste e rejeitou HTTP. APKs inspecionados têm regras de rede distintas |
| Ambiente acadêmico | Demonstração local disponível; URL de avaliação sem confirmação | PARCIALMENTE ATENDIDO | APK e API locais. A URL HTTPS autorizada e a validação externa continuam pendentes |
| Conformidade e documentação | Evidências dispersas e documentação histórica | PARCIALMENTE ATENDIDO | Matriz, guia técnico e inventário de lacunas, sem classificar modelos como materiais finais |

Alterados `app/build.gradle.kts`, manifesto principal, `ApiConfig.java`, `MainActivity.java`, `strings.xml` e a política de rede principal. Criados a política de rede da variante debug e três documentos em `docs/`. Nenhum arquivo removido. Sem dependências novas ou mudanças nos layouts, no Design System, na API, no painel, no esquema ou nas migrações.

### Validação

- Backend: 47 testes aprovados e oito sondagens de rotas e perfis no servidor Express com base temporária.
- SQLite local: verificação somente leitura com integridade OK, versão 6, WAL e zero violações de chaves estrangeiras.
- Painel: 21 testes e build aprovados.
- Android: APK debug e APK/AAB release gerados, 35 testes JVM aprovados, lint com 0 erros e 264 avisos. Lint vital de release passou. APK debug com assinatura verificada; artefatos release sem assinatura de distribuição.
- Lint: 14 avisos de correção/mensagens, 54 de desempenho, 13 de usabilidade, 4 de produtividade, 6 de acessibilidade e 173 de internacionalização. Priorizar avisos de correção e acessibilidade antes da migração visual. O AGP também alerta sobre o SDK de compilação 37.
- Emulador antes da correção: 14 execuções de presença/SQLite e 4 de certificados aprovadas. A execução de comunicados foi interrompida quando o emulador ficou indisponível. Evidências funcionais anteriores de comunicados e notificações permanecem nos commits `4510d85` e `90e472c`.
- APK atualizado: 14 testes de presença/SQLite aprovados após reiniciar o emulador, incluindo o fluxo com API real e base fictícia. A inicialização a frio de `MainActivity` retornou `Status: ok` no ADB. O verificador PowerShell marcou erro ao comparar cada linha do retorno como array, apesar do status de inicialização confirmado.
- As suítes de certificados, comunicados, notificações e cadastro não foram repetidas no APK final. A configuração HTTPS foi testada em build, com URL fictícia, e não há validação ponta a ponta em servidor público ou release assinado.

### Backup e recuperação

Diretório privado: `%LOCALAPPDATA%\ProximaEtapa-Backups\estabilizacao-20261105-173748-0824f67c`. Os arquivos `Projeto2.bundle` e `Projeto2-aninhado.bundle` passaram em `git bundle verify` com histórico completo. Para recuperar o estado inicial, clone o bundle principal em uma pasta nova com `git clone --branch fix/p0-seguranca-entrega2 CAMINHO_DO_BUNDLE DESTINO_NOVO`. O bundle aninhado pode ser clonado separadamente.

O arquivo `alteracoes-locais.zip.dpapi` registra os bytes dos arquivos alterados e o manifesto das nove ausências. A abertura foi verificada usando DPAPI na conta Windows atual. Para recuperar, use `ProtectedData.Unprotect` com escopo `CurrentUser` na mesma conta Windows e abra os bytes retornados como ZIP. Confira `manifesto.json` e aplique somente na cópia restaurada. O arquivo cifrado pode conter configurações locais sensíveis e deve permanecer privado.

### Pendências

URL HTTPS autorizada, assinatura de distribuição, materiais acadêmicos finais ainda não localizados, diagrama atualizado, README de POO e submissão institucional. A Fase 2 aguarda instrução. [Matriz de conformidade](MATRIZ_CONFORMIDADE_ACADEMICA.md)

## Fechamento documental da Entrega 2 — 05/11/2026

- E2-08 passou de NÃO ATENDIDO a ATENDIDO com o README de POO. E2-07, E2-09, E2-10 e E2-11 passaram de PARCIALMENTE ATENDIDO a ATENDIDO com README principal atualizado, diagramas do código atual, evidências consolidadas e catálogo dos contratos REST registrados.
- Criados README da UC, diagrama, evidências e contratos REST. Atualizados README principal, matriz, guia técnico e changelog. Código, configuração de execução e dependências permaneceram como na base técnica.
- A verificação documental cobre links relativos, correspondência de rotas com o servidor, contagem da matriz e `git diff --check`. Os resultados das suítes foram reaproveitados das bases identificadas no documento de evidências.
- A URL autorizada, a assinatura de distribuição, os materiais acadêmicos tratados separadamente e a submissão institucional seguem pendentes. O commit deste registro é identificável por `git log -1 --format=%H -- docs/EVIDENCIAS_TESTES_ENTREGA2.md`.

## Preparação local da submissão — 05/11/2026

- A inspeção do APK confirmou o ID, a versão 1.1.0, o SDK mínimo 24 e a assinatura v2. Os três binários passaram na verificação ZIP e tiveram SHA-256 registrado. A presença de um valor legado no APK debug impede incluí-lo no pacote sem revisão de distribuição.
- O checklist reúne inventário, classificação das pendências, instalação local e roteiro de demonstração. O pacote privado contém somente documentação técnica, com manifesto SHA-256.
- A matriz permanece em 8 atendidos, 5 parciais e 6 não atendidos. Foram aproveitados os resultados anteriores. A validação desta preparação é documental e de integridade, sem nova execução de suítes ou builds. [Checklist](CHECKLIST_SUBMISSAO_ENTREGA2.md)

## Fechamento controlado da Entrega 2 — 06/11/2026

- A inspeção do formato do valor legado identificou uma chave pública de cliente Supabase. Os hashes dos três binários permanecem idênticos aos da inspeção anterior. A assinatura e a instalação já documentadas foram reaproveitadas.
- O pacote técnico privado inclui o código versionado da Entrega 2, documentos técnicos e o APK debug. O checklist registra o conteúdo e as condições para demonstração e submissão.
- A API local e o fluxo obrigatório mantêm a cobertura registrada na Fase 1. O fechamento verificou a configuração e os artefatos existentes, sem novos builds ou suítes. O ambiente HTTPS, a assinatura release, os materiais acadêmicos pendentes e a autorização de submissão seguem separados. [Checklist](CHECKLIST_SUBMISSAO_ENTREGA2.md)
