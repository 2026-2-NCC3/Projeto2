import { useEffect, useState } from 'react';
import { Bell, ChevronRight, Sun, Moon, ChevronDown, LogOut, Menu } from 'lucide-react';
import { listarEventosGestao } from '../services/api';

const BREADCRUMBS = {
  dashboard:['Início','Dashboard'], students:['Início','Alunos'],
  courses:['Início','Cursos'], activities:['Início','Atividades'],universities:['Início','Universidades'],
  attendance:['Início','Presenças'],certificates:['Início','Certificados'],
  tests:['Início','Testes de Perfil'], 'test-results':['Início','Resultados de perfil'],
  messages:['Início','Comunicados'], reports:['Início','Relatórios'],
  admins:['Início','Administradores'], audit:['Início','Auditoria'],
};
const names = {criar:'Criação',editar:'Alteração',excluir:'Exclusão',bloquear:'Bloqueio',desbloquear:'Desbloqueio',inscricao:'Inscrição',emitir_certificado:'Certificado emitido',revogar_certificado:'Certificado revogado'};
const datePt = raw => raw ? new Date(raw).toLocaleString('pt-BR') : 'Data não informada';

export default function Navbar({activeItem,darkMode,onToggleDark,onLogout,usuario,onNavigate,mobileOpen,onOpenNavigation}) {
  const [open,setOpen] = useState(false);
  const [profile,setProfile] = useState(false);
  const [events,setEvents] = useState([]);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  useEffect(()=>{
    if(!open) return;
    const controller=new AbortController();setLoading(true);setError('');
    listarEventosGestao({signal:controller.signal}).then(data=>{
      if(!Array.isArray(data)) throw Error('Resposta inválida');
      if(!controller.signal.aborted) setEvents(data);
    }).catch(()=>{if(!controller.signal.aborted){setEvents([]);setError('Não foi possível carregar eventos recentes.');}})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[open]);
  const crumbs=BREADCRUMBS[activeItem]??['Início'];
  return <header className="h-16 bg-white border-b border-gray-200 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0 relative z-20">
    <button type="button" aria-label="Abrir navegação" aria-expanded={mobileOpen}
      aria-controls="navegacao-painel" onClick={onOpenNavigation}
      className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"><Menu size={20}/></button>
    <nav aria-label="Navegação atual" className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
      {crumbs.map((crumb,i)=><span key={i} className="flex items-center gap-1.5">
        {i<crumbs.length-1 ? <><span className="text-gray-500">{crumb}</span><ChevronRight size={13} className="text-gray-400"/></> : <span className="font-medium text-gray-900 truncate" aria-current="page">{crumb}</span>}
      </span>)}
    </nav>
    <button onClick={onToggleDark} title={darkMode?'Modo claro':'Modo escuro'} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">{darkMode?<Sun size={18}/>:<Moon size={18}/>}</button>
    <div className="relative">
      <button aria-label="Ver atividades recentes do sistema" aria-expanded={open} onClick={()=>{setOpen(!open);setProfile(false);}} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Bell size={18}/></button>
      {open && <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg max-h-[70vh] overflow-y-auto">
        <div className="px-4 py-3 border-b text-sm font-semibold">Atividades recentes <span className="block font-normal text-xs text-gray-500">Eventos registrados, não notificações não lidas</span></div>
        {loading && <p className="p-4 text-sm text-gray-500">Consultando registros...</p>}
        {error && <p role="alert" className="p-4 text-sm text-red-700">{error}</p>}
        {!loading && !error && !events.length && <p className="p-4 text-sm text-gray-500">Nenhum evento registrado.</p>}
        {!loading && !error && events.map((e,i)=><div key={`${e.entidade_id}-${e.criado_em}-${i}`} className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm text-gray-700">{names[e.acao]??e.acao} · {e.entidade}</p>
          <p className="text-xs text-gray-500 mt-1">{e.autor} · {datePt(e.criado_em)}</p></div>)}
        <button onClick={()=>{setOpen(false);onNavigate?.('reports');}} className="text-sm text-purple-700 w-full text-center p-3">Abrir relatórios</button>
      </div>}
    </div>
    <div className="relative">
      <button onClick={()=>{setProfile(!profile);setOpen(false);}} className="flex gap-2 items-center p-2 rounded-lg hover:bg-gray-100" aria-expanded={profile}>
        <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold grid place-items-center">{(usuario.nome_completo??'?').slice(0,2).toUpperCase()}</span>
        <span className="text-sm font-medium text-gray-700 hidden md:block">{usuario.nome_completo}</span><ChevronDown size={14} className="text-gray-400"/>
      </button>
      {profile && <div className="absolute right-0 top-full mt-2 w-52 bg-white border rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b"><p className="text-sm font-semibold">{usuario.nome_completo}</p><p className="text-xs text-gray-500 break-all">{usuario.email}</p><p className="text-xs text-gray-500">{usuario.papel}</p></div>
        <button onClick={onLogout} className="flex gap-2 items-center w-full p-3 text-sm text-red-700 hover:bg-red-50"><LogOut size={14}/> Sair</button>
      </div>}
    </div>
  </header>;
}
