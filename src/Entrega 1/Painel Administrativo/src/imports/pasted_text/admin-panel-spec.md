Especificação de Design — Painel Administrativo Próxima Etapa

Referência de escopo: módulo web administrativo, separado do app Android (Módulo Aluno), conforme definido no documento oficial do projeto (seção 3: "deverá ser construído um módulo web administrativo e/ou uma camada de integração que represente as funções necessárias para alimentar o aplicativo").

Entidades identificadas na documentação: Aluno, Curso, Atividade, Inscrição, Presença, Certificado, Card, TestePerfil, Pergunta, Alternativa, ResultadoPerfil, Mensagem, Notificação. A esse conjunto somam-se, por necessidade operacional do admin (não explícitas no PDF, mas inferidas — ver seção "Lacunas do briefing"), Universidade (já presente no seu Backend) e Usuário Administrador com controle de papel (role).

0. Lacunas do briefing que este spec resolve (justificativa)

O documento acadêmico define os requisitos do app do aluno (RFM01–RFM15) em detalhe, mas não especifica requisitos funcionais do admin — só menciona sua existência. Isso significa que qualquer painel construído precisa refletir, para cada entidade do aluno, sua contraparte de gestão:

Entidade do aluno (RFM)	Necessidade administrativa correspondente
RFM03/04 Cursos	CRUD de cursos, categorias, vagas
RFM05 Agenda	CRUD de atividades/encontros vinculados a cursos
RFM06/07 Presença	Validação/consulta de presenças, relatório de frequência
RFM08 Card do aluno	Aprovação de dados exibidos no card
RFM09 Certificados	Emissão condicionada a critérios, liberação, reemissão
RFM10 Testes de perfil	Cadastro de perguntas/alternativas, critérios de pontuação, resultados agregados
RFM11/13 Mensagens/Notificações	Composição e envio segmentado
RFM12 Chat	Fila de atendimento, se aplicável ao escopo do grupo
RFM14 Perfil	Aprovação/edição de dados de alunos, bloqueio
RFM15 Sincronização	Não tem tela — é infraestrutura, fica fora do escopo visual

Isso valida a decisão de escopo da seção 4 abaixo.

1. Estrutura Geral do Sistema
1.1 Sidebar (navegação primária)
Largura expandida: 260px · Largura colapsada: 72px (ícone-only, com tooltip ao hover)
Comportamento: fixa (position: sticky), colapsável por botão no topo; estado persistido em localStorage
Estrutura hierárquica (ordem por frequência de uso, não alfabética — princípio de produtividade do admin):
Visão Geral → Dashboard
Alunos → Listagem / Cadastro / Aprovações pendentes
Cursos (grupo expansível)
Cursos
Atividades/Encontros
Universidades
Presenças → Registros / Validação de QR Code
Certificados → Emitidos / Pendentes de liberação
Testes de Perfil (grupo expansível)
Testes (perguntas/alternativas)
Resultados
Comunicação (grupo expansível)
Mensagens/Notificações
Chat (se aplicável)
Relatórios
— divisor —
Administradores (visível só para role super_admin)
Auditoria/Logs (visível só para role super_admin)
Configurações
Item ativo: fundo com tint da cor primária a 8% de opacidade + borda esquerda de 3px na cor primária + peso de fonte 600 (nunca só mudança de cor de texto — falha comum de contraste)
Rodapé da sidebar: avatar do admin logado, nome, cargo/role, menu de logout
1.2 Navbar (barra superior, 64px de altura)
Esquerda: breadcrumb (ver 1.4)
Centro/direita: busca global (atalho Cmd/Ctrl+K, abre command palette estilo Linear/GitHub)
Direita: ícone de notificações com badge numérico → dropdown com lista das últimas 5 notificações do sistema (ex: "3 certificados aguardando aprovação") + link "ver todas"
Extremo direito: seletor de tema (claro/escuro), avatar com dropdown (Meu perfil, Configurações, Sair)
1.3 Dashboard principal

