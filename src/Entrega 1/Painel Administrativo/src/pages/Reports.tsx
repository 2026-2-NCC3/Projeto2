import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Download, FileText } from 'lucide-react';

const attendanceData = [
  { month: 'Mar', taxa: 78 }, { month: 'Abr', taxa: 81 }, { month: 'Mai', taxa: 79 },
  { month: 'Jun', taxa: 85 }, { month: 'Jul', taxa: 82 }, { month: 'Ago', taxa: 80 },
  { month: 'Set', taxa: 81 },
];

const conclusionData = [
  { curso: 'Python Básico', concluidos: 72, evasao: 15 },
  { curso: 'Excel Avançado', concluidos: 68, evasao: 6 },
  { curso: 'Design Gráfico', concluidos: 55, evasao: 13 },
  { curso: 'Marketing', concluidos: 49, evasao: 12 },
  { curso: 'Inglês A1', concluidos: 42, evasao: 13 },
];

const impactData = [
  { label: 'Alunos atendidos', value: 475, icon: '👥' },
  { label: 'Certificados emitidos', value: 248, icon: '🎓' },
  { label: 'Cursos ofertados', value: 14, icon: '📚' },
  { label: 'Universidades parceiras', value: 6, icon: '🏛️' },
  { label: 'Horas de capacitação', value: 8420, icon: '⏱️' },
  { label: 'Taxa média de conclusão', value: '74%', icon: '✅' },
];

export default function Reports() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análise e exportação de dados da plataforma</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={15} />
            Exportar PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={15} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Período:</span>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Últimos 6 meses</option>
            <option>Últimos 12 meses</option>
            <option>Este ano</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Curso:</span>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Todos os cursos</option>
            <option>Python Básico</option>
            <option>Excel Avançado</option>
          </select>
        </div>
      </div>

      {/* Impact summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Relatório de Impacto Social</h2>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full ml-2">Pitch de apresentação</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {impactData.map(d => (
            <div key={d.label} className="text-center">
              <div className="text-2xl mb-1">{d.icon}</div>
              <div className="text-xl font-semibold text-gray-900">{d.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Attendance chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Taxa de presença mensal</h2>
          <p className="text-xs text-gray-500 mb-4">Média ponderada de todos os cursos</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={attendanceData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} unit="%" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}%`, 'Taxa']} />
              <Line type="monotone" dataKey="taxa" stroke="#2563EB" strokeWidth={2} dot={{ r: 4, fill: '#2563EB' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Conclusion chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Conclusão vs. evasão por curso</h2>
          <p className="text-xs text-gray-500 mb-4">Número de alunos que concluíram ou evadiram</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={conclusionData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="curso" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={0} angle={-15} textAnchor="end" height={36} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="concluidos" fill="#2563EB" radius={[4, 4, 0, 0]} name="Concluídos" />
              <Bar dataKey="evasao" fill="#FCA5A5" radius={[4, 4, 0, 0]} name="Evasão" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Frequency table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Relatório de frequência por curso</h2>
          <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
            <Download size={12} />
            Exportar
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Curso', 'Inscritos', 'Presença média', 'Concluídos', 'Taxa de conclusão'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { name: 'Python Básico', enrolled: 87, attendance: 83, finished: 72, rate: 83 },
              { name: 'Excel Avançado', enrolled: 74, attendance: 87, finished: 68, rate: 92 },
              { name: 'Design Gráfico', enrolled: 68, attendance: 79, finished: 55, rate: 81 },
              { name: 'Marketing Digital', enrolled: 61, attendance: 76, finished: 49, rate: 80 },
              { name: 'Inglês A1', enrolled: 55, attendance: 82, finished: 42, rate: 76 },
            ].map(row => (
              <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-gray-900">{row.name}</td>
                <td className="px-3 py-2.5 text-gray-600">{row.enrolled}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${row.attendance}%` }} />
                    </div>
                    <span className="text-gray-700 text-xs">{row.attendance}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-600">{row.finished}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs font-medium ${row.rate >= 85 ? 'text-green-700' : row.rate >= 75 ? 'text-amber-700' : 'text-red-600'}`}>
                    {row.rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
