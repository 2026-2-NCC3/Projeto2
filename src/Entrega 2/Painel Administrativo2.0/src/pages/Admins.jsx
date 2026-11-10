import {useEffect,useState} from 'react';
import {listarAdmins} from '../services/api';
export default function Admins({usuario}) {
  const [rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{
    if(usuario?.papel!=='admin_super')return;
    const controller=new AbortController();
    listarAdmins({signal:controller.signal}).then(data=>{if(!Array.isArray(data))throw Error();if(!controller.signal.aborted)setRows(data);})
      .catch(()=>{if(!controller.signal.aborted)setError('Falha ao consultar administradores.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[usuario?.papel]);
  if(usuario?.papel!=='admin_super')return <p className="p-6">Acesso restrito ao administrador principal.</p>;
  return <section className="p-6 space-y-4"><h1 className="text-xl font-semibold">Administradores cadastrados</h1>
    <p className="text-sm text-gray-500">Lista consultada pela API protegida /api/admins. Nenhuma conta simulada.</p>
    {loading?<p role="status">Carregando...</p>:error?<p role="alert" className="text-red-700">{error}</p>:rows.length?<div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-gray-50 text-gray-500"><th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Papel</th><th className="p-3">Cadastro</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t"><td className="p-3">{r.nome_completo}</td><td className="p-3">{r.email}</td><td className="p-3">{r.papel}</td><td className="p-3">{r.criado_em?new Date(r.criado_em).toLocaleDateString('pt-BR'):'—'}</td></tr>)}</tbody></table></div>:<p>Nenhum administrador encontrado.</p>}
  </section>;
}
