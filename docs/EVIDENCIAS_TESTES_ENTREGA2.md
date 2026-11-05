# Evidências de testes da Entrega 2

Consolidação dos resultados já registrados em 05/11/2026. A base técnica final é o commit `94bac71241964c22432b10e667db127e6f4c85e3`. As suítes de integração usam contas fictícias e bancos temporários. A inspeção do banco local foi somente leitura. Este documento registra resultados e pontos de reprodução, sem recriar logs de execução.

## Resultados por base

| Base | Verificação executada | Resultado registrado | Reprodução ou código |
| --- | --- | --- | --- |
| `94bac71` | Backend Node/Express | 47 testes aprovados e oito sondagens HTTP de rotas e perfis no servidor com banco temporário | [Suítes do backend](../src/Entrega%202/Backend2.0/test/) |
| `94bac71` | SQLite local | `integrity_check=ok`, versão 6, WAL, zero violações de chaves estrangeiras | [Procedimento SQLite](../src/Entrega%202/Backend2.0/database/MIGRATIONS.md) |
| `94bac71` | Painel | 21 testes e build aprovados | [Suítes do painel](../src/Entrega%202/Painel%20Administrativo2.0/test/) |
| `94bac71` | Android | APK debug e APK/AAB release gerados. 35 testes JVM aprovados. Lint debug com zero erros e 264 avisos. Lint vital release aprovado | [Testes JVM](../src/Entrega%202/Frontend2.0/app/src/test/) |
| `94bac71` | Emulador e presença | Instalação do APK atualizado e inicialização a frio com `Status: ok`. 14 testes de presença/SQLite aprovados, incluindo login, cursos, agenda, QR, check-in, recuperação e histórico | [Script de presença](../src/Entrega%202/Frontend2.0/scripts/test-presence-api.cjs) |
| `94bac71` | Variantes e rede | BuildConfig aceitou HTTPS fictício e recusou HTTP para release. Recursos empacotados confirmaram as exceções locais no debug e bloqueio de HTTP no release | [Configuração Gradle](../src/Entrega%202/Frontend2.0/app/build.gradle.kts) |
| `90e472c`, antes do ajuste de rede | Certificados | Quatro testes instrumentados aprovados, incluindo leitura offline. Evidência da Fase 1 anterior à correção | [Script de certificados](../src/Entrega%202/Frontend2.0/scripts/test-certificates-api.cjs) |
| `4510d85` e regressão em `90e472c` | Comunicados | Cinco cenários instrumentados aprovados e uma repetição da recuperação | [Script de mensagens](../src/Entrega%202/Frontend2.0/scripts/test-messages-api.cjs) |
| `90e472c` | Notificações | Seis cenários instrumentados aprovados e uma repetição após reconexão | [Script de notificações](../src/Entrega%202/Frontend2.0/scripts/test-notifications-api.cjs) |

A tentativa de comunicados durante a estabilização foi interrompida por indisponibilidade do emulador. Certificados, comunicados, notificações e cadastro não foram repetidos no APK final. Um verificador PowerShell reportou erro após a inicialização a frio por comparar as linhas do ADB como array. O retorno do ADB registrou `Status: ok`. A validação de rede do release foi local. Release assinado, HTTPS ponta a ponta público e submissão seguem pendentes.

Para repetir futuramente, use os comandos e o isolamento descritos no [guia técnico](ENTREGA2_GUIA_TECNICO.md). A [matriz acadêmica](MATRIZ_CONFORMIDADE_ACADEMICA.md) separa os resultados técnicos da submissão.
