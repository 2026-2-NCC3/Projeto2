import { useState } from 'react';
import { Award, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { useToast } from '../components/Toast';

type CertStatus = 'emitido' | 'pronto' | 'pendente' | 'revogado';

interface Cert {
  id: number;
  student: string;
  course: string;
  status: CertStatus;
  issued: string | null;
  criteria: { attendance: boolean; assessment: boolean; hours: boolean };
}

const INITIAL: Cert[] = [
  { id: 1, student: 'Maria Souza', course: 'Python Básico', status: 'emitido', issued: '20/09/2026', criteria: { attendance: true, assessment: true, hours: true } },
  { id: 2, student: 'Carlos Lima', course: 'Design Gráfico', status: 'pronto', issued: null, criteria: { attendance: true, assessment: true, hours: true } },
  { id: 3, student: 'Ana Ferreira', course: 'Marketing Digital', status: 'pendente', issued: null, criteria: { attendance: true, assessment: false, hours: true } },
  { id: 4, student: 'Pedro Santos', course: 'Python Básico', status: 'pendente', issued: null, criteria: { attendance: false, assessment: false, hours: true } },
  { id: 5, student: 'Julia Costa', course: 'Inglês A1', status: 'emitido', issued: '15/09/2026', criteria: { attendance: true, assessment: true, hours: true } },
  { id: 6, student: 'Rafael Oliveira', course: 'Lógica de Prog.', status: 'pronto', issued: null, criteria: { attendance: true, assessment: true, hours: true } },
  { id: 7, student: 'Beatriz Alves', course: 'Empreendedorismo', status: 'revogado', issued: null, criteria: { attendance: true, assessment: true, hours: true } },
];

const STATUS_STYLES: Record<CertStatus, { badge: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  emitido: { badge: 'bg-green-50 text-green-700 border border-green-200', label: 'Emitido', icon: CheckCircle },
  pronto: { badge: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'Pronto para emissão', icon: Award },
  pendente: { badge: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Pendente de critério', icon: Clock },
  revogado: { badge: 'bg-red-50 text-red-700 border border-red-200', label: 'Revogado', icon: XCircle },
};

const CRITERIA_LABELS: Record<string, string> = {
  attendance: 'Presença',
  assessment: 'Avaliação',
  hours: 'Carga horária',
};

export default function Certificates() {
  const { toast } = useToast();
  const [certs, setCerts] = useState<Cert[]>(INITIAL);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | CertStatus>('todos');

  const filtered = certs.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = c.student.toLowerCase().includes(q) || c.course.toLowerCase().includes(q);
    const matchesFilter = filter === 'todos' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const emit = (cert: Cert) => {
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    setCerts(prev => prev.map(c => c.id === cert.id ? { ...c, status: 'emitido', issued: dateStr } : c));
    toast(`Certificado emitido para ${cert.student}`, 'success');
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Certificados</h1>
        <p className="text-sm text-gray-500 mt-0.5">Emissão e gestão de certificados</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {(['emitido', 'pronto', 'pendente', 'revogado'] as CertStatus[]).map(s => {
          const count = certs.filter(c => c.status === s).length;
          const { label, badge } = STATUS_STYLES[s];
          const [textCls, bgCls, borderCls] = badge.split(' ');
          return (
            <div key={s} className={`rounded-xl border p-4 ${bgCls} ${borderCls}`}>
              <p className={`text-2xl font-semibold ${textCls}`}>{count}</p>
              <p className={`text-xs mt-0.5 ${textCls} opacity-80`}>{label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Buscar aluno ou curso..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'pronto', 'pendente', 'emitido', 'revogado'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
              {f === 'todos' ? 'Todos' : STATUS_STYLES[f]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['Aluno', 'Curso', 'Status', 'Critérios', 'Data emissão', 'Ações'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(cert => {
              const s = STATUS_STYLES[cert.status];
              const metCount = Object.values(cert.criteria).filter(Boolean).length;
              const total = Object.keys(cert.criteria).length;
              const missingLabels = Object.entries(cert.criteria).filter(([, v]) => !v).map(([k]) => CRITERIA_LABELS[k] || k);

              return (
                <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{cert.student}</td>
                  <td className="px-4 py-3 text-gray-600">{cert.course}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${s.badge}`}>
                      <s.icon size={11} />
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {Object.entries(cert.criteria).map(([key, met]) => (
                          <div key={key} title={`${CRITERIA_LABELS[key]}: ${met ? 'OK' : 'Pendente'}`}
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${met ? 'bg-green-500' : 'bg-gray-200'}`}>
                            {met ? <CheckCircle size={10} className="text-white" /> : <XCircle size={10} className="text-gray-400" />}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{metCount}/{total}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{cert.issued || '—'}</td>
                  <td className="px-4 py-3">
                    {cert.status === 'pronto' && (
                      <button onClick={() => emit(cert)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                        <Award size={12} />Emitir
                      </button>
                    )}
                    {cert.status === 'pendente' && (
                      <button disabled
                        title={`Falta(m): ${missingLabels.join(', ')}`}
                        className="px-3 py-1 bg-gray-100 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed">
                        Emitir
                      </button>
                    )}
                    {cert.status === 'emitido' && (
                      <button className="px-3 py-1 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors">
                        Baixar PDF
                      </button>
                    )}
                    {cert.status === 'revogado' && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
