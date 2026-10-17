import { useState } from 'react';
import { Bell, Search, ChevronRight, Sun, Moon, ChevronDown, LogOut } from 'lucide-react';
const BREADCRUMBS = {
    dashboard: ['Início', 'Dashboard'],
    students: ['Início', 'Alunos', 'Listagem'],
    courses: ['Início', 'Cursos', 'Listagem'],
    activities: ['Início', 'Cursos', 'Atividades'],
    universities: ['Início', 'Cursos', 'Universidades'],
    attendance: ['Início', 'Presenças'],
    certificates: ['Início', 'Certificados'],
    tests: ['Início', 'Testes de Perfil', 'Construtor'],
    'test-results': ['Início', 'Testes de Perfil', 'Resultados'],
    messages: ['Início', 'Comunicação', 'Mensagens'],
    chat: ['Início', 'Comunicação', 'Chat'],
    reports: ['Início', 'Relatórios'],
    settings: ['Início', 'Configurações'],
    admins: ['Início', 'Administradores'],
    audit: ['Início', 'Auditoria / Logs'],
};
const NOTIFICATIONS = [
    { id: 1, text: '3 certificados aguardando aprovação', time: '5 min atrás', unread: true },
    { id: 2, text: 'Nova inscrição: Maria Souza em Python Básico', time: '12 min atrás', unread: true },
    { id: 3, text: 'Aluno João Lima solicitou suporte', time: '1h atrás', unread: false },
    { id: 4, text: 'Sincronização com app concluída', time: '2h atrás', unread: false },
    { id: 5, text: 'Relatório mensal disponível', time: '3h atrás', unread: false },
];
export default function Navbar({ activeItem, darkMode, onToggleDark, onLogout, usuario }) {
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const crumbs = BREADCRUMBS[activeItem] || ['Início'];
    const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;
    const closeAll = () => { setNotifOpen(false); setProfileOpen(false); };
    return (<header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 relative z-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {crumbs.map((crumb, i) => (<span key={i} className="flex items-center gap-1.5">
            {i < crumbs.length - 1 ? (<>
                <button className="text-gray-500 hover:text-blue-600 transition-colors">{crumb}</button>
                <ChevronRight size={13} className="text-gray-400 flex-shrink-0"/>
              </>) : (<span className="text-gray-900 font-medium truncate" aria-current="page">{crumb}</span>)}
          </span>))}
      </nav>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg px-3 py-1.5 text-sm text-gray-500 cursor-pointer select-none min-w-[200px]">
        <Search size={15}/>
        <span>Busca global</span>
        <span className="ml-auto text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-400">⌘K</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button onClick={onToggleDark} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title={darkMode ? 'Modo claro' : 'Modo escuro'}>
          {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors relative">
            <Bell size={18}/>
            {unreadCount > 0 && (<span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>)}
          </button>
          {notifOpen && (<div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">Notificações</span>
                <span className="text-xs text-blue-600 cursor-pointer hover:underline">Marcar todas como lidas</span>
              </div>
              <div className="divide-y divide-gray-50">
                {NOTIFICATIONS.map(n => (<div key={n.id} className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${n.unread ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? 'bg-blue-500' : ''}`}/>
                      <div>
                        <p className="text-sm text-gray-700">{n.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                <button className="text-sm text-blue-600 hover:underline">Ver todas as notificações</button>
              </div>
            </div>)}
        </div>

        {/* Profile */}
        <div className="relative">
          <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 text-xs font-semibold">{usuario.nome_completo.slice(0, 2).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">{usuario.nome_completo}</span>
            <ChevronDown size={14} className="text-gray-400"/>
          </button>
          {profileOpen && (<div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{usuario.nome_completo}</p>
                <p className="text-xs text-gray-500">{usuario.email}</p>
              </div>
              <div className="p-1">
                {['Meu perfil', 'Configurações'].map(item => (<button key={item} onClick={closeAll} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    {item}
                  </button>))}
                <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                  <LogOut size={14}/>
                  Sair
                </button>
              </div>
            </div>)}
        </div>
      </div>
    </header>);
}
