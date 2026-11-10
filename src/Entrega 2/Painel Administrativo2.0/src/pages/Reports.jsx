import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, RefreshCw, FileText } from 'lucide-react';
import { obterRelatorioGestao } from '../services/api';
import { baixarCsv } from '../utils/exportCsv';

const format = new Intl.NumberFormat('pt-BR');
const valor = n => n == null ? '—' : format.format(n);
const pct = n => n == null ? 'Sem base' : `${n}%`;
function EmptyState({children}){return <p className="p-10 text-center text-sm text-gray-500" role="status">{children}</p>;}
const titleClass='text-sm font-semibold text-gray-900';

export default function Reports() {
  const [periodo, setPeriodo] = useState('6m');
  const [cursoId, setCursoId] = useState('');
  const [data,setData] = useState(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [attempt,setAttempt] = useState(0);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    obterRelatorioGestao({periodo,cursoId,signal:controller.signal})
      .then(json=>{if(!Array.isArray(json?.frequencia_por_curso))throw Error('Resposta inválida');if(!controller.signal.aborted)setData(json);})
      .catch(()=>{if(!controller.signal.aborted){setData(null);setError('Não foi possível consultar os relatórios.');}})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[periodo,cursoId,attempt]);

  const rows=data?.frequencia_por_curso??[];
  const stats=data?.indicadores;
  const exportar=()=>baixarCsv('frequencia-proxima-etapa.csv',
    ['Curso','Inscrições totais','Concluídas','Canceladas','Presenças confirmadas','Oportunidades de presença','Taxa de presença (%)','Taxa de conclusão (%)'],
    rows.map(r=>[r.curso,r.inscritos,r.concluidos,r.cancelados,r.presencas_confirmadas,r.oportunidades_presenca,r.taxa_presenca,r.taxa_conclusao]));
  return <div className="p-6 space-y-6">
    <header className="flex items-center justify-between gap-4 flex-wrap">
      <div><h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">Dados consultados do banco {data?.atualizado_em && `· ${new Date(data.atualizado_em).toLocaleString('pt-BR')}`}</p></div>
      <div className="flex gap-2">
        <button onClick={()=>setAttempt(x=>x+1)} className="flex gap-2 items-center text-sm bg-gray-100 px-3 py-2 rounded-lg"><RefreshCw size={15}/> Atualizar</button>
        <button onClick={exportar} disabled={loading || !rows.length} className="flex gap-2 items-center text-sm bg-purple-700 text-white px-3 py-2 rounded-lg disabled:opacity-50"><Download size={15}/> Exportar CSV (Excel)</button>
      </div>
    </header>
    <form className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap gap-4" onSubmit={event=>event.preventDefault()}>
      <label className="text-sm text-gray-700">Período
        <select value={periodo} onChange={e=>setPeriodo(e.target.value)} className="ml-2 border rounded-lg px-3 py-2">
          <option value="6m">Últimos 6 meses</option><option value="12m">Últimos 12 meses</option><option value="ano">Este ano</option>
        </select>
      </label>
      <label className="text-sm text-gray-700">Curso
        <select value={cursoId} onChange={e=>setCursoId(e.target.value)} className="ml-2 border rounded-lg px-3 py-2 max-w-xs">
          <option value="">Todos os cursos</option>
          {(data?.cursos_opcoes??[]).map(c=><option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>
      </label>
    </form>
    {loading && <EmptyState>Consultando o banco...</EmptyState>}
    {error && <div role="alert" className="p-4 rounded-xl bg-red-50 text-red-700">{error} <button className="underline" onClick={()=>setAttempt(x=>x+1)}>Tentar novamente</button></div>}
    {data && !loading && <>
      <section className="rounded-xl bg-white border border-gray-200 p-5">
        <h2 className="flex gap-2 items-center font-semibold"><FileText size={18} className="text-purple-700"/> Indicadores de impacto registrados</h2>
        <p className="text-xs text-gray-500 my-2">Os totais gerais são históricos; os gráficos de presença abaixo respeitam o período e o curso.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mt-4">
          {[
            ['Alunos com inscrição',stats.alunos_com_inscricao],
            ['Certificados emitidos',stats.certificados_emitidos],
            ['Cursos cadastrados',stats.cursos_total],
            ['Universidades cadastradas',stats.universidades_total],
            ['Horas ofertadas nos cursos',stats.horas_ofertadas],
            ['Inscrições concluídas',stats.inscricoes_concluidas],
          ].map(([label,n])=><div key={label} className="text-center"><div className="text-xl font-semibold">{valor(n)}</div><p className="text-xs text-gray-500">{label}</p></div>)}
        </div>
      </section>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-white border rounded-xl p-5">
          <h2 className={titleClass}>Taxa de presença mensal</h2><p className="text-xs text-gray-500 mb-4">Presenças confirmadas ÷ oportunidades elegíveis no período</p>
          {data.presenca_mensal.length ? <ResponsiveContainer width="100%" height={220}><LineChart data={data.presenca_mensal} margin={{top:5,right:12,left:-13,bottom:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1EEF8"/><XAxis dataKey="mes"/><YAxis domain={[0,100]} unit="%"/><Tooltip formatter={v=>[`${v}%`,'Presença']}/>
            <Line dataKey="taxa" name="Taxa" stroke="#7214FA" strokeWidth={2}/></LineChart></ResponsiveContainer> : <EmptyState>Sem atividades com inscritos elegíveis neste período.</EmptyState>}
        </section>
        <section className="bg-white border rounded-xl p-5"><h2 className={titleClass}>Conclusões e cancelamentos por curso</h2>
          <p className="text-xs text-gray-500 mb-4">Situação atual das inscrições, não evasão presumida</p>
          {data.conclusao_por_curso.some(c=>c.concluidos || c.cancelados) ? <ResponsiveContainer width="100%" height={220}><BarChart data={data.conclusao_por_curso} margin={{top:5,right:12,left:-13,bottom:52}}>
            <CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="curso" angle={-18} textAnchor="end" height={60} interval={0}/><YAxis allowDecimals={false}/><Tooltip/>
            <Bar name="Concluídas" dataKey="concluidos" fill="#7214FA"/><Bar name="Canceladas" dataKey="cancelados" fill="#F2A28C"/>
          </BarChart></ResponsiveContainer> : <EmptyState>Nenhuma conclusão ou cancelamento registrado.</EmptyState>}
        </section>
      </div>
      <section className="bg-white border rounded-xl p-5 overflow-x-auto">
        <h2 className={titleClass}>Frequência por curso</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">Apenas encontros passados e inscrições não canceladas existentes na data do encontro. Sem dados suficientes, a taxa é exibida como “Sem base”.</p>
        <table className="w-full text-left text-sm whitespace-nowrap"><thead><tr className="bg-gray-50 text-gray-500 text-xs">
          {['Curso','Inscrições totais','Presenças','Oportunidades','Taxa de presença','Concluídas','Taxa de conclusão'].map(h=><th key={h} className="p-3">{h}</th>)}
        </tr></thead><tbody className="divide-y divide-gray-100">
          {rows.map(r=><tr key={r.id}><td className="p-3 font-medium">{r.curso}</td><td className="p-3">{r.inscritos}</td>
            <td className="p-3">{r.presencas_confirmadas}</td><td className="p-3">{r.oportunidades_presenca}</td>
            <td className="p-3">{pct(r.taxa_presenca)}</td><td className="p-3">{r.concluidos}</td><td className="p-3">{pct(r.taxa_conclusao)}</td></tr>)}
        </tbody></table>
        {!rows.length && <EmptyState>Nenhum curso encontrado para o filtro.</EmptyState>}
      </section>
    </>}
  </div>;
}