Ver seção 2 completa.

1.4 Breadcrumbs
Padrão: Início / Cursos / Editar curso: "Introdução à Lógica de Programação"
Cada nível é clicável exceto o atual (que fica em cor neutra, não-interativo, aria-current="page")
Em mobile, colapsa para botão "voltar" + título da página atual apenas
1.5 Sistema de notificações

Dois tipos, para não confundir "notificação que o admin manda pro aluno" com "notificação que o sistema manda pro admin":

Toasts (efêmeros, 4s, canto inferior direito): confirmações de ação — "Curso criado com sucesso", "Erro ao salvar: e-mail já cadastrado"
Central de notificações (persistente, no ícone de sino da navbar): eventos operacionais que exigem atenção — novas inscrições, certificados pendentes, falhas de sincronização com o app
1.6 Fluxo de navegação principal
Login → Dashboard → [Sidebar] → Listagem da entidade → 
  ├─ Nova entidade → Formulário → Salvar → volta à listagem (toast de sucesso)
  ├─ Editar → Formulário pré-preenchido → Salvar → volta à listagem
  ├─ Visualizar → Página de detalhe (read-only + ações contextuais)
  └─ Excluir → Modal de confirmação → Ação → volta à listagem
2. Dashboard
2.1 KPIs (cards de indicador, topo da página, grid de 4 colunas em desktop)

Baseados diretamente nos objetivos declarados no PDF ("impacto social", "acompanhamento da jornada do aluno"):

Alunos ativos — número + variação percentual vs. mês anterior (seta verde/vermelha)
Cursos em andamento — número + quantos encerram nos próximos 7 dias
Taxa de presença média — percentual (usa a mesma lógica de Coeficiente de Variação/dispersão pedida na UC de Análise Descritiva — reaproveitável como insight no admin)
Certificados emitidos no mês — número + comparação

