import { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import { atualizarCurso, criarCurso, excluirCurso, listarCursos, listarUniversidades, } from '../services/api';
const STATUS_LABELS = {
    planejado: 'Planejado',
    em_andamento: 'Em andamento',
    encerrado: 'Encerrado',
    cancelado: 'Cancelado',
};
const STATUS_STYLES = {
    planejado: 'bg-blue-50 text-blue-700 border border-blue-200',
    em_andamento: 'bg-green-50 text-green-700 border border-green-200',
    encerrado: 'bg-gray-100 text-gray-600 border border-gray-200',
    cancelado: 'bg-red-50 text-red-700 border border-red-200',
};
function formularioVazio() {
    return {
        titulo: '', descricao: '', categoria: '', carga_horaria_horas: '0',
        universidade_id: '', modalidade: 'presencial', local: '', link_online: '',
        data_inicio: '', data_fim: '', vagas_total: '0', emite_certificado: false,
        status: 'planejado', banner_url: '',
    };
}
function cursoParaFormulario(curso) {
    return {
        titulo: curso.titulo,
        descricao: curso.descricao ?? '',
        categoria: curso.categoria ?? '',
        carga_horaria_horas: String(curso.carga_horaria_horas),
        universidade_id: curso.universidade_id ?? '',
        modalidade: curso.modalidade,
        local: curso.local ?? '',
        link_online: curso.link_online ?? '',
        data_inicio: curso.data_inicio,
        data_fim: curso.data_fim ?? '',
        vagas_total: String(curso.vagas_total),
        emite_certificado: curso.emite_certificado === 1,
        status: curso.status,
        banner_url: curso.banner_url ?? '',
    };
}
function criarPayload(formulario) {
    return {
        titulo: formulario.titulo.trim(),
        descricao: formulario.descricao.trim() || null,
        categoria: formulario.categoria.trim() || null,
        carga_horaria_horas: Number(formulario.carga_horaria_horas),
        universidade_id: formulario.universidade_id || null,
        modalidade: formulario.modalidade,
        local: formulario.local.trim() || null,
        link_online: formulario.link_online.trim() || null,
        data_inicio: formulario.data_inicio,
        data_fim: formulario.data_fim || null,
        vagas_total: Number(formulario.vagas_total),
        emite_certificado: formulario.emite_certificado ? 1 : 0,
        status: formulario.status,
        banner_url: formulario.banner_url.trim() || null,
    };
}
function mensagemDeErro(erro) {
    return erro instanceof Error ? erro.message : 'Não foi possível concluir a operação.';
}
function Campo({ label, children, erro, }) {
    return <div><label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>{children}{erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}</div>;
}
function FormularioCurso({ curso, universidades, aoSalvar, aoFechar, }) {
    const [formulario, setFormulario] = useState(curso ? cursoParaFormulario(curso) : formularioVazio());
    const [erros, setErros] = useState({});
    const [salvando, setSalvando] = useState(false);
    const estilo = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
    function alterar(campo, valor) {
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
        setErros((atual) => ({ ...atual, [campo]: '' }));
    }
    async function enviar(evento) {
        evento.preventDefault();
        const proximosErros = {};
        if (!formulario.titulo.trim())
            proximosErros.titulo = 'Informe o título do curso.';
        if (!formulario.data_inicio)
            proximosErros.data_inicio = 'Informe a data de início.';
        if (Number(formulario.carga_horaria_horas) < 0)
            proximosErros.carga_horaria_horas = 'A carga horária não pode ser negativa.';
        if (Number(formulario.vagas_total) < 0)
            proximosErros.vagas_total = 'A quantidade de vagas não pode ser negativa.';
        if (formulario.data_fim && formulario.data_inicio && formulario.data_fim < formulario.data_inicio) {
            proximosErros.data_fim = 'A data final deve ser posterior à data inicial.';
        }
        if (Object.keys(proximosErros).length) {
            setErros(proximosErros);
            return;
        }
        setSalvando(true);
        try {
            await aoSalvar(formulario);
        }
        finally {
            setSalvando(false);
        }
    }
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={aoFechar}/>
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="font-semibold text-gray-900">{curso ? 'Editar curso' : 'Novo curso'}</h2>
          <button onClick={aoFechar} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18}/></button>
        </div>
        <form onSubmit={enviar} noValidate>
          <div className="space-y-4 p-6">
            <Campo label="Título *" erro={erros.titulo}><input value={formulario.titulo} onChange={(e) => alterar('titulo', e.target.value)} className={estilo}/></Campo>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Campo label="Universidade"><select value={formulario.universidade_id} onChange={(e) => alterar('universidade_id', e.target.value)} className={estilo}><option value="">Sem universidade vinculada</option>{universidades.map((universidade) => <option key={universidade.id} value={universidade.id}>{universidade.nome}</option>)}</select></Campo>
              <Campo label="Categoria"><input value={formulario.categoria} onChange={(e) => alterar('categoria', e.target.value)} className={estilo}/></Campo>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Campo label="Carga horária (h)" erro={erros.carga_horaria_horas}><input type="number" min="0" value={formulario.carga_horaria_horas} onChange={(e) => alterar('carga_horaria_horas', e.target.value)} className={estilo}/></Campo>
              <Campo label="Vagas totais" erro={erros.vagas_total}><input type="number" min="0" value={formulario.vagas_total} onChange={(e) => alterar('vagas_total', e.target.value)} className={estilo}/></Campo>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Campo label="Modalidade"><select value={formulario.modalidade} onChange={(e) => alterar('modalidade', e.target.value)} className={estilo}><option value="presencial">Presencial</option><option value="online">Online</option><option value="hibrido">Híbrido</option></select></Campo>
              <Campo label="Status"><select value={formulario.status} onChange={(e) => alterar('status', e.target.value)} className={estilo}>{Object.entries(STATUS_LABELS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></Campo>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Campo label="Data de início *" erro={erros.data_inicio}><input type="date" value={formulario.data_inicio} onChange={(e) => alterar('data_inicio', e.target.value)} className={estilo}/></Campo>
              <Campo label="Data de término" erro={erros.data_fim}><input type="date" value={formulario.data_fim} onChange={(e) => alterar('data_fim', e.target.value)} className={estilo}/></Campo>
            </div>
            <Campo label="Local"><input value={formulario.local} onChange={(e) => alterar('local', e.target.value)} className={estilo}/></Campo>
            <Campo label="Link online"><input type="url" value={formulario.link_online} onChange={(e) => alterar('link_online', e.target.value)} className={estilo}/></Campo>
            <Campo label="Descrição"><textarea rows={3} value={formulario.descricao} onChange={(e) => alterar('descricao', e.target.value)} className={`${estilo} resize-none`}/></Campo>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={formulario.emite_certificado} onChange={(e) => alterar('emite_certificado', e.target.checked)}/>Emite certificado</label>
          </div>
          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4"><button type="button" onClick={aoFechar} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">Cancelar</button><button type="submit" disabled={salvando} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{salvando ? 'Salvando…' : curso ? 'Salvar alterações' : 'Criar curso'}</button></div>
        </form>
      </div>
    </div>);
}
function ConfirmacaoExclusao({ curso, confirmar, fechar }) {
    const [excluindo, setExcluindo] = useState(false);
    async function executar() { setExcluindo(true); try {
        await confirmar();
    }
    finally {
        setExcluindo(false);
    } }
    return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30" onClick={fechar}/><div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"><div className="mb-4 flex gap-3"><AlertTriangle className="text-red-600"/><div><h3 className="font-semibold">Excluir curso</h3><p className="mt-1 text-sm text-gray-500">Excluir <strong>{curso.titulo}</strong>?</p></div></div><div className="flex justify-end gap-3"><button onClick={fechar} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><button onClick={executar} disabled={excluindo} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-60">{excluindo ? 'Excluindo…' : 'Excluir'}</button></div></div></div>;
}
export default function Courses() {
    const { toast } = useToast();
    const [cursos, setCursos] = useState([]);
    const [universidades, setUniversidades] = useState([]);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [cursoEmEdicao, setCursoEmEdicao] = useState(undefined);
    const [cursoParaExcluir, setCursoParaExcluir] = useState(null);
    async function carregar() {
        setCarregando(true);
        setErro('');
        try {
            const [dadosCursos, dadosUniversidades] = await Promise.all([listarCursos(), listarUniversidades()]);
            setCursos(dadosCursos);
            setUniversidades(dadosUniversidades);
        }
        catch (erroDaApi) {
            setErro(mensagemDeErro(erroDaApi));
        }
        finally {
            setCarregando(false);
        }
    }
    useEffect(() => { void carregar(); }, []);
    const cursosFiltrados = cursos.filter((curso) => {
        const termo = busca.toLowerCase();
        return (curso.titulo.toLowerCase().includes(termo) || (curso.categoria ?? '').toLowerCase().includes(termo)) && (filtroStatus === 'todos' || curso.status === filtroStatus);
    });
    async function salvar(formulario) {
        try {
            const salvo = cursoEmEdicao ? await atualizarCurso(cursoEmEdicao.id, criarPayload(formulario)) : await criarCurso(criarPayload(formulario));
            setCursos((atuais) => cursoEmEdicao ? atuais.map((curso) => curso.id === salvo.id ? salvo : curso) : [salvo, ...atuais]);
            toast(cursoEmEdicao ? 'Curso atualizado com sucesso.' : 'Curso criado com sucesso.');
            setCursoEmEdicao(undefined);
        }
        catch (erroDaApi) {
            toast(mensagemDeErro(erroDaApi), 'error');
        }
    }
    async function apagar() {
        if (!cursoParaExcluir)
            return;
        try {
            await excluirCurso(cursoParaExcluir.id);
            setCursos((atuais) => atuais.filter((curso) => curso.id !== cursoParaExcluir.id));
            toast('Curso excluído com sucesso.', 'info');
            setCursoParaExcluir(null);
        }
        catch (erroDaApi) {
            toast(mensagemDeErro(erroDaApi), 'error');
        }
    }
    return <div className="space-y-4 p-6">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-gray-900">Cursos</h1><p className="mt-0.5 text-sm text-gray-500">{cursosFiltrados.length} curso(s)</p></div><button onClick={() => setCursoEmEdicao(null)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"><Plus size={16}/>Novo curso</button></div>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4"><div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><Search size={15} className="text-gray-400"/><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cursos..." className="flex-1 bg-transparent text-sm outline-none"/></div>{['todos', ...Object.keys(STATUS_LABELS)].map((status) => <button key={status} onClick={() => setFiltroStatus(status)} className={`rounded-full border px-2.5 py-1 text-xs ${filtroStatus === status ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-600'}`}>{status === 'todos' ? 'Todos' : STATUS_LABELS[status]}</button>)}</div>
    {erro && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro} <button onClick={() => void carregar()} className="ml-2 underline">Tentar novamente</button></div>}
    {carregando ? <p className="py-12 text-center text-sm text-gray-500">Carregando cursos…</p> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{cursosFiltrados.map((curso) => { const preenchidas = curso.vagas_total - curso.vagas_disponiveis; const percentual = curso.vagas_total ? Math.round((preenchidas / curso.vagas_total) * 100) : 0; return <div key={curso.id} className="rounded-xl border border-gray-200 bg-white p-5"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[curso.status]}`}>{STATUS_LABELS[curso.status]}</span><h3 className="mt-2 font-semibold text-gray-900">{curso.titulo}</h3><p className="mt-0.5 text-xs text-gray-500">{curso.categoria ?? 'Sem categoria'}</p><div className="my-3 flex gap-4 text-xs text-gray-500"><span className="flex items-center gap-1"><Calendar size={12}/>{curso.carga_horaria_horas}h</span><span className="flex items-center gap-1"><Users size={12}/>{preenchidas}/{curso.vagas_total}</span></div><p className="text-xs text-gray-500">Vagas disponíveis: {curso.vagas_disponiveis} ({percentual}% preenchidas)</p><div className="mt-4 flex justify-end gap-1 border-t border-gray-100 pt-3"><button onClick={() => setCursoEmEdicao(curso)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><Pencil size={14}/></button><button onClick={() => setCursoParaExcluir(curso)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14}/></button></div></div>; })}</div>}
    {!carregando && !erro && cursosFiltrados.length === 0 && <p className="py-12 text-center text-sm text-gray-400">Nenhum curso encontrado.</p>}
    {cursoEmEdicao !== undefined && <FormularioCurso curso={cursoEmEdicao} universidades={universidades} aoSalvar={salvar} aoFechar={() => setCursoEmEdicao(undefined)}/>}
    {cursoParaExcluir && <ConfirmacaoExclusao curso={cursoParaExcluir} confirmar={apagar} fechar={() => setCursoParaExcluir(null)}/>}
  </div>;
}
