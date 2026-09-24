import { useEffect, useState } from 'react';
import { AlertTriangle, Globe, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import { atualizarUniversidade, criarUniversidade, excluirUniversidade, listarUniversidades, } from '../services/api';
function dadosVazios() {
    return { nome: '', site: '', logo_url: '', descricao: '' };
}
function dadosDaUniversidade(universidade) {
    return {
        nome: universidade.nome,
        site: universidade.site ?? '',
        logo_url: universidade.logo_url ?? '',
        descricao: universidade.descricao ?? '',
    };
}
function criarPayload(dados) {
    return {
        nome: dados.nome.trim(),
        site: dados.site.trim() || null,
        logo_url: dados.logo_url.trim() || null,
        descricao: dados.descricao.trim() || null,
    };
}
function mensagemDeErro(erro) {
    return erro instanceof Error ? erro.message : 'Não foi possível concluir a operação.';
}
function FormularioUniversidade({ universidade, aoSalvar, aoFechar, }) {
    const [dados, setDados] = useState(universidade ? dadosDaUniversidade(universidade) : dadosVazios());
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const estilo = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
    function alterar(campo, valor) {
        setDados((atuais) => ({ ...atuais, [campo]: valor }));
        setErro('');
    }
    async function enviar(evento) {
        evento.preventDefault();
        if (!dados.nome.trim()) {
            setErro('Informe o nome da universidade.');
            return;
        }
        setSalvando(true);
        try {
            await aoSalvar(dados);
        }
        finally {
            setSalvando(false);
        }
    }
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={aoFechar}/>
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">{universidade ? 'Editar universidade' : 'Nova universidade'}</h2>
          <button onClick={aoFechar} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18}/></button>
        </div>
        <form onSubmit={enviar} noValidate>
          <div className="space-y-4 p-6">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label><input value={dados.nome} onChange={(e) => alterar('nome', e.target.value)} className={estilo}/>{erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Site</label><input type="url" value={dados.site} onChange={(e) => alterar('site', e.target.value)} className={estilo} placeholder="https://..."/></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">URL do logo</label><input type="url" value={dados.logo_url} onChange={(e) => alterar('logo_url', e.target.value)} className={estilo} placeholder="https://..."/></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label><textarea rows={4} value={dados.descricao} onChange={(e) => alterar('descricao', e.target.value)} className={`${estilo} resize-none`}/></div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4"><button type="button" onClick={aoFechar} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">Cancelar</button><button type="submit" disabled={salvando} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{salvando ? 'Salvando…' : universidade ? 'Salvar alterações' : 'Criar universidade'}</button></div>
        </form>
      </div>
    </div>);
}
function ConfirmacaoExclusao({ universidade, confirmar, fechar }) {
    const [excluindo, setExcluindo] = useState(false);
    async function executar() {
        setExcluindo(true);
        try {
            await confirmar();
        }
        finally {
            setExcluindo(false);
        }
    }
    return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30" onClick={fechar}/><div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"><div className="mb-4 flex gap-3"><AlertTriangle className="text-red-600"/><div><h3 className="font-semibold">Excluir universidade</h3><p className="mt-1 text-sm text-gray-500">Excluir <strong>{universidade.nome}</strong>?</p></div></div><div className="flex justify-end gap-3"><button onClick={fechar} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><button onClick={executar} disabled={excluindo} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-60">{excluindo ? 'Excluindo…' : 'Excluir'}</button></div></div></div>;
}
export default function Universities() {
    const { toast } = useToast();
    const [universidades, setUniversidades] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [universidadeEmEdicao, setUniversidadeEmEdicao] = useState(undefined);
    const [universidadeParaExcluir, setUniversidadeParaExcluir] = useState(null);
    async function carregar() {
        setCarregando(true);
        setErro('');
        try {
            setUniversidades(await listarUniversidades());
        }
        catch (erroDaApi) {
            setErro(mensagemDeErro(erroDaApi));
        }
        finally {
            setCarregando(false);
        }
    }
    useEffect(() => { void carregar(); }, []);
    const filtradas = universidades.filter((universidade) => universidade.nome.toLowerCase().includes(busca.toLowerCase()));
    async function salvar(dados) {
        try {
            const salva = universidadeEmEdicao
                ? await atualizarUniversidade(universidadeEmEdicao.id, criarPayload(dados))
                : await criarUniversidade(criarPayload(dados));
            setUniversidades((atuais) => universidadeEmEdicao ? atuais.map((universidade) => universidade.id === salva.id ? salva : universidade) : [salva, ...atuais]);
            toast(universidadeEmEdicao ? 'Universidade atualizada com sucesso.' : 'Universidade criada com sucesso.');
            setUniversidadeEmEdicao(undefined);
        }
        catch (erroDaApi) {
            toast(mensagemDeErro(erroDaApi), 'error');
        }
    }
    async function apagar() {
        if (!universidadeParaExcluir)
            return;
        try {
            await excluirUniversidade(universidadeParaExcluir.id);
            setUniversidades((atuais) => atuais.filter((universidade) => universidade.id !== universidadeParaExcluir.id));
            toast('Universidade excluída com sucesso.', 'info');
            setUniversidadeParaExcluir(null);
        }
        catch (erroDaApi) {
            toast(mensagemDeErro(erroDaApi), 'error');
        }
    }
    return <div className="space-y-4 p-6"><div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-gray-900">Universidades</h1><p className="mt-0.5 text-sm text-gray-500">{filtradas.length} universidade(s)</p></div><button onClick={() => setUniversidadeEmEdicao(null)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"><Plus size={16}/>Nova universidade</button></div><div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2"><Search size={15} className="text-gray-400"/><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar universidades..." className="flex-1 bg-transparent text-sm outline-none"/></div>{erro && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro} <button onClick={() => void carregar()} className="ml-2 underline">Tentar novamente</button></div>}{carregando ? <p className="py-12 text-center text-sm text-gray-500">Carregando universidades…</p> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{filtradas.map((universidade) => <div key={universidade.id} className="rounded-xl border border-gray-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3">{universidade.logo_url ? <img src={universidade.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover"/> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Globe size={18}/></div>}<div><h3 className="font-semibold text-gray-900">{universidade.nome}</h3>{universidade.site && <a href={universidade.site} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Visitar site</a>}</div></div><div className="flex gap-1"><button onClick={() => setUniversidadeEmEdicao(universidade)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><Pencil size={14}/></button><button onClick={() => setUniversidadeParaExcluir(universidade)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14}/></button></div></div><p className="mt-4 text-sm text-gray-500">{universidade.descricao ?? 'Sem descrição cadastrada.'}</p></div>)}</div>}{!carregando && !erro && filtradas.length === 0 && <p className="py-12 text-center text-sm text-gray-400">Nenhuma universidade encontrada.</p>}{universidadeEmEdicao !== undefined && <FormularioUniversidade universidade={universidadeEmEdicao} aoSalvar={salvar} aoFechar={() => setUniversidadeEmEdicao(undefined)}/>}{universidadeParaExcluir && <ConfirmacaoExclusao universidade={universidadeParaExcluir} confirmar={apagar} fechar={() => setUniversidadeParaExcluir(null)}/>}</div>;
}
