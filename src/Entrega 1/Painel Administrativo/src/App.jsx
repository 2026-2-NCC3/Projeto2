import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Certificates from './pages/Certificates';
import Attendance from './pages/Attendance';
import Tests from './pages/Tests';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import Placeholder from './pages/Placeholder';
import Universities from './pages/Universities';
import { limparSessao, obterToken, obterUsuario } from './services/api';
const PAGES = {
    dashboard: Dashboard,
    students: Students,
    courses: Courses,
    activities: () => <Placeholder title="Atividades / Encontros" description="Gestão de atividades vinculadas aos cursos"/>,
    universities: Universities,
    attendance: Attendance,
    certificates: Certificates,
    tests: Tests,
    'test-results': Tests,
    messages: Messages,
    chat: () => <Placeholder title="Chat" description="Fila de atendimento e suporte aos alunos"/>,
    reports: Reports,
    settings: () => <Placeholder title="Configurações" description="Configurações gerais do sistema"/>,
    admins: () => <Placeholder title="Administradores" description="Gestão de usuários administrativos"/>,
    audit: () => <Placeholder title="Auditoria / Logs" description="Registro de ações e trilha de auditoria"/>,
};
function AdminShell({ usuario, onLogout, }) {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem('sidebar-collapsed') === 'true';
        }
        catch {
            return false;
        }
    });
    const [activeItem, setActiveItem] = useState('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(collapsed));
    }, [collapsed]);
    const PageComponent = PAGES[activeItem] || Dashboard;
    return (<div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity ${!collapsed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setCollapsed(true)}/>

      <Sidebar activeItem={activeItem} onNavigate={setActiveItem} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onLogout={onLogout} usuario={usuario}/>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar activeItem={activeItem} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} onLogout={onLogout} usuario={usuario}/>
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <PageComponent />
        </main>
      </div>
    </div>);
}
export default function App() {
    const [usuario, setUsuario] = useState(() => {
        return obterToken() ? obterUsuario() : null;
    });
    const sair = () => {
        limparSessao();
        setUsuario(null);
    };
    return (<ToastProvider>
      {usuario
            ? <AdminShell usuario={usuario} onLogout={sair}/>
            : <Login onLogin={setUsuario}/>}
    </ToastProvider>);
}
