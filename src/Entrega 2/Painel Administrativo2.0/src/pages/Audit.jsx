import {useEffect,useState} from 'react';
import {listarAuditoria} from '../services/api';
export default function Audit({usuario}) {
  const [rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{
    if(usuario?.papel!=='admin_super')return;
    const controller=new AbortController();
    listarAuditoria({signal:controller.signal}).then(data=>{if(!Array.isArray(data))throw Error();if(!controller.signal.aborted)setRows(data);})
      .catch(()=>{if(!controller.signal.aborted)setError('Falha ao consultar auditoria.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[usuario?.papel]);
  if(usuario?.papel!=='admin_super')return <p className="p-6">Acesso restrito ao administrador principal.</p>;
  return <section className="p-6 space-y-4"><h1 className="text-xl font-semibold">Registro de auditoria</h1>
    <p className="text-sm text-gray-500">Últimos 100 eventos persistidos em audit_logs. Valores anteriores/depois não são expostos.</p>
    {loading?<p role="status">Carregando...</p>:error?<p role="alert" className="text-red-700">{error}</p>:rows.length?<div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-gray-50 text-gray-500"><th className="p-3">Data</th><th className="p-3">Ação</th><th className="p-3">Entidade</th><th className="p-3">Autor</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t"><td className="p-3">{new Date(r.criado_em).toLocaleString('pt-BR')}</td><td className="p-3">{r.acao}</td><td className="p-3">{r.entidade}</td><td className="p-3">{r.autor}</td></tr>)}</tbody></table></div>:<p>Nenhum evento de auditoria registrado.</p>}
  </section>;
}
