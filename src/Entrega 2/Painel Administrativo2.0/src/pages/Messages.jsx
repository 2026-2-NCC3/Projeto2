import { useState } from 'react';
import { Send, Users, ChevronDown } from 'lucide-react';
const SENT_MESSAGES = [
    { id: 1, subject: 'Lembrete: aula amanhã às 14h', recipients: 'Todos os alunos', sent: '21/09/2026 18:00', reads: 312, total: 475 },
    { id: 2, subject: 'Certificados disponíveis — Inglês A1', recipients: 'Python Básico', sent: '19/09/2026 10:30', reads: 52, total: 87 },
    { id: 3, subject: 'Pesquisa de satisfação — participe!', recipients: 'Todos os alunos', sent: '15/09/2026 09:00', reads: 208, total: 475 },
    { id: 4, subject: 'Nova atividade adicionada ao curso', recipients: 'Design Gráfico', sent: '10/09/2026 14:00', reads: 58, total: 68 },
];
export default function Messages() {
    const [tab, setTab] = useState('compose');
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [recipient, setRecipient] = useState('Todos os alunos');
    return (<div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Mensagens e Notificações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Comunicação com alunos da plataforma</p>
      </div>

      <div className="flex border-b border-gray-200">
        {[{ id: 'compose', label: 'Compor mensagem' }, { id: 'history', label: 'Histórico de envios' }].map(t => (<button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>))}
      </div>

      {tab === 'compose' && (<div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinatários</label>
            <div className="relative">
              <select value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option>Todos os alunos</option>
                <option>Python Básico</option>
                <option>Excel Avançado</option>
                <option>Design Gráfico</option>
                <option>Marketing Digital</option>
                <option>Aluno individual...</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto da mensagem" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
            <textarea rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="Escreva sua mensagem aqui..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agendamento (opcional)</label>
            <input type="datetime-local" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Send size={14}/>
              Enviar agora
            </button>
            <button className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              Agendar envio
            </button>
          </div>
        </div>)}

      {tab === 'history' && (<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Assunto', 'Destinatários', 'Enviado em', 'Taxa de leitura'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {SENT_MESSAGES.map(m => {
                const readPct = Math.round((m.reads / m.total) * 100);
                return (<tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.subject}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Users size={13} className="text-gray-400"/>
                        {m.recipients}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.sent}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${readPct}%` }}/>
                        </div>
                        <span className="text-xs text-gray-700">{readPct}% ({m.reads}/{m.total})</span>
                      </div>
                    </td>
                  </tr>);
            })}
            </tbody>
          </table>
        </div>)}
    </div>);
}
