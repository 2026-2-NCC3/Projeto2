import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Users, BookOpen, CheckSquare, Award } from 'lucide-react';

const enrollmentTrend = [
  { week: 'Sem 1', value: 12 }, { week: 'Sem 2', value: 19 }, { week: 'Sem 3', value: 15 },
  { week: 'Sem 4', value: 28 }, { week: 'Sem 5', value: 22 }, { week: 'Sem 6', value: 35 },
  { week: 'Sem 7', value: 31 }, { week: 'Sem 8', value: 42 }, { week: 'Sem 9', value: 38 },
  { week: 'Sem 10', value: 47 }, { week: 'Sem 11', value: 53 }, { week: 'Sem 12', value: 61 },
];

const courseDistribution = [
  { curso: 'Python Básico', alunos: 87 },
  { curso: 'Excel Avançado', alunos: 74 },
  { curso: 'Design Gráfico', alunos: 68 },
  { curso: 'Marketing Digital', alunos: 61 },
  { curso: 'Inglês A1', alunos: 55 },
  { curso: 'Lógica de Prog.', alunos: 49 },
  { curso: 'Empreendedorismo', alunos: 43 },
  { curso: 'Outros', alunos: 38 },
];

const profileResults = [
  { name: 'Analítico', value: 32, color: '#2563EB' },
  { name: 'Criativo', value: 25, color: '#7C3AED' },
  { name: 'Comunicador', value: 22, color: '#059669' },
  { name: 'Executor', value: 21, color: '#D97706' },
];

const attendanceData = [
  { curso: 'Python', min: 52, q1: 70, median: 82, q3: 91, max: 100 },
  { curso: 'Excel', min: 45, q1: 65, median: 78, q3: 88, max: 98 },
  { curso: 'Design', min: 60, q1: 74, median: 85, q3: 93, max: 100 },
  { curso: 'Marketing', min: 30, q1: 55, median: 70, q3: 85, max: 97 },
  { curso: 'Inglês', min: 55, q1: 72, median: 83, q3: 92, max: 100 },
];

const recentEnrollments = [
  { name: 'Maria Souza', course: 'Python Básico', date: '22/09/2026' },
  { name: 'Carlos Lima', course: 'Design Gráfico', date: '22/09/2026' },
  { name: 'Ana Ferreira', course: 'Excel Avançado', date: '21/09/2026' },
  { name: 'Pedro Santos', course: 'Marketing Digital', date: '21/09/2026' },
  { name: 'Julia Costa', course: 'Inglês A1', date: '20/09/2026' },
];

interface KPICardProps {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  subtitle: string;
}

function KPICard({ label, value, change, changePositive, icon: Icon, subtitle }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon size={20} className="text-blue-600" />
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          changePositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          {changePositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {change}
        </span>
      </div>
      <p className="text-3xl font-semibold text-gray-900 leading-none mb-1">{value}</p>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral da plataforma — setembro 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Alunos ativos" value="475" change="+12% vs mês ant." changePositive={true} icon={Users} subtitle="38 novos este mês" />
        <KPICard label="Cursos em andamento" value="14" change="+2 vs mês ant." changePositive={true} icon={BookOpen} subtitle="3 encerram nos próx. 7 dias" />
        <KPICard label="Taxa de presença média" value="81%" change="-2% vs mês ant." changePositive={false} icon={CheckSquare} subtitle="Média ponderada todos os cursos" />
        <KPICard label="Certificados emitidos" value="63" change="+18% vs mês ant." changePositive={true} icon={Award} subtitle="No mês de setembro" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Line chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Novas inscrições por semana</h2>
          <p className="text-xs text-gray-500 mb-4">Últimas 12 semanas</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={enrollmentTrend} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
              <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} dot={{ r: 3, fill: '#2563EB' }} name="Inscrições" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Alunos por curso</h2>
          <p className="text-xs text-gray-500 mb-4">Top 8 cursos com mais inscrições</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={courseDistribution} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="curso" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={0} angle={-20} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
              <Bar dataKey="alunos" fill="#2563EB" radius={[4, 4, 0, 0]} name="Alunos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Attendance distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Dispersão de presença por curso</h2>
          <p className="text-xs text-gray-500 mb-4">Intervalo mín/máx e mediana — identifica frequência irregular</p>
          <div className="space-y-3">
            {attendanceData.map(d => (
              <div key={d.curso} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 flex-shrink-0">{d.curso}</span>
                <div className="flex-1 relative h-6">
                  <div className="absolute inset-y-0 flex items-center w-full">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full relative">
                      <div
                        className="absolute h-1.5 bg-blue-100 rounded-full"
                        style={{ left: `${d.min}%`, width: `${d.max - d.min}%` }}
                      />
                      <div
                        className="absolute h-1.5 bg-blue-400 rounded-full"
                        style={{ left: `${d.q1}%`, width: `${d.q3 - d.q1}%` }}
                      />
                      <div
                        className="absolute w-2.5 h-2.5 bg-blue-600 rounded-full -translate-y-1/2 top-1/2 -translate-x-1/2"
                        style={{ left: `${d.median}%` }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{d.median}%</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 bg-blue-100 rounded" /><span className="text-xs text-gray-500">Intervalo total</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 bg-blue-400 rounded" /><span className="text-xs text-gray-500">IQR (Q1–Q3)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-600 rounded-full" /><span className="text-xs text-gray-500">Mediana</span></div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Resultados de perfil</h2>
          <p className="text-xs text-gray-500 mb-2">Distribuição dos alunos por classificação</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={profileResults} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {profileResults.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} formatter={(v) => [`${v} alunos`, '']} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ fontSize: 12, color: '#374151' }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent enrollments */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Últimas inscrições</h2>
            <button className="text-xs text-blue-600 hover:underline">Ver todas</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 pb-2">Aluno</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2">Curso</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentEnrollments.map((e, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 text-gray-900 font-medium">{e.name}</td>
                  <td className="py-2.5 text-gray-600">{e.course}</td>
                  <td className="py-2.5 text-gray-400 text-right text-xs">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Pendências operacionais</h2>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-800">3 certificados aguardando aprovação</p>
            <button className="mt-2 text-xs text-amber-700 font-medium hover:underline">Revisar agora →</button>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-800">7 novas inscrições hoje</p>
            <button className="mt-2 text-xs text-blue-700 font-medium hover:underline">Ver inscrições →</button>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-semibold text-green-800">Sincronização com app: OK</p>
            <p className="text-xs text-green-600 mt-0.5">Última: 22/09/2026 às 14:32</p>
          </div>
        </div>
      </div>
    </div>
  );
}
