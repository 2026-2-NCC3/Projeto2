import { useEffect, useState } from 'react';
import { Search, Plus, Eye, Pencil, Ban, Trash2, ChevronLeft, ChevronRight, X, AlertTriangle, LoaderCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { atualizarPerfil, bloquearPerfil, criarPerfil, excluirPerfil, listarPerfis } from '../services/api';

const STATUS_STYLES = {
  ativo: 'bg-green-50 text-green-700 border border-green-200',
  bloqueado: 'bg-red-50 text-red-700 border border-red-200',
};

function formatarData(valor) {
  return valor ? new Intl.DateTimeFormat('pt-BR').format(new Date(valor)) : '—';
}

function paraAluno(perfil) {
  return {
    id: perfil.id,
    name: perfil.nome_completo,
    email: perfil.email,
    telefone: perfil.telefone ?? '',
    escola: perfil.escola ?? '',
    serie: perfil.serie ?? '',
    cidade: perfil.cidade ?? '',
    lgpd: Boolean(perfil.consentimento_lgpd),
    status: perfil.bloqueado ? 'bloqueado' : 'ativo',
    joined: formatarData(perfil.criado_em),
  };
}

function StudentDetail({ student, onClose }) {
  const campos = [
    ['Nome completo', student.name], ['E-mail', student.email], ['Telefone', student.telefone || '—'],
    ['Escola', student.escola || '—'], ['Série', student.serie || '—'], ['Cidade', student.cidade || '—'],
    ['Cadastro', student.joined], ['Consentimento LGPD', student.lgpd ? 'Registrado' : 'Não informado'],
    ['Cursos', 'As inscrições são consultadas pelo aluno no aplicativo.'],
  ];
  return <div className="fixed inset-0 z-50 flex">
    <div className="flex-1 bg-black/30" onClick={onClose}/>
    <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <h2 className="font-semibold text-gray-900">Perfil do aluno</h2><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18}/></button>
      </div>
      <div className="p-6 space-y-5"><div className="flex items-start gap-4"><div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-blue-700 font-semibold text-lg">{student.name.split(' ').map(nome => nome[0]).join('').slice(0, 2)}</span></div><div><h3 className="text-xl font-semibold text-gray-900">{student.name}</h3><p className="text-sm text-gray-500">{student.email}</p><span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[student.status]}`}>{student.status}</span></div></div>
        <div className="space-y-3">{campos.map(([label, value]) => <div key={label} className="flex gap-4"><span className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</span><span className="text-sm text-gray-900">{value}</span></div>)}</div>
      </div>
    </div>
  </div>;
}

const vazio = () => ({ name: '', email: '', senha: '', telefone: '', escola: '', serie: '', cidade: '', lgpd: false });

