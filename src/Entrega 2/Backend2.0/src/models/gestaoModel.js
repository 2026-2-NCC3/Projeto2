'use strict';

// Estatísticas derivadas exclusivamente das tabelas existentes do schema v5.
// Não se utiliza seeds, caches ou números fixos de demonstração.
const bancoPadrao = require('../../database/database');

function modeloGestao(db = bancoPadrao) {
  const first = (sql, ...params) => db.prepare(sql).get(...params);
  const all = (sql, ...params) => db.prepare(sql).all(...params);
  const count = (sql, ...params) => first(sql, ...params).total;
  const rounded = (n) => n == null ? null : Math.round(Number(n) * 10) / 10;

  function periodoInicio(periodo) {
    const modificadores = { '6m': '-5 months', '12m': '-11 months', ano: 'start of year' };
    const modifier = modificadores[periodo];
    if (!modifier) throw new RangeError('Período inválido');
    return first("SELECT date('now', 'start of month', ?) AS inicio", modifier).inicio;
  }

  // Denominador: encontros já realizados × inscrições não canceladas existentes
  // até a data da atividade. Não é possível inferir presença de aluno cancelado
  // no passado (não existe data de cancelamento no schema).
  const OPORTUNIDADES = `
    FROM atividades a
    INNER JOIN inscricoes i ON i.curso_id = a.curso_id
      AND i.status IN ('inscrito','cursando','concluido')
      AND date(i.criado_em) <= date(a.data)
    LEFT JOIN presencas p ON p.atividade_id = a.id AND p.inscricao_id = i.id
    WHERE date(a.data) <= date('now')`;

  function indicadores() {
    const alunos = first(`
      SELECT COUNT(*) AS total,
             COALESCE(SUM(CASE WHEN u.ativo=1 AND a.bloqueado=0 THEN 1 ELSE 0 END),0) AS ativos
      FROM alunos a INNER JOIN usuarios u ON u.id = a.usuario_id
      INNER JOIN papeis pap ON pap.usuario_id=u.id AND pap.papel='aluno'`);
    const cursos = first(`SELECT COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status='em_andamento' THEN 1 ELSE 0 END),0) AS andamento,
      COALESCE(SUM(CASE WHEN status='encerrado' THEN 1 ELSE 0 END),0) AS encerrados
      FROM cursos`);
    const inscricoes = first(`SELECT COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status='concluido' THEN 1 ELSE 0 END),0) AS concluidas,
      COALESCE(SUM(CASE WHEN status='cursando' THEN 1 ELSE 0 END),0) AS cursando,
      COALESCE(SUM(CASE WHEN status='cancelado' THEN 1 ELSE 0 END),0) AS canceladas
      FROM inscricoes`);
    const geralPresencas = first(`SELECT COUNT(*) AS oportunidades, COUNT(p.id) AS confirmadas ${OPORTUNIDADES}`);
    return {
      usuarios_total: count('SELECT COUNT(*) AS total FROM usuarios'),
      alunos_total: alunos.total,
      alunos_ativos: alunos.ativos,
      cursos_total: cursos.total,
      cursos_em_andamento: cursos.andamento,
      cursos_encerrados: cursos.encerrados,
      inscricoes_total: inscricoes.total,
      inscricoes_cursando: inscricoes.cursando,
      inscricoes_concluidas: inscricoes.concluidas,
      inscricoes_canceladas: inscricoes.canceladas,
      presencas_registradas: count('SELECT COUNT(*) AS total FROM presencas'),
      taxa_presenca: geralPresencas.oportunidades ? rounded(100 * geralPresencas.confirmadas / geralPresencas.oportunidades) : null,
      oportunidades_presenca: geralPresencas.oportunidades,
      certificados_emitidos: count("SELECT COUNT(*) AS total FROM certificados WHERE status='emitido'"),
      certificados_pendentes: count("SELECT COUNT(*) AS total FROM certificados WHERE status IN ('pendente','pronto')"),
      atividades_total: count('SELECT COUNT(*) AS total FROM atividades'),
      avaliacoes_agendadas: count("SELECT COUNT(*) AS total FROM atividades WHERE tipo='avaliacao'"),
      testes_perfil_respondidos: count('SELECT COUNT(*) AS total FROM resultados_perfil'),
      universidades_total: count('SELECT COUNT(*) AS total FROM universidades'),
      horas_ofertadas: count('SELECT COALESCE(SUM(carga_horaria_horas),0) AS total FROM cursos'),
      alunos_com_inscricao: count('SELECT COUNT(DISTINCT aluno_id) AS total FROM inscricoes'),
      inscricoes_hoje: count("SELECT COUNT(*) AS total FROM inscricoes WHERE date(criado_em)=date('now')"),
      acessos_ultimos_7dias: count("SELECT COUNT(*) AS total FROM acessos WHERE datetime(criado_em) >= datetime('now','-7 days')"),
    };
  }

  function inscricoesPorSemana() {
    return all(`SELECT date(criado_em,
      '-' || ((CAST(strftime('%w', criado_em) AS INTEGER) + 6) % 7) || ' days') AS semana,
      COUNT(*) AS total FROM inscricoes
      WHERE date(criado_em) >= date('now','-83 days')
      GROUP BY semana ORDER BY semana ASC`);
  }

  function alunosPorCurso() {
    return all(`SELECT c.id, c.titulo AS curso, COUNT(i.id) AS alunos
      FROM cursos c LEFT JOIN inscricoes i ON i.curso_id=c.id AND i.status!='cancelado'
      GROUP BY c.id ORDER BY alunos DESC, c.titulo ASC LIMIT 8`);
  }

  function perfis() {
    return all(`SELECT classificacao_final AS nome, COUNT(*) AS total
      FROM resultados_perfil GROUP BY classificacao_final ORDER BY total DESC, nome ASC`);
  }

  function ultimasInscricoes() {
    return all(`SELECT i.id, u.nome_completo AS aluno, c.titulo AS curso,
      i.status, i.criado_em AS data
      FROM inscricoes i INNER JOIN usuarios u ON u.id=i.aluno_id
      INNER JOIN cursos c ON c.id=i.curso_id
      ORDER BY i.criado_em DESC, i.id DESC LIMIT 10`);
  }

  function ultimaAtividade() {
    // Fluxo real de eventos do sistema, sem inventar notificações não lidas.
    return all(`SELECT acao, entidade, entidade_id, criado_em, autor FROM (
      SELECT l.acao, l.entidade, l.entidade_id, l.criado_em,
             COALESCE(u.nome_completo, 'Sistema') AS autor
      FROM audit_logs l LEFT JOIN usuarios u ON u.id=l.usuario_id
      UNION ALL
      SELECT 'inscricao' AS acao, 'inscricoes' AS entidade, i.id AS entidade_id,
             i.criado_em, u.nome_completo AS autor
      FROM inscricoes i INNER JOIN usuarios u ON u.id=i.aluno_id
    ) ORDER BY criado_em DESC LIMIT 12`);
  }

  function quantil(values, fraction) {
    const ordered = [...values].sort((a,b) => a-b);
    if (!ordered.length) return null;
    const index = (ordered.length-1)*fraction;
    const lower = Math.floor(index), upper = Math.ceil(index);
    return rounded(ordered[lower] + (ordered[upper] - ordered[lower]) * (index-lower));
  }

  function dispersaoPresenca() {
    const rows = all(`SELECT c.id, c.titulo AS curso, i.id AS inscricao_id,
         COUNT(a.id) AS oportunidades, COUNT(p.id) AS presentes
      FROM cursos c INNER JOIN inscricoes i ON i.curso_id=c.id
        AND i.status IN ('inscrito','cursando','concluido')
      LEFT JOIN atividades a ON a.curso_id=c.id
        AND date(a.data)<=date('now') AND date(a.data)>=date(i.criado_em)
      LEFT JOIN presencas p ON p.atividade_id=a.id AND p.inscricao_id=i.id
      GROUP BY c.id, i.id ORDER BY c.titulo`);
    const byCourse = new Map();
    for (const row of rows) {
      if (!byCourse.has(row.id)) byCourse.set(row.id,{curso:row.curso, values:[]});
      if (row.oportunidades > 0) byCourse.get(row.id).values.push(rounded(100*row.presentes/row.oportunidades));
    }
    return [...byCourse.values()].filter(x=>x.values.length).slice(0,8).map(x=>({
      curso:x.curso, alunos_amostrados:x.values.length,
      min:quantil(x.values,0), q1:quantil(x.values,.25),
      mediana:quantil(x.values,.5), q3:quantil(x.values,.75),max:quantil(x.values,1),
    }));
  }

  function dashboard() {
    return {
      atualizado_em: new Date().toISOString(),
      indicadores: indicadores(),
      inscricoes_semanais: inscricoesPorSemana(),
      alunos_por_curso: alunosPorCurso(),
      resultados_perfil: perfis(),
      dispersao_presenca: dispersaoPresenca(),
      ultimas_inscricoes: ultimasInscricoes(),
      atividades_recentes: ultimaAtividade(),
      acessos_recentes: all(`SELECT ac.id, u.nome_completo AS usuario, ac.criado_em
        FROM acessos ac JOIN usuarios u ON u.id=ac.usuario_id
        ORDER BY ac.criado_em DESC, ac.id DESC LIMIT 10`),
    };
  }

  function relatorios(periodo='6m', cursoId=null) {
    const inicio = periodoInicio(periodo);
    const filter = cursoId ? ' AND a.curso_id=?' : '';
    const params = cursoId ? [inicio, cursoId] : [inicio];
    const mensal = all(`SELECT substr(a.data,1,7) AS mes,
         COUNT(*) AS oportunidades, COUNT(p.id) AS confirmadas
         ${OPORTUNIDADES} AND date(a.data)>=date(?)${filter}
         GROUP BY substr(a.data,1,7) ORDER BY mes`, ...params).map(row=>({
           ...row, taxa:row.oportunidades ? rounded(100*row.confirmadas/row.oportunidades) : null,
         }));
    const where = cursoId ? 'WHERE c.id=?' : '';
    const cursos = all(`SELECT c.id,c.titulo AS curso,
         COUNT(i.id) AS inscritos,
         COALESCE(SUM(CASE WHEN i.status='concluido' THEN 1 ELSE 0 END),0) AS concluidos,
         COALESCE(SUM(CASE WHEN i.status='cancelado' THEN 1 ELSE 0 END),0) AS cancelados
         FROM cursos c LEFT JOIN inscricoes i ON i.curso_id=c.id
         ${where} GROUP BY c.id ORDER BY c.titulo`, ...(cursoId?[cursoId]:[]));
    const taxas = all(`SELECT a.curso_id, COUNT(*) AS oportunidades, COUNT(p.id) AS confirmadas
         ${OPORTUNIDADES} AND date(a.data)>=date(?)${filter}
         GROUP BY a.curso_id`, ...params);
    const taxasById = new Map(taxas.map(x=>[x.curso_id,x]));
    const rows = cursos.map(c=>{
      const t=taxasById.get(c.id);
      return {...c,
        taxa_presenca: t?.oportunidades ? rounded(100*t.confirmadas/t.oportunidades) : null,
        presencas_confirmadas: t?.confirmadas ?? 0,
        oportunidades_presenca:t?.oportunidades ?? 0,
        taxa_conclusao:c.inscritos ? rounded(100*c.concluidos/c.inscritos) : null,
      };
    });
    return { periodo, inicio, atualizado_em:new Date().toISOString(),
      cursos_opcoes:all('SELECT id, titulo FROM cursos ORDER BY titulo'),
      indicadores:indicadores(), presenca_mensal:mensal,
      conclusao_por_curso:rows.map(({id,curso,concluidos,cancelados})=>({id,curso,concluidos,cancelados})),
      frequencia_por_curso:rows,
    };
  }

  function auditoria() {
    return all(`SELECT l.id, l.criado_em, l.acao, l.entidade,
      l.entidade_id, COALESCE(u.nome_completo,'Sistema') AS autor
      FROM audit_logs l LEFT JOIN usuarios u ON u.id=l.usuario_id
      ORDER BY l.criado_em DESC LIMIT 100`);
  }

  return { dashboard, relatorios, auditoria, eventos: ultimaAtividade, periodoInicio };
}

module.exports = { modeloGestao };
