import {useEffect,useState} from 'react';
import {Plus,Trash2,RefreshCw,AlertTriangle,Save} from 'lucide-react';
import {listarTestesGestao,listarResultadosTestes,criarTesteGestao} from '../services/api';

const emptyDraft = () => ({titulo:'',versao:'',perguntas:[]});
const newAlt=()=>({clientId:crypto.randomUUID(),texto:'',classificacao:'',peso:1});
const newQuestion=()=>({clientId:crypto.randomUUID(),texto:'',alternativas:[newAlt(),newAlt()]});

export default function Tests({activeResults=false}) {
  const [tab,setTab]=useState(activeResults?'results':'builder');
  const [tests,setTests]=useState([]);
  const [results,setResults]=useState([]);
  const [draft,setDraft]=useState(emptyDraft);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [refresh,setRefresh]=useState(0);
  const [selected,setSelected]=useState('');
  useEffect(()=>{
    const ctrl=new AbortController();setLoading(true);setError('');
    Promise.all([listarTestesGestao({signal:ctrl.signal}),listarResultadosTestes({signal:ctrl.signal})])
      .then(([t,r])=>{if(!Array.isArray(t)||!Array.isArray(r))throw Error('Formato inválido');if(!ctrl.signal.aborted){setTests(t);setResults(r);}})
      .catch(()=>{if(!ctrl.signal.aborted){setError('Não foi possível consultar os testes registrados.');setTests([]);setResults([]);}})
      .finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
    return ()=>ctrl.abort();
  },[refresh]);
  const editQ=(index,value)=>setDraft(d=>({...d,perguntas:d.perguntas.map((q,i)=>i===index?{...q,...value}:q)}));
  const editAlt=(qi,ai,value)=>setDraft(d=>({...d,perguntas:d.perguntas.map((q,i)=>i===qi?{...q,alternativas:q.alternativas.map((a,j)=>j===ai?{...a,...value}:a)}:q)}));
  const onSave=async()=>{
    setSaving(true);setError('');setNotice('');
    try {
      const payload={titulo:draft.titulo,versao:draft.versao,perguntas:draft.perguntas.map(q=>({texto:q.texto,alternativas:q.alternativas.map(({texto,classificacao,peso})=>({texto,classificacao,peso}))}))};
      const saved=await criarTesteGestao(payload);
      setNotice(`Teste ${saved.titulo} (${saved.versao}) salvo como rascunho no banco.`);
      setDraft(emptyDraft());setSelected('');setRefresh(x=>x+1);
    } catch (err) {setError(err?.message || 'Não foi possível salvar o teste.');}
    finally{setSaving(false);}
  };
  const select=(id)=>{
    setSelected(id);
    if(!id){setDraft(emptyDraft());return;}
    const t=tests.find(x=>x.id===id); if(!t)return;
    // Ao copiar, uma nova versão será salva; o teste que já tem resultados não é alterado.
    setDraft({titulo:t.titulo,versao:'',perguntas:t.perguntas.map(q=>({
      clientId:crypto.randomUUID(),texto:q.texto,
      alternativas:q.alternativas.map(a=>({clientId:crypto.randomUUID(),texto:a.texto,classificacao:a.classificacao,peso:a.peso}))
    }))});
    setNotice('Perguntas copiadas para um novo rascunho. Informe uma versão diferente antes de salvar.');
  };
  return <div className="p-6 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-semibold text-gray-900">Testes de perfil</h1><p className="text-sm text-gray-500">Cadastro e resultados reais do banco — sem perguntas de exemplo</p></div>
      <button onClick={()=>setRefresh(x=>x+1)} className="flex gap-2 items-center text-sm px-3 py-2 border rounded-lg"><RefreshCw size={16}/> Atualizar</button>
    </div>
    <div className="flex gap-4 border-b text-sm">
      <button onClick={()=>setTab('builder')} className={`py-3 ${tab==='builder'?'border-b-2 border-purple-700 text-purple-700':''}`}>Criar teste</button>
      <button onClick={()=>setTab('results')} className={`py-3 ${tab==='results'?'border-b-2 border-purple-700 text-purple-700':''}`}>Resultados registrados ({results.length})</button>
    </div>
    {loading && <p role="status">Carregando...</p>}
    {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}
    {notice && <p role="status" className="text-sm text-green-800 bg-green-50 p-3 rounded-lg">{notice}</p>}
    {!loading && !error && tab==='results' && <>
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-2 text-sm text-amber-800"><AlertTriangle size={18} className="shrink-0"/> Resultados são orientativos, não diagnósticos ou critérios de exclusão.</div>
      <section className="bg-white border rounded-xl overflow-x-auto">
        {results.length ? <table className="w-full text-left text-sm"><thead><tr className="bg-gray-50 text-gray-500"><th className="p-3">Aluno</th><th className="p-3">Teste</th><th className="p-3">Classificação</th><th className="p-3">Pontuação</th><th className="p-3">Data</th></tr></thead><tbody>
          {results.map(r=><tr className="border-t" key={r.id}><td className="p-3">{r.aluno}</td><td className="p-3">{r.teste} ({r.versao})</td><td className="p-3">{r.classificacao_final}</td><td className="p-3">{r.pontuacao_total}</td><td className="p-3">{new Date(r.respondido_em).toLocaleDateString('pt-BR')}</td></tr>)}
        </tbody></table> : <p className="p-6 text-gray-500">Nenhum aluno respondeu um teste de perfil.</p>}
      </section>
    </>}
    {!loading && tab==='builder' && <div className="max-w-3xl space-y-4">
      <section className="bg-white border rounded-xl p-4 space-y-3">
        <label className="block text-sm">Copiar perguntas de teste existente (opcional)
          <select className="block w-full p-2 border rounded-lg mt-1" value={selected} onChange={e=>select(e.target.value)}><option value="">Criar do zero</option>{tests.map(t=><option value={t.id} key={t.id}>{t.titulo} · {t.versao}{t.ativo?' · ativo':' · rascunho'}</option>)}</select>
        </label>
        <label className="block text-sm">Título
          <input className="block w-full p-2 border rounded-lg mt-1" value={draft.titulo} onChange={e=>setDraft({...draft,titulo:e.target.value})} maxLength={150}/>
        </label>
        <label className="block text-sm">Versão nova (obrigatória)
          <input className="block w-full p-2 border rounded-lg mt-1" value={draft.versao} onChange={e=>setDraft({...draft,versao:e.target.value})} maxLength={40}/>
        </label>
        <p className="text-xs text-gray-500">Ao salvar, será criado um novo teste inativo (rascunho). Testes já respondidos não são sobrescritos e nenhuma publicação é simulada.</p>
      </section>
      {draft.perguntas.map((q,qi)=><section key={q.clientId} className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2"><strong className="flex-1">Pergunta {qi+1}</strong><button onClick={()=>setDraft(d=>({...d,perguntas:d.perguntas.filter((_,i)=>i!==qi)}))} aria-label={`Excluir pergunta ${qi+1}`} className="text-red-600 p-2"><Trash2 size={16}/></button></div>
        <label className="block text-sm">Enunciado <input className="w-full p-2 border rounded-lg mt-1" value={q.texto} onChange={e=>editQ(qi,{texto:e.target.value})}/></label>
        {q.alternativas.map((a,ai)=><div key={a.clientId} className="grid sm:grid-cols-[1fr_1fr_80px_32px] gap-2 items-end">
          <label className="text-xs">Alternativa<input className="block w-full p-2 border rounded-lg mt-1" value={a.texto} onChange={e=>editAlt(qi,ai,{texto:e.target.value})}/></label>
          <label className="text-xs">Classificação<input className="block w-full p-2 border rounded-lg mt-1" value={a.classificacao} onChange={e=>editAlt(qi,ai,{classificacao:e.target.value})}/></label>
          <label className="text-xs">Peso<input type="number" min="1" max="5" className="block w-full p-2 border rounded-lg mt-1" value={a.peso} onChange={e=>editAlt(qi,ai,{peso:Number(e.target.value)})}/></label>
          <button disabled={q.alternativas.length<=2} className="text-red-600 disabled:opacity-30 p-2" aria-label="Excluir alternativa" onClick={()=>editQ(qi,{alternativas:q.alternativas.filter((_,i)=>i!==ai)})}><Trash2 size={14}/></button>
        </div>)}
        <button className="flex items-center gap-1 text-sm text-purple-700 disabled:opacity-40" disabled={q.alternativas.length>=10} onClick={()=>editQ(qi,{alternativas:[...q.alternativas,newAlt()]})}><Plus size={14}/> Adicionar alternativa</button>
      </section>)}
      <button className="w-full p-3 border border-dashed rounded-xl text-purple-700 flex justify-center items-center gap-2" onClick={()=>setDraft(d=>({...d,perguntas:[...d.perguntas,newQuestion()]}))}><Plus size={16}/> Adicionar pergunta</button>
      <button disabled={saving || !draft.titulo.trim() || !draft.versao.trim() || !draft.perguntas.length} onClick={onSave} className="flex items-center gap-2 bg-purple-700 text-white rounded-lg px-4 py-3 disabled:opacity-40"><Save size={16}/>{saving?'Salvando...':'Salvar novo teste em rascunho'}</button>
    </div>}
  </div>;
}