function StudentForm({ initial, onSave, onClose, salvando }) {
  const [form, setForm] = useState(initial ?? vazio());
  const [errors, setErrors] = useState({});
  const isEdit = initial !== null;
  const campos = [['name', 'Nome completo', 'text'], ['email', 'E-mail', 'email'], ['telefone', 'Telefone', 'text'], ['escola', 'Escola', 'text'], ['serie', 'Série', 'text'], ['cidade', 'Cidade', 'text']];
  const campo = (nome, valor) => setForm(atual => ({ ...atual, [nome]: valor }));
  const enviar = evento => {
    evento.preventDefault();
    const proximos = {};
    if (!form.name.trim()) proximos.name = 'Nome obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) proximos.email = 'Informe um e-mail válido';
    if (!isEdit && form.senha.length < 6) proximos.senha = 'A senha temporária deve ter ao menos 6 caracteres';
    if (!form.lgpd) proximos.lgpd = 'Consentimento LGPD obrigatório para cadastro';
    setErrors(proximos);
    if (Object.keys(proximos).length === 0) onSave(form);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30" onClick={onClose}/><div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between"><h2 className="font-semibold text-gray-900">{isEdit ? 'Editar aluno' : 'Novo aluno'}</h2><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18}/></button></div>
    <form onSubmit={enviar} noValidate><div className="p-6 space-y-4">{campos.map(([nome, rotulo, tipo]) => <div key={nome}><label className="block text-sm font-medium text-gray-700 mb-1">{rotulo}{['name', 'email'].includes(nome) && <span className="text-red-500"> *</span>}</label><input type={tipo} value={form[nome]} onChange={evento => campo(nome, evento.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[nome] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}/>{errors[nome] && <p className="mt-1 text-xs text-red-600">{errors[nome]}</p>}</div>)}
      {!isEdit && <div><label className="block text-sm font-medium text-gray-700 mb-1">Senha temporária <span className="text-red-500">*</span></label><input type="password" value={form.senha} onChange={evento => campo('senha', evento.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.senha ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}/>{errors.senha && <p className="mt-1 text-xs text-red-600">{errors.senha}</p>}</div>}
      <div className={`p-3 rounded-lg border ${errors.lgpd ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}><label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={form.lgpd} onChange={evento => campo('lgpd', evento.target.checked)} className="mt-0.5 rounded border-gray-300 text-blue-600"/><span className="text-xs text-gray-700"><strong>Consentimento LGPD obrigatório:</strong> autoriza o tratamento de dados pessoais para fins educacionais.</span></label>{errors.lgpd && <p className="mt-1 text-xs text-red-600">{errors.lgpd}</p>}</div>
    </div><div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 justify-end"><button type="button" onClick={onClose} disabled={salvando} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Cancelar</button><button type="submit" disabled={salvando} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50 font-medium">{salvando ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar aluno'}</button></div></form>
  </div></div>;
}

function DeleteModal({ student, onConfirm, onClose, excluindo }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30" onClick={onClose}/><div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6"><div className="flex items-start gap-3 mb-4"><div className="p-2 bg-red-100 rounded-lg"><AlertTriangle size={18} className="text-red-600"/></div><div><h3 className="font-semibold text-gray-900">Excluir aluno</h3><p className="text-sm text-gray-500 mt-1">Excluir <strong>{student.name}</strong>? Esta ação não pode ser desfeita.</p></div></div><div className="flex gap-3 justify-end"><button onClick={onClose} disabled={excluindo} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Cancelar</button><button onClick={onConfirm} disabled={excluindo} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg disabled:opacity-50 font-medium">{excluindo ? 'Excluindo...' : 'Confirmar exclusão'}</button></div></div></div>;
}

export default function Students() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [detailStudent, setDetailStudent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const perPage = 8;
  const carregar = async () => {
    setCarregando(true);
    try { setStudents((await listarPerfis()).map(paraAluno)); }
    catch (erro) { toast(erro.message || 'Não foi possível carregar os alunos.', 'error'); }
    finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);
  const filtered = students.filter(aluno => (aluno.name.toLowerCase().includes(search.toLowerCase()) || aluno.email.toLowerCase().includes(search.toLowerCase())) && (statusFilter === 'todos' || aluno.status === statusFilter));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const fecharForm = () => { setFormOpen(false); setEditTarget(null); };
  const salvar = async dados => {
    setSalvando(true);
    try {
      const corpo = { nome_completo: dados.name, email: dados.email, telefone: dados.telefone || null, escola: dados.escola || null, serie: dados.serie || null, cidade: dados.cidade || null, consentimento_lgpd: dados.lgpd ? 1 : 0 };
      const perfil = editTarget ? await atualizarPerfil(editTarget.id, corpo) : await criarPerfil({ ...corpo, senha: dados.senha });
      const aluno = paraAluno(perfil);
      setStudents(atuais => editTarget ? atuais.map(item => item.id === aluno.id ? aluno : item) : [aluno, ...atuais]);
      toast(editTarget ? 'Aluno atualizado com sucesso.' : 'Aluno cadastrado com sucesso.'); fecharForm();
    } catch (erro) { toast(erro.message || 'Não foi possível salvar o aluno.', 'error'); }
    finally { setSalvando(false); }
  };
  const excluir = async () => {
    if (!deleteTarget) return;
    setSalvando(true);
    try { await excluirPerfil(deleteTarget.id); setStudents(atuais => atuais.filter(item => item.id !== deleteTarget.id)); setSelected(atuais => atuais.filter(id => id !== deleteTarget.id)); toast(`${deleteTarget.name} foi excluído.`, 'info'); setDeleteTarget(null); }
    catch (erro) { toast(erro.message || 'Não foi possível excluir o aluno.', 'error'); }
    finally { setSalvando(false); }
  };
  const alterarBloqueio = async aluno => {
    const bloqueado = aluno.status !== 'bloqueado';
    try { const atualizado = paraAluno(await bloquearPerfil(aluno.id, bloqueado, bloqueado ? 'Bloqueado pelo administrador' : null)); setStudents(atuais => atuais.map(item => item.id === aluno.id ? atualizado : item)); toast(bloqueado ? `${aluno.name} bloqueado.` : `${aluno.name} desbloqueado.`, 'info'); }
    catch (erro) { toast(erro.message || 'Não foi possível alterar o bloqueio.', 'error'); }
  };
  const bloquearSelecionados = async () => {
    try { await Promise.all(selected.map(id => bloquearPerfil(id, true, 'Bloqueado pelo administrador'))); await carregar(); toast(`${selected.length} aluno(s) bloqueado(s).`, 'warning'); setSelected([]); }
    catch (erro) { toast(erro.message || 'Não foi possível bloquear os alunos.', 'error'); }
  };
  return <div className="p-6 space-y-4"><div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-gray-900">Alunos</h1><p className="text-sm text-gray-500 mt-0.5">{carregando ? 'Carregando alunos...' : `${filtered.length} aluno(s) encontrado(s)`}</p></div><button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"><Plus size={16}/>Novo aluno</button></div>
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center"><div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"><Search size={15} className="text-gray-400"/><input type="text" placeholder="Buscar por nome ou e-mail..." value={search} onChange={evento => { setSearch(evento.target.value); setPage(1); }} className="flex-1 bg-transparent text-sm outline-none"/>{search && <button onClick={() => setSearch('')}><X size={14}/></button>}</div><div className="flex items-center gap-2"><span className="text-sm text-gray-500">Status:</span>{['todos', 'ativo', 'bloqueado'].map(status => <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }} className={`text-xs px-2.5 py-1 rounded-full border capitalize ${statusFilter === status ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200'}`}>{status}</button>)}</div>{selected.length > 0 && <button onClick={bloquearSelecionados} className="ml-auto text-xs px-2.5 py-1 border border-red-200 rounded-lg text-red-600">Bloquear selecionados</button>}</div>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="pl-4 pr-2 py-3 w-10"><input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0} onChange={() => setSelected(selected.length === paginated.length ? [] : paginated.map(aluno => aluno.id))}/></th>{['Aluno', 'E-mail', 'Cursos', 'Status', 'Cadastro', 'Ações'].map(coluna => <th key={coluna} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{coluna}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">
      {carregando ? <tr><td colSpan="6" className="py-16 text-center text-gray-400"><LoaderCircle className="animate-spin inline mr-2" size={20}/>Carregando...</td></tr> : paginated.map(aluno => <tr key={aluno.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailStudent(aluno)}><td className="pl-4 pr-2 py-3" onClick={evento => evento.stopPropagation()}><input type="checkbox" checked={selected.includes(aluno.id)} onChange={() => setSelected(atuais => atuais.includes(aluno.id) ? atuais.filter(id => id !== aluno.id) : [...atuais, aluno.id])}/></td><td className="px-3 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-blue-700 text-xs font-semibold">{aluno.name.split(' ').map(nome => nome[0]).join('').slice(0, 2)}</span></div><span className="font-medium text-gray-900">{aluno.name}</span></div></td><td className="px-3 py-3 text-gray-600">{aluno.email}</td><td className="px-3 py-3 text-xs text-gray-500">Consultar inscrições no aplicativo</td><td className="px-3 py-3"><span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[aluno.status]}`}>{aluno.status}</span></td><td className="px-3 py-3 text-gray-500 text-xs">{aluno.joined}</td><td className="px-3 py-3 pr-4" onClick={evento => evento.stopPropagation()}><div className="flex justify-end gap-1"><button onClick={() => setDetailStudent(aluno)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Ver perfil"><Eye size={15}/></button><button onClick={() => { setEditTarget(aluno); setFormOpen(true); }} className="p-1.5 text-gray-400 hover:text-gray-600" title="Editar"><Pencil size={15}/></button><button onClick={() => alterarBloqueio(aluno)} className="p-1.5 text-gray-400 hover:text-amber-600" title={aluno.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}><Ban size={15}/></button><button onClick={() => setDeleteTarget(aluno)} className="p-1.5 text-gray-400 hover:text-red-600" title="Excluir"><Trash2 size={15}/></button></div></td></tr>)}
      {!carregando && paginated.length === 0 && <tr><td colSpan="6" className="py-16 text-center text-gray-400">Nenhum aluno encontrado.</td></tr>}
    </tbody></table></div>{totalPages > 1 && <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200"><button onClick={() => setPage(atual => Math.max(1, atual - 1))} disabled={page === 1}><ChevronLeft size={16}/></button><span className="text-xs text-gray-500">Página {page} de {totalPages}</span><button onClick={() => setPage(atual => Math.min(totalPages, atual + 1))} disabled={page === totalPages}><ChevronRight size={16}/></button></div>}</div>
    {detailStudent && <StudentDetail student={detailStudent} onClose={() => setDetailStudent(null)}/>} {formOpen && <StudentForm initial={editTarget} onSave={salvar} onClose={fecharForm} salvando={salvando}/>} {deleteTarget && <DeleteModal student={deleteTarget} onConfirm={excluir} onClose={() => setDeleteTarget(null)} excluindo={salvando}/>}</div>;
}
