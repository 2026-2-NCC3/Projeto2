import { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle } from 'lucide-react';

const ATTENDANCE = [
  { id: 1, student: 'Maria Souza', course: 'Python Básico', activity: 'Aula 08 - Funções', date: '20/09/2026', time: '14:00', method: 'QR Code', present: true },
  { id: 2, student: 'Carlos Lima', course: 'Design Gráfico', activity: 'Workshop Tipografia', date: '20/09/2026', time: '09:30', method: 'QR Code', present: true },
  { id: 3, student: 'Ana Ferreira', course: 'Marketing Digital', activity: 'Aula 05 - SEO', date: '19/09/2026', time: '18:00', method: 'Manual', present: true },
  { id: 4, student: 'Pedro Santos', course: 'Python Básico', activity: 'Aula 08 - Funções', date: '20/09/2026', time: '14:00', method: 'QR Code', present: false },
  { id: 5, student: 'Julia Costa', course: 'Inglês A1', activity: 'Speaking Practice 3', date: '18/09/2026', time: '10:00', method: 'QR Code', present: true },
  { id: 6, student: 'Rafael Oliveira', course: 'Python Básico', activity: 'Aula 08 - Funções', date: '20/09/2026', time: '14:00', method: 'QR Code', present: true },
  { id: 7, student: 'Beatriz Alves', course: 'Empreendedorismo', activity: 'Pitch Day', date: '17/09/2026', time: '15:30', method: 'QR Code', present: false },
];

export default function Attendance() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');

  const filtered = ATTENDANCE.filter(a => {
    const matchesSearch = a.student.toLowerCase().includes(search.toLowerCase()) ||
      a.course.toLowerCase().includes(search.toLowerCase()) ||
      a.activity.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'todos' || (filter === 'presentes' && a.present) || (filter === 'ausentes' && !a.present);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Presenças</h1>
        <p className="text-sm text-gray-500 mt-0.5">Registros e validação de frequência</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total registros', value: ATTENDANCE.length, color: 'text-gray-900' },
          { label: 'Presenças confirmadas', value: ATTENDANCE.filter(a => a.present).length, color: 'text-green-700' },
          { label: 'Ausências', value: ATTENDANCE.filter(a => !a.present).length, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm placeholder-gray-400 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['todos', 'presentes', 'ausentes'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['Aluno', 'Curso', 'Atividade', 'Data', 'Método', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{a.student}</td>
                <td className="px-4 py-3 text-gray-600">{a.course}</td>
                <td className="px-4 py-3 text-gray-600">{a.activity}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.date} {a.time}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    a.method === 'QR Code' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {a.method}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.present ? (
                    <span className="flex items-center gap-1 text-xs text-green-700">
                      <CheckCircle size={13} /> Presente
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <XCircle size={13} /> Ausente
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
