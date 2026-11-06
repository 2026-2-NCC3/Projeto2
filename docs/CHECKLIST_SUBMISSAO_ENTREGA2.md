# Checklist de submissão da Entrega 2

Preparação local em 05/11/2026, a partir de `707a09ebb6c47e53509ec099971c05b25f5e3e8a`. Os critérios e prazos da FECAP vêm da revisão já registrada na [matriz acadêmica](MATRIZ_CONFORMIDADE_ACADEMICA.md). Os caminhos desta página são relativos ao repositório. Os binários gerados ficam no computador de preparação.

Fechamento controlado em 06/11/2026, sobre `816dd7ff2e3132e5249940100e925f85281866d0`. Prazo registrado para a Entrega 2 e o documento de extensão: **06/11/2026 às 23:59:56**.

## Inventário para conferência

| ID | Entregável e caminho real | Situação e evidência | Bloqueio de entrega |
| --- | --- | --- | --- |
| E2-01 | [Código Android](../src/Entrega%202/Frontend2.0/) | Parcial. Presença, sincronização, certificados, mensagens e alertas internos têm evidências | Integrações complementares da matriz |
| E2-02 | [Backend Express](../src/Entrega%202/Backend2.0/server.js) | Parcial. 47 testes e oito sondagens já registrados | Funções sem rota e ambiente de avaliação |
| E2-03 | [Esquema, migrações e backup](../src/Entrega%202/Backend2.0/database/) | Atendido. Integridade e chaves estrangeiras conferidas na Fase 1 | Preparar base autorizada se houver ambiente de avaliação |
| E2-04 | [Painel administrativo](../src/Entrega%202/Painel%20Administrativo2.0/) | Parcial. Build, 21 testes e fluxos integrados registrados | Integração de perfil e chat |
| E2-05 | [APK debug](../src/Entrega%202/Frontend2.0/app/build/outputs/apk/debug/app-debug.apk), [APK release](../src/Entrega%202/Frontend2.0/app/build/outputs/apk/release/app-release-unsigned.apk) e [AAB release](../src/Entrega%202/Frontend2.0/app/build/outputs/bundle/release/app-release.aab) | Atendido para execução local em debug. Hash idêntico ao artefato já inspecionado e chave legada classificada | Release requer URL autorizada e assinatura de distribuição. Execução em celular físico ainda não comprovada |
| E2-06 | Código e histórico em `fix/p0-seguranca-entrega2` | Atendido. Commits locais e bundle privado verificado na Fase 1 | Submissão registrada em E2-19 |
| E2-07 | [README principal](../README.md) | Atendido. Configuração debug/release e referência à UC | — |
| E2-08 | [README de POO](../documentos/Entrega%202/Programa%C3%A7%C3%A3o%20Orientada%20a%20Objetos%20e%20Estrutura%20de%20Dados/README.md) | Atendido. Classes e estruturas presentes no código | — |
| E2-09 | [Diagrama de classes](DIAGRAMA_CLASSES_ENTREGA2.md) | Atendido para a implementação atual | Atualizar após novas integrações |
| E2-10 | [Evidências consolidadas](EVIDENCIAS_TESTES_ENTREGA2.md) | Atendido. Resultados e bases identificados, com scripts de reprodução | A demonstração para avaliação permanece separada |
| E2-11 | [Contratos REST](API_REST_ENTREGA2.md) | Atendido. 52 operações registradas | — |
| E2-12 | Estatística da E2, caminho final não localizado | Não atendido. Evidência existente da E1 | Missão acadêmica separada |
| E2-13 | Pitch e apresentação, caminho final não localizado | Não atendido | Missão acadêmica separada |
| E2-14 | Ambiente acessível, URL não confirmada | Parcial. Demonstração local documentada | URL HTTPS, ambiente e acesso de avaliação autorizados |
| E2-15 | Relatório final, caminho final não localizado | Não atendido | Missão acadêmica separada |
| E2-16 | [Modelo de banner](../documentos/MODELO_BANNER_FECAP_2026_1.pptx) | Não atendido. Modelo institucional | Material final e aprovação na missão separada |
| E2-17 | [Modelo de extensão COM EMPRESA](../documentos/Documento%20-%20Projeto%20de%20Extens%C3%A3o%20-%20COM%20Empresa%20-%202026_1.docx) | Não atendido. Modelo sem preenchimento final | Material final validado na missão separada |
| E2-18 | [Visão técnica em inglês](ENTREGA2_GUIA_TECNICO.md#technical-overview) | Parcial. Visão técnica escrita | Relatório e apresentação em inglês na etapa acadêmica |
| E2-19 | [Checklist local](CHECKLIST_SUBMISSAO_ENTREGA2.md) | Não atendido. Pacote técnico local preparado | Autorização, canal institucional, materiais completos e recebimento comprovado |

## Classificação das 11 pendências da matriz

| Categoria | Itens e encaminhamento |
| --- | --- |
| 1. Resolúvel com arquivos locais | Três parcelas desta missão: identificação e integridade do APK em E2-05, roteiro local de API e Android em E2-14 e inventário com pacote documental em E2-19. As duas últimas parcelas reduzem o trabalho de preparação, sem comprovar avaliação externa ou submissão. |
| 2. Configuração, credencial ou ambiente externo | E2-14 depende de ambiente, URL HTTPS e teste de acesso autorizados. E2-19 depende do canal, da autorização e do comprovante de recebimento. A distribuição como release requer assinatura autorizada. |
| 3. Integração ou funcionalidade ausente | E2-01, E2-02 e E2-04 mantêm as lacunas funcionais descritas na matriz. As integrações ficam bloqueadas para autorização posterior. E2-02 também depende do ambiente de E2-14. |
| 4. Missão acadêmica separada | E2-12, E2-13, E2-15, E2-16, E2-17 e a parcela restante de E2-18. A situação foi reaproveitada da matriz anterior. |

## Identificação dos artefatos

O APK debug tem rótulo `ProjetoPI`, ID `com.example.projetopi`, versão `1.1.0`, código `2`, SDK mínimo 24 e alvo 37. A inspeção confirmou uma assinatura APK v2 e integridade ZIP. A instalação e a inicialização no emulador, além dos 14 testes de presença e SQLite do APK atualizado, são evidências da Fase 1.

| Arquivo | Bytes | SHA-256 da cópia local |
| --- | ---: | --- |
| `app-debug.apk` | 7311255 | `b69f4863b58d9e98d1ebf960252faa2430d380f216d8b08a6d2ddf2314e99aa0` |
| `app-release-unsigned.apk` | 5150851 | `00f983a2501f920d0b5a0391bc5434ca8e15c656f557c8ce44f65fb7b71988ec` |
| `app-release.aab` | 4566717 | `25d4b360ebf8c0efe6559f7dc2c192d6c9e78168e97467aaa9897b6383be1f7c` |

O debug usa `http://127.0.0.1:3000` dentro do dispositivo. Em um celular físico, depende de Android compatível, depuração USB autorizada, ADB e encaminhamento para o computador que executa a API. A assinatura debug pode impedir atualização sobre uma instalação com assinatura diferente. O funcionamento em celular físico ainda não foi comprovado. O release exige `-PproximaReleaseApiUrl=https://HOST_AUTORIZADO` no build e assinatura autorizada para distribuição.

O valor `KEY` incorporado nos três binários tem o formato `sb_publishable_…`. A documentação do Supabase classifica esse formato como chave pública para clientes móveis e web, de baixo privilégio. Acesso aos dados depende dos grants e das políticas RLS aplicáveis. A classe `SupabaseConfig` está no código, mas a busca dirigida encontrou somente sua declaração. A API ativa é Express com SQLite. A revisão classificou o formato localmente, sem consultar o projeto Supabase, validar a chave ou verificar as políticas remotas. A presença dessa chave não exige bloquear o APK como se contivesse uma credencial privilegiada. [Tipos de chave e permissões no Supabase](https://supabase.com/docs/guides/getting-started/api-keys#key-types)

Os três SHA-256 foram reconferidos em 06/11 e coincidem com a inspeção anterior. A assinatura APK v2 e a instalação no emulador continuam vinculadas ao mesmo binário debug. O release permanece sem assinatura de distribuição.

## Roteiro de instalação e demonstração local

1. Na pasta [Backend2.0](../src/Entrega%202/Backend2.0/), use Node.js 24 e execute `npm ci` com o lockfile. O backend usa Express, SQLite via `better-sqlite3`, dotenv, JWT e bcrypt. Configure `JWT_SECRET` em `.env` privado e aponte `DB_PATH` para a base isolada de demonstração. Use `npm run db:init` somente para banco vazio. Para base existente, consulte [migrações e backup](../src/Entrega%202/Backend2.0/database/MIGRATIONS.md).
2. Execute `npm start` e confira `http://127.0.0.1:3000/api/health` no host. O servidor escuta em `0.0.0.0` por padrão. Mantenha a execução em ambiente local controlado, sem abrir portas externas. Use contas de demonstração já autorizadas, com um aluno inscrito em atividade e um administrador para emitir o QR.
3. Na pasta [Painel Administrativo2.0](../src/Entrega%202/Painel%20Administrativo2.0/), execute `npm ci` e `npm run dev -- --host 127.0.0.1`. Abra o endereço informado pelo Vite. A API padrão do painel é `http://localhost:3000`. Se mudar a base local, use `VITE_API_URL`.
4. Com o emulador em execução, use `adb devices`, `adb -s emulator-5554 reverse tcp:3000 tcp:3000` e `adb -s emulator-5554 install -r "CAMINHO_DO_APK_DEBUG"`. Substitua serial e caminho pelos valores locais. Se a assinatura impedir a atualização, use um emulador de teste compatível.
5. No app, faça login, abra Cursos e Agenda, leia um QR emitido pelo painel para a atividade e confira a presença no histórico. Mostre a consulta local e a atualização após reconexão. Com registros existentes, demonstre comunicados e alertas internos e consulte metadados de certificados. Os [resultados anteriores](EVIDENCIAS_TESTES_ENTREGA2.md) delimitam os cenários validados.

O fluxo obrigatório já tem evidência de autenticação, permissões de aluno e administrador, check-in, persistência e reconciliação em ambiente isolado. As evidências do backend e do SQLite registram 47 testes, oito sondagens e integridade verificada. O build release aceita URL HTTPS, mas o servidor Node atual abre HTTP. Uma avaliação externa requer um host HTTPS autorizado, certificado confiável pelo Android e encaminhamento à API, com base e contas autorizadas. O emulador com ADB permanece como alternativa local.

## Pacote técnico local

`%LOCALAPPDATA%\ProximaEtapa-Entrega2\fechamento-20261106-816dd7f\Entrega2-Tecnica-Local.zip` reúne o código versionado dos três módulos da Entrega 2, oito documentos técnicos e o APK debug no caminho listado no inventário. O manifesto SHA-256 permite verificar cada entrada. As referências a release e materiais acadêmicos externos ao pacote apontam para o repositório de origem. Configurações locais, bases, dados reais, chaves de assinatura, histórico Git, artefatos release e modelos acadêmicos ficaram fora do ZIP.

Para submeter, confira o manifesto, reúna os materiais finais dos responsáveis e confirme com a equipe se o canal institucional aceita a demonstração local ou exige avaliação externa. A publicação requer autorização expressa e acesso ao canal. Registre o comprovante institucional depois do envio autorizado.
