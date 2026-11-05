import { useEffect, useState } from 'react';
import { Award, Search } from 'lucide-react';
import { listarCertificados } from '../services/api';
import { administradorAutorizado } from '../utils/checkin';
import { CERTIFICATE_STATUSES, CRITERIA_LABELS, filterCertificates, validateCertificates } from '../utils/certificates';

function CertificatesContent() {
    const [certificates, setCertificates] = useState([]);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('todos');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        listarCertificados({ signal: controller.signal })
            .then(records => {
                const valid = validateCertificates(records);
                if (!controller.signal.aborted) setCertificates(valid);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setCertificates([]);
                    setError('Não foi possível consultar os certificados. Verifique sua conexão e permissão.');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [attempt]);
    const filtered = filterCertificates(certificates, search, status);

    return (
        <div className="space-y-4 p-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Certificados</h1>
                <p className="mt-0.5 text-sm text-gray-500">Consulta de registros e critérios cadastrados.</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                A origem dos PDFs ainda não foi validada. Visualização e download estão indisponíveis.
                Esta tela não emite certificados nem modifica critérios.
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {Object.entries(CERTIFICATE_STATUSES).map(([key, definition]) => (
                    <div key={key} className={`rounded-xl border p-4 ${definition.badge}`}>
                        <p className="text-2xl font-semibold">{certificates.filter(certificate => certificate.status === key).length}</p>
                        <p className="mt-1 text-xs">{definition.label}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                    <Search size={16} className="text-gray-400" />
                    <span className="sr-only">Buscar aluno ou curso</span>
                    <input value={search} onChange={event => setSearch(event.target.value)}
                        placeholder="Buscar aluno ou curso…" className="w-full text-sm outline-none" />
                </label>
                <label className="text-sm text-gray-600">
                    <span className="sr-only">Situação do certificado</span>
                    <select aria-label="Situação do certificado" value={status} onChange={event => setStatus(event.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2">
                        <option value="todos">Todos</option>
                        {Object.entries(CERTIFICATE_STATUSES).map(([key, definition]) =>
                            <option key={key} value={key}>{definition.label}</option>)}
                    </select>
                </label>
                <button onClick={() => setAttempt(value => value + 1)} disabled={loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                    {loading ? 'Consultando…' : 'Atualizar'}
                </button>
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            {loading ? <p role="status" className="py-8 text-center text-gray-500">Carregando certificados…</p>
                : <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>
                            {['Aluno', 'Curso', 'Situação', 'Critérios', 'Emissão', 'Arquivo'].map(label =>
                                <th key={label} className="px-4 py-3">{label}</th>)}
                        </tr></thead>
                        <tbody>{filtered.map(certificate => (
                            <tr key={certificate.id} className="border-t border-gray-100">
                                <td className="px-4 py-3 font-medium">{certificate.aluno_nome}</td>
                                <td className="px-4 py-3">{certificate.titulo}</td>
                                <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${CERTIFICATE_STATUSES[certificate.status].badge}`}>
                                    {CERTIFICATE_STATUSES[certificate.status].label}</span></td>
                                <td className="px-4 py-3 text-xs text-gray-600">
                                    {certificate.criterios.length === 0 ? 'Não registrados' : certificate.criterios.map(criterion =>
                                        <p key={criterion.criterio}>{CRITERIA_LABELS[criterion.criterio]}: {criterion.atendido === 1 ? 'Atendido' : 'Pendente'}</p>)}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">{certificate.emitido_em || '—'}</td>
                                <td className="px-4 py-3"><button disabled title="Armazenamento dos PDFs não validado"
                                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500">
                                    <Award size={14} /> Arquivo indisponível</button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                    {!error && filtered.length === 0 && <p className="p-8 text-center text-sm text-gray-500">Nenhum certificado encontrado.</p>}
                </div>}
        </div>
    );
}

export default function Certificates({ usuario }) {
    return administradorAutorizado(usuario) ? <CertificatesContent />
        : <p role="alert" className="p-6 text-red-700">Acesso restrito a administradores.</p>;
}
