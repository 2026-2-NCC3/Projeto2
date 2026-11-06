import { useEffect, useRef, useState } from 'react';
import { Send, Plus, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import { listarMensagens, criarMensagem, editarMensagem, excluirMensagem, publicarMensagem, listarCursos, listarPerfis } from '../services/api';
import { administradorAutorizado } from '../utils/checkin';
import { AUDIENCES, messagePayload, validateMessages } from '../utils/messages';

const inputStyle = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function failureMessage(error) {
    return error?.status ? error.message : 'Não foi possível confirmar a operação. Atualize a lista antes de repetir.';
}

function MessageForm({ message, courses, students, close, saved }) {
    const [form, setForm] = useState(message || { titulo: '', corpo: '', publico_alvo: 'todos', curso_id: '', aluno_ids: [] });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const operation = useRef(null);
    useEffect(() => () => operation.current?.abort(), []);
    function change(field, value) { setForm(previous => ({ ...previous, [field]: value })); setError(''); }
    async function submit(event) {
        event.preventDefault();
        if (operation.current && !operation.current.signal.aborted) return;
        let payload;
        try { payload = messagePayload(form); }
        catch (validation) { setError(validation.message); return; }
        const controller = new AbortController();
        operation.current = controller;
        setSaving(true); setError('');
        try {
            const result = message
                ? await editarMensagem(message.id, payload, { signal: controller.signal })
                : await criarMensagem(payload, { signal: controller.signal });
            validateMessages([result]);
            if (!controller.signal.aborted) saved();
        } catch (failure) {
            if (!controller.signal.aborted) setError(failureMessage(failure));
        } finally { if (!controller.signal.aborted) { setSaving(false); operation.current = null; } }
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <section role="dialog" aria-modal="true" aria-labelledby="message-form-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
                <header className="flex items-center justify-between border-b border-gray-200 p-5">
                    <h2 id="message-form-title" className="font-semibold">{message ? 'Editar rascunho' : 'Novo comunicado'}</h2>
                    <button disabled={saving} onClick={close} aria-label="Fechar formulário" className="rounded-lg p-2 hover:bg-gray-100"><X size={18} /></button>
                </header>
                <form onSubmit={submit} className="space-y-4 p-5">
                    <label className="block text-sm font-medium">Assunto
                        <input required maxLength={160} value={form.titulo} onChange={event => change('titulo', event.target.value)} className={inputStyle} />
                    </label>
                    <label className="block text-sm font-medium">Conteúdo
                        <textarea required maxLength={10000} rows={7} value={form.corpo}
                            onChange={event => change('corpo', event.target.value)} className={inputStyle} />
                    </label>
                    <label className="block text-sm font-medium">Público
                        <select aria-label="Público" value={form.publico_alvo} onChange={event => change('publico_alvo', event.target.value)} className={inputStyle}>
                            {Object.entries(AUDIENCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                    {form.publico_alvo === 'curso' && <label className="block text-sm font-medium">Curso
                        <select aria-label="Curso" required value={form.curso_id || ''} onChange={event => change('curso_id', event.target.value)} className={inputStyle}>
                            <option value="">Selecione um curso</option>
                            {courses.map(course => <option key={course.id} value={course.id}>{course.titulo}</option>)}
                        </select>
                    </label>}
                    {form.publico_alvo === 'individual' && <label className="block text-sm font-medium">Alunos
                        <select aria-label="Alunos" multiple size={5} value={form.aluno_ids}
                            onChange={event => change('aluno_ids', [...event.target.selectedOptions].map(option => option.value))} className={inputStyle}>
                            {students.filter(student => student.ativo === 1 && student.bloqueado === 0)
                                .map(student => <option key={student.id} value={student.id}>{student.nome_completo}</option>)}
                        </select>
                        <span className="mt-1 block text-xs font-normal text-gray-500">O servidor valida os destinatários novamente na publicação.</span>
                    </label>}
                    <p className="text-sm text-gray-500">Salvar mantém o comunicado como rascunho. A publicação é uma ação separada.</p>
                    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                    <div className="flex justify-end gap-3">
                        <button type="button" disabled={saving} onClick={close} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancelar</button>
                        <button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                            {saving ? 'Salvando…' : 'Salvar rascunho'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

function MessageAction({ action, close, completed }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const controller = useRef(null);
    useEffect(() => () => controller.current?.abort(), []);
    async function execute() {
        if (controller.current) return;
        controller.current = new AbortController();
        setBusy(true); setError('');
        try {
            if (action.type === 'publish') {
                const result = await publicarMensagem(action.message.id, { signal: controller.current.signal });
                validateMessages([result]);
                if (!controller.current.signal.aborted) completed('Publicação registrada para ' + result.total_destinatarios + ' aluno(s).');
            } else {
                await excluirMensagem(action.message.id, { signal: controller.current.signal });
                if (!controller.current.signal.aborted) completed('Rascunho excluído.');
            }
        } catch (failure) {
            if (!controller.current.signal.aborted) setError(failureMessage(failure));
        } finally {
            if (!controller.current.signal.aborted) { setBusy(false); controller.current = null; }
        }
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <section role="dialog" aria-modal="true" aria-label="Confirmar operação"
                className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-2xl">
                <h2 className="font-semibold">{action.type === 'publish' ? 'Publicar comunicado' : 'Excluir rascunho'}</h2>
                <p className="break-words text-sm text-gray-700">{action.message.titulo}</p>
                <p className="text-sm text-gray-500">{action.type === 'publish'
                    ? 'O servidor define os destinatários elegíveis agora. Depois da publicação, o comunicado fica preservado.'
                    : 'Somente este rascunho será removido.'}</p>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <div className="flex justify-end gap-3">
                    <button disabled={busy} onClick={close} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
                    <button disabled={busy} onClick={execute} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                        {busy ? 'Processando…' : action.type === 'publish' ? 'Confirmar publicação' : 'Confirmar exclusão'}
                    </button>
                </div>
            </section>
        </div>
    );
}

function MessagesContent() {
    const { toast } = useToast();
    const [messages, setMessages] = useState([]);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [editing, setEditing] = useState(undefined);
    const [action, setAction] = useState(null);
    const [viewing, setViewing] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        Promise.all([listarMensagens({ signal: controller.signal }), listarCursos({ signal: controller.signal }), listarPerfis({ signal: controller.signal })])
            .then(([records, currentCourses, currentStudents]) => {
                validateMessages(records);
                if (!Array.isArray(currentCourses) || !Array.isArray(currentStudents)) throw new Error('Resposta inválida.');
                if (!controller.signal.aborted) { setMessages(records); setCourses(currentCourses); setStudents(currentStudents); }
            })
            .catch(() => {
                if (!controller.signal.aborted) { setMessages([]); setError('Não foi possível consultar os comunicados e destinatários. Verifique a conexão e a permissão.'); }
            }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [attempt]);
    function refresh() { setAttempt(value => value + 1); }
    return (
        <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h1 className="text-xl font-semibold text-gray-900">Mensagens e comunicados</h1>
                    <p className="mt-1 text-sm text-gray-500">Rascunhos e publicações para alunos.</p></div>
                <button disabled={loading || Boolean(error)} onClick={() => setEditing(null)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"><Plus size={16} />Novo comunicado</button>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Destinatários são definidos na publicação. Grupos por curso consideram vínculos não cancelados.
                A publicação também gera um alerta na central do aluno. Agendamento e envio push não estão disponíveis.
            </div>
            <button disabled={loading} onClick={refresh} className="rounded-lg border bg-white px-4 py-2 text-sm">{loading ? 'Consultando…' : 'Atualizar'}</button>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            {!loading && <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>
                        {['Assunto', 'Público', 'Publicação', 'Leituras', 'Ações'].map(label => <th key={label} className="px-4 py-3">{label}</th>)}
                    </tr></thead>
                    <tbody>{messages.map(message => <tr key={message.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium"><button onClick={() => setViewing(message)} className="text-left text-blue-700 underline">{message.titulo}</button></td>
                        <td className="px-4 py-3">{AUDIENCES[message.publico_alvo]}<span className="block text-xs text-gray-500">{message.curso_titulo}</span></td>
                        <td className="px-4 py-3">{message.enviado_em ? <span className="text-green-700">Publicado<span className="block text-xs">{message.enviado_em}</span></span>
                            : <span className="text-amber-700">Rascunho</span>}</td>
                        <td className="px-4 py-3">{message.enviado_em ? message.total_lidos + ' / ' + message.total_destinatarios : '—'}</td>
                        <td className="px-4 py-3">{!message.enviado_em && <div className="flex flex-wrap gap-2">
                            <button onClick={() => setEditing(message)} className="rounded-lg border px-3 py-2 text-xs">Editar</button>
                            <button onClick={() => setAction({ type: 'delete', message })} className="rounded-lg border px-3 py-2 text-xs text-red-700">Excluir rascunho</button>
                            <button disabled={Boolean(message.agendado_para)} onClick={() => setAction({ type: 'publish', message })}
                                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs text-white disabled:opacity-50"><Send size={13} />Publicar</button>
                        </div>}</td>
                    </tr>)}</tbody>
                </table>
                {!error && messages.length === 0 && <p className="p-8 text-center text-gray-500">Nenhum comunicado cadastrado.</p>}
            </div>}
            {editing !== undefined && <MessageForm message={editing} courses={courses} students={students}
                close={() => setEditing(undefined)} saved={() => { setEditing(undefined); refresh(); toast('Rascunho salvo.'); }} />}
            {action && <MessageAction action={action} close={() => setAction(null)}
                completed={message => { setAction(null); refresh(); toast(message); }} />}
            {viewing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                <section role="dialog" aria-modal="true" aria-label="Conteúdo do comunicado" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
                    <h2 className="break-words font-semibold">{viewing.titulo}</h2>
                    <p className="mt-2 text-xs text-gray-500">{viewing.autor_nome} · {viewing.enviado_em || 'Rascunho'}</p>
                    <p className="my-5 whitespace-pre-wrap break-words text-sm">{viewing.corpo}</p>
                    <button onClick={() => setViewing(null)} className="rounded-lg border px-4 py-2 text-sm">Fechar</button>
                </section>
            </div>}
        </div>
    );
}

export default function Messages({ usuario }) {
    return administradorAutorizado(usuario) ? <MessagesContent /> : <p role="alert" className="p-6 text-red-700">Acesso restrito a administradores.</p>;
}
