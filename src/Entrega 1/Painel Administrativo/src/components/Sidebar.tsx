import { useState } from 'react';
import type { UsuarioAutenticado } from '../services/api';
import {
  LayoutDashboard, Users, BookOpen, Calendar, MapPin, Award,
  Brain, MessageSquare, BarChart3, Settings, Shield, FileText,
  ChevronDown, ChevronRight, LogOut, Menu, X, University,
  CheckSquare, Bell
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children?: NavItem[];
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'students', label: 'Alunos', icon: Users },
  {
    id: 'courses-group', label: 'Cursos', icon: BookOpen,
    children: [
      { id: 'courses', label: 'Cursos', icon: BookOpen },
      { id: 'activities', label: 'Atividades', icon: Calendar },
      { id: 'universities', label: 'Universidades', icon: University },
    ]
  },
  { id: 'attendance', label: 'Presenças', icon: CheckSquare },
  { id: 'certificates', label: 'Certificados', icon: Award },
  {
    id: 'tests-group', label: 'Testes de Perfil', icon: Brain,
    children: [
      { id: 'tests', label: 'Construtor', icon: Brain },
      { id: 'test-results', label: 'Resultados', icon: BarChart3 },
    ]
  },
  {
    id: 'comms-group', label: 'Comunicação', icon: MessageSquare,
    children: [
      { id: 'messages', label: 'Mensagens', icon: Bell },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
    ]
  },
  { id: 'reports', label: 'Relatórios', icon: FileText },
  { id: 'settings', label: 'Configurações', icon: Settings },
  { id: 'admins', label: 'Administradores', icon: Shield, adminOnly: true },
  { id: 'audit', label: 'Auditoria / Logs', icon: FileText, adminOnly: true },
];

interface SidebarProps {
  activeItem: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  usuario: UsuarioAutenticado;
}

export default function Sidebar({ activeItem, onNavigate, collapsed, onToggle, onLogout, usuario }: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const isActive = (item: NavItem): boolean => {
    if (item.id === activeItem) return true;
    if (item.children) return item.children.some(c => c.id === activeItem);
    return false;
  };

  const renderItem = (item: NavItem, depth = 0) => {
    const active = isActive(item);
    const hasChildren = !!item.children?.length;
    const isExpanded = expanded[item.id] || (hasChildren && item.children!.some(c => c.id === activeItem));

    return (
      <div key={item.id}>
        <button
          onClick={() => hasChildren ? toggleGroup(item.id) : onNavigate(item.id)}
          title={collapsed ? item.label : undefined}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150
            ${depth > 0 ? 'pl-8' : ''}
            ${active && !hasChildren
              ? 'bg-blue-50 text-blue-700 font-semibold border-l-[3px] border-blue-600 rounded-l-none'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <item.icon size={18} className={`flex-shrink-0 ${active && !hasChildren ? 'text-blue-600' : ''}`} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {hasChildren && (
                isExpanded
                  ? <ChevronDown size={14} className="text-gray-400" />
                  : <ChevronRight size={14} className="text-gray-400" />
              )}
            </>
          )}
        </button>

        {hasChildren && !collapsed && isExpanded && (
          <div className="mt-0.5 mb-0.5">
            {item.children!.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const mainItems = NAV_ITEMS.filter(i => !i.adminOnly);
  const adminItems = NAV_ITEMS.filter(i => i.adminOnly && usuario.papel === 'admin_super');

  return (
    <aside className={`flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Header */}
      <div className={`flex items-center h-16 px-3 border-b border-gray-200 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">PE</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Próxima Etapa</span>
          </div>
        )}
        <button onClick={onToggle} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {mainItems.map(item => renderItem(item))}
        <div className="my-2 border-t border-gray-200" />
        {adminItems.map(item => renderItem(item))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-gray-200 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button onClick={onLogout} title="Sair" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 text-xs font-semibold">{usuario.nome_completo.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{usuario.nome_completo}</p>
              <p className="text-xs text-gray-500 truncate">{usuario.papel}</p>
            </div>
            <button onClick={onLogout} title="Sair" className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
