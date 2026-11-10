import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, BookOpen, CheckSquare, Award, RefreshCw, ClipboardList, GraduationCap } from 'lucide-react';
import { obterDashboardGestao } from '../services/api';

const fmt = new Intl.NumberFormat('pt-BR');
const moneyless = n => n == null ? '—' : fmt.format(n);
const dataPt = data => data ? new Date(data).toLocaleDateString('pt-BR') : '—';
const palette = ['#7214FA','#51C403','#EEC545','#A56BF7','#1C7F9B','#DE7B90','#5D7193','#9D9D9D'];
const chartStyle = {fontSize:11,fill:'#8D87A0'};

function Panel({title, subtitle, children}) {
  return <section className="bg-white rounded-xl border border-gray-200 p-5 min-w-0">
    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    {subtitle && <p className="text-xs text-gray-500 mt-1 mb-4">{subtitle}</p>}
    {children}
  </section>;
}
function Empty({children='Nenhum dado registrado para este indicador.'}) {
  return <p className="text-sm text-gray-500 text-center py-12" role="status">{children}</p>;
}
function KPI({label,value,icon:Icon,note}) {
  return <div className="rounded-xl border border-gray-200 bg-white p-5">
    <div className="p-2 w-fit rounded-lg bg-purple-50 text-purple-700 mb-3"><Icon size={20}/></div>
    <p className="text-3xl font-semibold text-gray-900">{value}</p>
    <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
    {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
  </div>;
}

export default function Dashboard({ onNavigate }) {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [attempt,setAttempt] = useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true); setError('');
    obterDashboardGestao({signal:controller.signal})
      .then(result=>{if(!result?.indicadores || !Array.isArray(result.ultimas_inscricoes)) throw Error('Resposta incompleta'); if(!controller.signal.aborted)setData(result);})
      .catch(()=>{if(!controller.signal.aborted){setData(null);setError('Não foi possível consultar as métricas do sistema.');}})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[attempt]);

  const stats=data?.indicadores;
  const perfil=data?.resultados_perfil ?? [];
  const weekly=(data?.inscricoes_semanais??[]).map(x=>({semana:dataPt(x.semana),inscricoes:x.total}));
  const courses=data?.alunos_por_curso??[];
  const dispersion=data?.dispersao_presenca??[];
  return <div className="p-6 space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-semibold text-gray-900">Visão geral</h1>
      <p className="text-sm text-gray-500 mt-1">Indicadores reais do banco de dados {data?.atualizado_em && `· atualizado ${new Date(data.atualizado_em).toLocaleString('pt-BR')}`}</p></div>
      <button className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm flex gap-2 items-center" onClick={()=>setAttempt(v=>v+1)}><RefreshCw size={15}/> Atualizar</button>
    </header>
    {loading && <p role="status" className="text-gray-500">Consultando indicadores...</p>}
    {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error} <button className="underline" onClick={()=>setAttempt(x=>x+1)}>Tentar novamente</button></div>}
    {stats && !loading && <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI label="Alunos ativos" icon={Users} value={moneyless(stats.alunos_ativos)} note={`${moneyless(stats.usuarios_total)} usuários cadastrados no total`}/>
        <KPI label="Cursos em andamento" icon={BookOpen} value={moneyless(stats.cursos_em_andamento)} note={`${moneyless(stats.cursos_total)} cursos cadastrados`}/>
        <KPI label="Taxa de presença" icon={CheckSquare} value={stats.taxa_presenca == null ? 'Sem base' : `${stats.taxa_presenca}%`} note={`${moneyless(stats.presencas_registradas)} registros · ${moneyless(stats.oportunidades_presenca)} oportunidades elegíveis`}/>
        <KPI label="Certificados emitidos" icon={Award} value={moneyless(stats.certificados_emitidos)} note={`${moneyless(stats.certificados_pendentes)} pendentes ou prontos`}/>
        <KPI label="Inscrições concluídas" icon={GraduationCap} value={moneyless(stats.inscricoes_concluidas)} note={`${moneyless(stats.inscricoes_cursando)} em curso`}/>
        <KPI label="Atividades cadastradas" icon={ClipboardList} value={moneyless(stats.atividades_total)} note={`${moneyless(stats.avaliacoes_agendadas)} atividades do tipo avaliação`}/>
        <KPI label="Resultados de perfil" icon={Users} value={moneyless(stats.testes_perfil_respondidos)} note="Respostas registradas, não diagnósticos"/>
        <KPI label="Logins nos últimos 7 dias" icon={Users} value={moneyless(stats.acessos_ultimos_7dias)} note="Somente autenticações registradas após migração 007"/>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Novas inscrições por semana" subtitle="Semanas com inscrições nos últimos 84 dias">
          {weekly.length ? <ResponsiveContainer width="100%" height={230}><LineChart data={weekly} margin={{top:5,right:12,left:-17,bottom:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EFEAF4"/><XAxis dataKey="semana" tick={chartStyle}/><YAxis allowDecimals={false} tick={chartStyle}/><Tooltip/><Line dataKey="inscricoes" name="Inscrições" stroke="#7214FA" strokeWidth={2}/></LineChart></ResponsiveContainer> : <Empty/>}
        </Panel>
        <Panel title="Alunos inscritos por curso" subtitle="Inscrições não canceladas nos oito cursos com mais alunos">
          {courses.length ? <ResponsiveContainer width="100%" height={230}><BarChart data={courses} margin={{top:5,right:10,left:-16,bottom:42}}>
            <CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="curso" tick={chartStyle} angle={-18} textAnchor="end" interval={0} height={57}/><YAxis allowDecimals={false} tick={chartStyle}/><Tooltip/><Bar dataKey="alunos" name="Inscritos" fill="#7214FA" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer> : <Empty/>}
        </Panel>
        <Panel title="Dispersão de frequência" subtitle="Quartis calculados sobre alunos com ao menos uma oportunidade de presença">
          {dispersion.length ? <div className="space-y-4 pt-3">{dispersion.map(d=><div key={d.curso}>
            <div className="flex justify-between text-xs text-gray-700 mb-2"><span className="truncate mr-3">{d.curso}</span><span>Mediana {d.mediana}% · {d.alunos_amostrados} alunos</span></div>
            <div className="relative bg-gray-100 h-2 rounded-full">
              <div className="absolute h-full rounded-full bg-purple-100" style={{left:`${d.min}%`,width:`${d.max-d.min}%`}}/>
              <div className="absolute h-full rounded-full bg-purple-400" style={{left:`${d.q1}%`,width:`${d.q3-d.q1}%`}}/>
              <span className="absolute top-1/2 h-3 w-3 bg-purple-700 rounded-full -translate-y-1/2 -translate-x-1/2" style={{left:`${d.mediana}%`}}/>
            </div></div>)}</div> : <Empty>Não há dados suficientes de presença por aluno.</Empty>}
        </Panel>
        <Panel title="Resultados reais de perfil" subtitle="Classificações registradas pelos testes de perfil">
          {perfil.length ? <ResponsiveContainer width="100%" height={245}><PieChart>
            <Pie data={perfil} nameKey="nome" dataKey="total" innerRadius={50} outerRadius={85} cx="50%" cy="45%" paddingAngle={2}>
              {perfil.map((d,i)=><Cell key={d.nome} fill={palette[i%palette.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer> : <Empty>Nenhum resultado de teste de perfil registrado.</Empty>}
        </Panel>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Últimas inscrições" subtitle="Somente inscrições persistidas no sistema">
          {data.ultimas_inscricoes.length ? <div className="overflow-x-auto xl:col-span-2"><table className="w-full text-sm"><thead><tr className="text-left border-b text-gray-500"><th className="pb-2">Aluno</th><th>Curso</th><th>Data</th></tr></thead><tbody>
            {data.ultimas_inscricoes.map(row=><tr key={row.id} className="border-b border-gray-100"><td className="py-3 font-medium">{row.aluno}</td><td>{row.curso}</td><td className="text-xs">{dataPt(row.data)}</td></tr>)}
          </tbody></table></div> : <Empty>Nenhuma inscrição registrada.</Empty>}
          {onNavigate && <button onClick={()=>onNavigate('students')} className="text-sm text-purple-700 mt-4">Consultar alunos</button>}
        </Panel>
        <Panel title="Pendências reais" subtitle="Sem notificações ou status de sincronização fictícios">
          <div className="space-y-3">
            <div className="bg-purple-50 p-4 rounded-lg"><strong>{stats.certificados_pendentes}</strong> certificados pendentes/prontos</div>
            <div className="bg-gray-50 p-4 rounded-lg"><strong>{stats.inscricoes_hoje}</strong> inscrições criadas hoje</div>
            <p className="text-xs text-gray-500">{stats.acessos_ultimos_7dias} logins registrados nos últimos 7 dias.</p>
          </div>
        </Panel>
      </div>
      <Panel title="Últimos acessos registrados" subtitle="Logins bem-sucedidos registrados após a migração 007, sem IP ou credenciais">
        {data.acessos_recentes?.length ? <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b text-gray-500"><th className="pb-2">Usuário</th><th className="pb-2">Data e hora</th></tr></thead><tbody>
          {data.acessos_recentes.map(e=><tr className="border-b" key={e.id}><td className="py-2">{e.usuario}</td><td>{new Date(e.criado_em).toLocaleString('pt-BR')}</td></tr>)}
        </tbody></table></div> : <Empty>Nenhum login registrado desde a ativação do histórico de acessos.</Empty>}
      </Panel>
    </>}
  </div>;
}
