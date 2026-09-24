import { useState } from 'react';
import { Search, Plus, Eye, Pencil, Ban, Trash2, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/Toast';
const COURSE_OPTIONS = ['Python Básico', 'Excel Avançado', 'Design Gráfico', 'Marketing Digital', 'Inglês A1', 'Lógica de Prog.', 'Empreendedorismo'];
const INITIAL_STUDENTS = [
    { id: 1, name: 'Maria Souza', email: 'maria.souza@email.com', courses: ['Python Básico', 'Excel Avançado'], status: 'ativo', joined: '15/01/2026' },
    { id: 2, name: 'Carlos Lima', email: 'carlos.lima@email.com', courses: ['Design Gráfico'], status: 'ativo', joined: '20/02/2026' },
    { id: 3, name: 'Ana Ferreira', email: 'ana.ferreira@email.com', courses: ['Marketing Digital', 'Inglês A1', 'Empreendedorismo'], status: 'ativo', joined: '10/03/2026' },
    { id: 4, name: 'Pedro Santos', email: 'pedro.santos@email.com', courses: ['Python Básico'], status: 'bloqueado', joined: '05/04/2026' },
    { id: 5, name: 'Julia Costa', email: 'julia.costa@email.com', courses: ['Inglês A1'], status: 'ativo', joined: '18/04/2026' },
    { id: 6, name: 'Rafael Oliveira', email: 'rafael.oliveira@email.com', courses: ['Lógica de Prog.', 'Python Básico'], status: 'ativo', joined: '01/05/2026' },
    { id: 7, name: 'Beatriz Alves', email: 'beatriz.alves@email.com', courses: ['Empreendedorismo'], status: 'pendente', joined: '14/06/2026' },
    { id: 8, name: 'Lucas Mendes', email: 'lucas.mendes@email.com', courses: ['Design Gráfico', 'Marketing Digital'], status: 'ativo', joined: '22/07/2026' },
    { id: 9, name: 'Isabela Ramos', email: 'isabela.ramos@email.com', courses: ['Excel Avançado'], status: 'ativo', joined: '30/07/2026' },
    { id: 10, name: 'Gabriel Torres', email: 'gabriel.torres@email.com', courses: ['Marketing Digital'], status: 'bloqueado', joined: '10/08/2026' },
];
const STATUS_STYLES = {
    ativo: 'bg-green-50 text-green-700 border border-green-200',
    bloqueado: 'bg-red-50 text-red-700 border border-red-200',
    pendente: 'bg-amber-50 text-amber-700 border border-amber-200',
};
function StudentDetail({ student, onClose }) {
    const [tab, setTab] = useState('Visão geral');
    const tabs = ['Visão geral', 'Cursos', 'Presenças', 'Certificados', 'Teste de perfil'];
    return (<div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose}/>
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-gray-900">Perfil do aluno</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18}/></button>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 font-semibold text-lg">
                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{student.name}</h3>
              <p className="text-sm text-gray-500">{student.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[student.status]}`}>{student.status}</span>
                <span className="text-xs text-gray-400">Desde {student.joined}</span>
              </div>
            </div>
          </div>
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
            {tabs.map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>))}
          </div>
          {tab === 'Visão geral' && (<div className="space-y-4">
              {[['Nome completo', student.name], ['E-mail', student.email], ['Status', student.status], ['Cadastro', student.joined], ['Cursos', student.courses.join(', ')]].map(([label, value]) => (<div key={label} className="flex">
                  <span className="text-sm text-gray-500 w-36 flex-shrink-0">{label}</span>
                  <span className="text-sm text-gray-900">{value}</span>
                </div>))}
            </div>)}
          {tab === 'Cursos' && (<div className="space-y-3">
              {student.courses.map(c => (<div key={c} className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{c}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-blue-500 rounded-full" style={{ width: '65%' }}/></div>
                    <span className="text-xs text-gray-500">65%</span>
                  </div>
                </div>))}
            </div>)}
          {tab !== 'Visão geral' && tab !== 'Cursos' && (<div className="py-12 text-center text-gray-400 text-sm">Dados de {tab.toLowerCase()} em desenvolvimento</div>)}
        </div>
      </div>
    </div>);
}
const emptyForm = () => ({ name: '', email: '', courses: [], lgpd: false });
function StudentForm({ initial, onSave, onClose }) {
    const [form, setForm] = useState(initial ?? emptyForm());
    const [errors, setErrors] = useState({});
    const toggleCourse = (c) => {
        setForm(prev => ({
            ...prev,
            courses: prev.courses.includes(c) ? prev.courses.filter(x => x !== c) : [...prev.courses, c],
        }));
    };
    const validate = () => {
        const e = {};
        if (!form.name.trim())
            e.name = 'Nome obrigatório';
        if (!form.email.trim())
            e.email = 'E-mail obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            e.email = 'E-mail inválido';
        if (!form.lgpd)
            e.lgpd = 'Consentimento LGPD obrigatório para cadastro';
        return e;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        onSave(form);
    };
    const isEdit = initial !== null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Editar aluno' : 'Novo aluno'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }} placeholder="Ex: Maria da Silva" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}/>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: undefined })); }} placeholder="aluno@email.com" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}/>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Courses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cursos vinculados</label>
              <div className="flex flex-wrap gap-2">
                {COURSE_OPTIONS.map(c => (<button key={c} type="button" onClick={() => toggleCourse(c)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.courses.includes(c) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                    {c}
                  </button>))}
              </div>
            </div>

            {/* LGPD */}
            <div className={`p-3 rounded-lg border ${errors.lgpd ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.lgpd} onChange={e => { setForm(p => ({ ...p, lgpd: e.target.checked })); setErrors(p => ({ ...p, lgpd: undefined })); }} className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                <span className="text-xs text-gray-700">
                  <strong>Consentimento LGPD obrigatório:</strong> O aluno autoriza o tratamento de seus dados pessoais para fins educacionais, conforme a Lei nº 13.709/2018.
                </span>
              </label>
              {errors.lgpd && <p className="mt-1 text-xs text-red-600">{errors.lgpd}</p>}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={!form.lgpd} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
              {isEdit ? 'Salvar alterações' : 'Cadastrar aluno'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
function DeleteModal({ student, onConfirm, onClose }) {
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0"><AlertTriangle size={18} className="text-red-600"/></div>
          <div>
            <h3 className="font-semibold text-gray-900">Excluir aluno</h3>
            <p className="text-sm text-gray-500 mt-1">Tem certeza que deseja excluir <strong>{student.name}</strong>? Esta ação não pode ser desfeita.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Confirmar exclusão</button>
        </div>
      </div>
    </div>);
}
// ── Main component ─────────────────────────────────────────────────────────
export default function Students() {
    const { toast } = useToast();
    const [students, setStudents] = useState(INITIAL_STUDENTS);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(1);
    const perPage = 8;
    // modal state
    const [detailStudent, setDetailStudent] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const filtered = students.filter(s => {
        const q = search.toLowerCase();
        const matchesSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'todos' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);
    const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleAll = () => setSelected(selected.length === paginated.length ? [] : paginated.map(s => s.id));
    const openNew = () => { setEditTarget(null); setFormOpen(true); };
    const openEdit = (s) => { setEditTarget(s); setFormOpen(true); };
    const closeForm = () => { setFormOpen(false); setEditTarget(null); };
    const handleSave = (data) => {
        if (editTarget) {
            setStudents(prev => prev.map(s => s.id === editTarget.id ? { ...s, ...data } : s));
            toast('Aluno atualizado com sucesso');
        }
        else {
            const today = new Date();
            const joined = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
            setStudents(prev => [...prev, { id: Date.now(), ...data, status: 'ativo', joined }]);
            toast('Aluno cadastrado com sucesso');
        }
        closeForm();
    };
    const handleDelete = () => {
        if (!deleteTarget)
            return;
        setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
        setSelected(prev => prev.filter(id => id !== deleteTarget.id));
        toast(`${deleteTarget.name} foi excluído`, 'info');
        setDeleteTarget(null);
    };
    const handleBlock = (s) => {
        const next = s.status === 'bloqueado' ? 'ativo' : 'bloqueado';
        setStudents(prev => prev.map(x => x.id === s.id ? { ...x, status: next } : x));
        toast(next === 'bloqueado' ? `${s.name} bloqueado` : `${s.name} desbloqueado`, 'info');
    };
    const handleBulkBlock = () => {
        setStudents(prev => prev.map(s => selected.includes(s.id) ? { ...s, status: 'bloqueado' } : s));
        toast(`${selected.length} aluno(s) bloqueado(s)`, 'warning');
        setSelected([]);
    };
    const handleBulkExport = () => {
        toast('Exportação simulada — funcionalidade em desenvolvimento', 'info');
    };
    return (<div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Alunos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} aluno(s) encontrado(s)</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16}/>Novo aluno
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-400 flex-shrink-0"/>
          <input type="text" placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"/>
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-gray-400 hover:text-gray-600"/></button>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          {['todos', 'ativo', 'bloqueado', 'pendente'].map(s => (<button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
              {s}
            </button>))}
        </div>
        {selected.length > 0 && (<div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500">{selected.length} selecionado(s)</span>
            <button onClick={handleBulkExport} className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">Exportar</button>
            <button onClick={handleBulkBlock} className="text-xs px-2.5 py-1 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors">Bloquear</button>
          </div>)}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="pl-4 pr-2 py-3 w-10">
                  <input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0} onChange={toggleAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                </th>
                {['Aluno', 'E-mail', 'Cursos', 'Status', 'Cadastro', 'Ações'].map(h => (<th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map(student => (<tr key={student.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setDetailStudent(student)}>
                  <td className="pl-4 pr-2 py-3" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(student.id)} onChange={() => toggleSelect(student.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-semibold">{student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <span className="font-medium text-gray-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{student.email}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {student.courses.slice(0, 2).map(c => (<span key={c} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{c}</span>))}
                      {student.courses.length > 2 && (<span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">+{student.courses.length - 2}</span>)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[student.status]}`}>{student.status}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{student.joined}</td>
                  <td className="px-3 py-3 pr-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setDetailStudent(student)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Ver perfil"><Eye size={15}/></button>
                      <button onClick={() => openEdit(student)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Editar"><Pencil size={15}/></button>
                      <button onClick={() => handleBlock(student)} className={`p-1.5 rounded-lg transition-colors ${student.status === 'bloqueado' ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-amber-50 hover:text-amber-600'}`} title={student.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}>
                        <Ban size={15}/>
                      </button>
                      <button onClick={() => setDeleteTarget(student)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Excluir"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>))}
              {paginated.length === 0 && (<tr><td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={32} className="text-gray-300"/>
                    <p className="text-sm text-gray-400">Nenhum aluno encontrado</p>
                    <button onClick={() => { setSearch(''); setStatusFilter('todos'); }} className="text-xs text-blue-600 hover:underline">Limpar filtros</button>
                  </div>
                </td></tr>)}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (<div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-xs text-gray-500">Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 text-gray-600"><ChevronLeft size={15}/></button>
              {Array.from({ length: totalPages }, (_, i) => (<button key={i + 1} onClick={() => setPage(i + 1)} className={`w-7 h-7 text-xs rounded-lg transition-colors ${page === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                  {i + 1}
                </button>))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 text-gray-600"><ChevronRight size={15}/></button>
            </div>
          </div>)}
      </div>

      {detailStudent && <StudentDetail student={detailStudent} onClose={() => setDetailStudent(null)}/>}

      {formOpen && (<StudentForm initial={editTarget ? { name: editTarget.name, email: editTarget.email, courses: editTarget.courses, lgpd: true } : null} onSave={handleSave} onClose={closeForm}/>)}

      {deleteTarget && <DeleteModal student={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)}/>}
    </div>);
}