Cada card: ícone à esquerda (24px), label em text-sm text-muted, valor em text-3xl font-semibold, variação em badge pequeno (verde 
#16A34A / vermelho 
#DC2626).

2.2 Gráficos (grid de 2 colunas abaixo dos KPIs)
Gráfico de linha: novas inscrições por semana (últimas 12 semanas) — para visualizar tendência de crescimento
Gráfico de barras: distribuição de alunos por curso (top 8 cursos + "outros")
Box Plot de dispersão de presença por curso — reaproveita diretamente a análise exigida na UC de Análise Descritiva de Dados (Coeficiente de Variação, outliers), dando ao admin visão de quais cursos têm frequência irregular
Gráfico de pizza/rosca: resultado agregado dos testes de perfil (quantos alunos em cada classificação)
2.3 Resumo operacional (lista lateral ou seção inferior)
Últimas 5 inscrições recebidas (nome, curso, data) com link direto
Certificados aguardando aprovação (contador + botão "revisar")
Alertas de sincronização com o app (se RFM15 falhar, aparece aqui)
3. Gestão de Usuários (Alunos)
3.1 Listagem
Tabela densa, paginação server-side (25/50/100 por página)
Colunas: Avatar+Nome, E-mail, Curso(s) inscrito(s) (badges, máx. 2 visíveis + "+N"), Status (Ativo/Bloqueado — badge colorido), Data de cadastro, Ações (ícones: ver, editar, bloquear, excluir)
Linha inteira clicável → vai para visualização detalhada; ícones de ação usam stopPropagation
Checkbox de seleção em massa → ações em lote: exportar selecionados, bloquear selecionados
3.2 Filtros avançados (painel lateral deslizante ou barra expansível acima da tabela)
Por status (ativo/bloqueado/pendente)
Por curso inscrito (multi-select)
Por universidade de origem (se aplicável ao seu modelo de dados)
Por faixa de data de cadastro (date range picker)
Botão "limpar filtros" sempre visível quando algum filtro está ativo
3.3 Pesquisa
Campo de busca acima da tabela, busca em nome/e-mail, debounce de 300ms, ícone de loading inline enquanto busca
3.4 Cadastro / Edição (mesmo formulário, modo diferenciado por presença de ID)
Modal para ações rápidas OU página dedicada para cadastro completo (recomendo página dedicada — o cadastro de aluno tem muitos campos: dados pessoais, vínculo com curso, LGPD)
Seções do formulário: Dados pessoais (nome, e-mail, CPF/documento se autorizado pela LGPD) → Dados de contato → Vínculos (cursos, universidade) → Preferências de notificação
Cada campo com validação inline (borda vermelha + mensagem abaixo, não só cor — para acessibilidade)
Checkbox obrigatório de consentimento LGPD ao cadastrar (exigência explícita do PDF, seção 2.2 e 5.2)
3.5 Exclusão
Nunca exclusão física por padrão — usar soft delete (status: inativo) para preservar histórico de presença/certificados (integridade referencial exigida na seção 5.2 do PDF: "uso adequado de chaves, restrições e transações")
Modal de confirmação exige digitar o nome do aluno para confirmar (padrão GitHub) quando a ação for exclusão definitiva (reservada a super_admin)
3.6 Visualização detalhada (página de perfil do aluno, visão do admin)
Header: avatar, nome, status, botões de ação rápida (editar, bloquear, enviar mensagem)
Abas: Visão geral (dados cadastrais) · Cursos (inscrições + progresso) · Presenças (histórico) · Certificados (emitidos) · Teste de perfil (resultado) · Atividade (log de ações do próprio aluno no app, se rastreado)
4. Gestão das Entidades do Sistema

Cada entidade abaixo segue o mesmo padrão estrutural (listagem → filtro → CRUD → detalhe), evitando reinvenção de padrão por tela — princípio de consistência (Nielsen).

4.1 Cursos
Campos: nome, descrição, categoria, carga horária, datas de início/fim, local, vagas totais/preenchidas, status (planejado/em andamento/encerrado)
Relacionamento: N atividades por curso, N alunos inscritos (via Inscrição)
Indicador visual de vagas: barra de progresso (preenchidas/total), vira vermelho ao atingir 100%
4.2 Atividades/Encontros
Vinculados obrigatoriamente a um curso (select com busca)
Campos: data, horário, local (presencial/online + link), tipo (aula/workshop/palestra)
Calendário visual como visualização alternativa à tabela (toggle lista/calendário)
4.3 Universidades
CRUD simples: nome, logo (upload), site, cursos parceiros vinculados
4.4 Presenças
Tela majoritariamente de consulta e validação, não de criação manual (presença nasce do check-in QR Code do app)
Filtro por curso/atividade/data
Ação manual de "registrar presença retroativa" exige justificativa (campo de texto obrigatório) — trilha de auditoria
4.5 Certificados
Status: Pendente de critério / Pronto para emissão / Emitido / Revogado
Regra de negócio visível na UI: mostrar quais critérios o aluno já cumpriu (checklist visual) antes de habilitar o botão "Emitir"
Botão "Emitir" desabilitado com tooltip explicando o que falta, se critérios não atendidos (evita erro do admin)
4.6 Testes de Perfil
Sub-área 1 — Construtor de teste: CRUD de Pergunta → cada pergunta tem N Alternativas → cada alternativa tem peso/pontuação por critério de classificação
Interface tipo "form builder" (drag-and-drop de perguntas, similar ao Google Forms/Typeform) — adequado pois o PDF exige "perguntas, alternativas, critérios de pontuação/classificação"
Sub-área 2 — Resultados: listagem agregada de ResultadoPerfil por aluno, com aviso fixo no topo da tela: "Resultados têm finalidade de orientação educacional, não devem ser tratados como diagnóstico psicológico" (exigência explícita do PDF, seção 3) — isso deve aparecer como um banner de atenção permanente nessa tela, não como rodapé discreto
4.7 Mensagens e Notificações
Compositor: campo de texto rico, seletor de destinatário (Todos / Grupo por curso / Aluno individual), agendamento opcional (enviar agora / agendar data-hora)
Histórico de envios com taxa de leitura (se rastreável)
5. Relatórios
Filtros comuns a todos os relatórios: período (date range), curso, universidade
Relatório de frequência: tabela + gráfico, exportável
Relatório de conclusão de cursos: taxa de conclusão, evasão
Relatório de impacto social: alunos atendidos, certificados emitidos, cursos ofertados — pensado para o "pitch" de apresentação final mencionado no PDF
Exportação: botões "Exportar PDF" e "Exportar Excel" no canto superior direito de cada relatório; gerar PDF com cabeçalho institucional (logo Próxima Etapa) e rodapé com data/hora de geração e admin responsável (rastreabilidade)
6. Segurança
6.1 Controle de permissões (níveis sugeridos, já que o PDF não define)
Papel	Permissões
viewer	Somente leitura em todas as áreas
operador	CRUD de Cursos, Atividades, Presenças, Mensagens — sem acesso a Administradores/Logs
super_admin	Acesso total, incluindo gestão de outros admins e exclusão definitiva
6.2 Logs de auditoria
Tabela: Data/hora, Admin responsável, Ação (criar/editar/excluir/emitir certificado/bloquear aluno), Entidade afetada, valor antes → depois (diff visual quando aplicável)
Filtrável por admin, por tipo de ação, por período — necessário para a exigência de "registro de logs" do PDF (seção 5.2)
6.3 Autenticação do admin
Login com e-mail/senha + espaço reservado para 2FA (mesmo que não implementado no MVP acadêmico, o campo de design deve prever)
Sessão expira após inatividade configurável, com aviso 2 minutos antes de expirar
7. Responsividade
Breakpoint	Comportamento
Desktop (≥1280px)	Sidebar expandida fixa, tabelas com todas as colunas, gráficos em grid 2 colunas
Tablet (768–1279px)	Sidebar colapsa para ícones por padrão, tabelas com scroll horizontal ou ocultam colunas secundárias (ex: "data de cadastro"), gráficos em coluna única
Mobile (<768px)	Sidebar vira drawer (menu hambúrguer), tabelas viram cards empilhados (cada linha → card com label+valor), formulários em coluna única, filtros avançados em modal full-screen

Admin de sistema é majoritariamente usado em desktop — mobile deve cobrir consulta e ações rápidas (aprovar certificado, bloquear aluno), não necessariamente a criação de formulários longos (ex: construtor de teste de perfil pode ser desktop-only, com aviso em mobile).

8. Design System
8.1 Paleta de cores
Primária: um azul institucional (ex: 
#2563EB) — neutro, confiável, comum em admin SaaS (Stripe/Linear usam tons próximos)
Neutros: escala de cinza de 10 tons (
#F9FAFB a 
#111827, padrão Tailwind Gray) para fundo, texto, bordas
Semânticas: sucesso 
#16A34A, erro 
#DC2626, alerta 
#D97706, informação 
#2563EB
Modo escuro: inverter escala de neutros, manter semânticas com ajuste de luminosidade (+10%) para contraste em fundo escuro
8.2 Tipografia
Fonte: Inter ou system-ui (leve, alta legibilidade em telas densas de dados)
Escala: text-xs (12px, labels/metadados) → text-sm (14px, corpo padrão em tabelas) → text-base (16px, formulários) → text-lg/xl/2xl/3xl (títulos de seção, KPIs, headers de página)
8.3 Espaçamento e grid
Escala de 4px (4, 8, 12, 16, 24, 32, 48, 64)
Grid de 12 colunas em desktop, container máximo 1440px, gutter de 24px
8.4 Componentes reutilizáveis e estados

Todo componente interativo precisa de 5 estados definidos como variantes no Figma: default, hover, focus (outline visível de 2px, nunca outline: none sem substituto — WCAG 2.4.7), disabled, loading/error quando aplicável.

9. Componentes Necessários (biblioteca base)
Botões: primário, secundário, ghost, destrutivo, ícone-only — tamanhos sm/md/lg
Inputs: texto, número, senha (com toggle mostrar/ocultar), textarea, com estado de erro e helper text
Selects: simples, multi-select com chips, combobox com busca (para vincular curso/aluno)
Tabelas: com sort por coluna, seleção em massa, paginação, estado vazio ilustrado, estado de loading (skeleton)
Modais: confirmação, formulário curto, tamanho sm/md/lg
Tooltips: para ícones sem label visível (acessibilidade)
Toasts: sucesso/erro/aviso/info, com auto-dismiss e botão de fechar manual
Cards: KPI, entidade (curso/aluno resumido), estado vazio
Upload de arquivos: drag-and-drop + clique, preview de imagem, barra de progresso
Calendário: visualização mensal/semanal para Atividades
10. Entrega para o Figma
10.1 Organização de páginas do arquivo Figma
📄 00 - Design System (cores, tipografia, espaçamento, componentes)
📄 01 - Fluxos e Wireframes (baixa fidelidade, para validação rápida)
📄 02 - Desktop (todas as telas em alta fidelidade)
📄 03 - Tablet
📄 04 - Mobile
📄 05 - Protótipo (conexões de fluxo, para apresentação/pitch)
10.2 Nomenclatura e tamanho dos frames

Convenção: [Plataforma]/[Área]/[Tela]-[estado]

Frame	Tamanho
Desktop/Dashboard/Overview	1440×1024
Desktop/Alunos/Listagem	1440×1024
Desktop/Alunos/Cadastro	1440×1024
Desktop/Alunos/Detalhe	1440×1200
Desktop/Cursos/Listagem	1440×1024
Desktop/Cursos/Form	1440×1024
Desktop/Atividades/Calendário	1440×1024
Desktop/Presencas/Listagem	1440×1024
Desktop/Certificados/Listagem	1440×1024
Desktop/TestePerfil/Construtor	1440×1200
Desktop/TestePerfil/Resultados	1440×1024
Desktop/Mensagens/Compositor	1440×1024
Desktop/Relatorios/Overview	1440×1200
Desktop/Admin/Usuarios	1440×1024
Desktop/Admin/Logs	1440×1024
Tablet/[mesma lista]	834×1194
Mobile/[mesma lista, telas prioritárias]	375×812
10.3 Auto Layout
Toda sidebar, navbar, linha de tabela, card e formulário deve ser Auto Layout (não posicionamento absoluto) — garante que o handoff para desenvolvimento reflita comportamento real de flexbox/grid
Espaçamento entre itens do Auto Layout deve usar os tokens da escala de 4px (seção 8.3), nunca valores livres
10.4 Variáveis de design (Figma Variables)
Coleção color/primitive (tons brutos) → coleção color/semantic (color-bg-primary, color-text-error etc.) referenciando os primitivos → permite trocar tema claro/escuro trocando o modo da variável, sem duplicar componentes
Coleção spacing e radius como variáveis numéricas
10.5 Componentes e variantes
Cada componente da seção 9 vira um Component Set no Figma com propriedades de variante (state, size, variant) — nunca componentes soltos duplicados manualmente para cada estado
Observações finais de UX
Evite excesso de aprovação manual: o PDF não define workflow de aprovação para inscrições — sugiro que inscrição em curso seja automática (respeitando vagas) e que apenas emissão de certificado exija aprovação humana, já que é o único ponto do PDF que menciona critério de liberação.
O aviso sobre testes de perfil não serem diagnóstico clínico (seção 3 do PDF) deve estar visível tanto no app do aluno quanto no admin — reforce isso como requisito de compliance, não só de design.
Como o backend real do projeto ainda está indefinido entre Node.js/Express+SQLite e Supabase (ver conversa anterior), a modelagem de permissões (seção 6.1) deve ser validada contra o mecanismo de auth escolhido antes da implementação — Supabase tem RLS nativo, Node/Express exigiria middleware próprio.