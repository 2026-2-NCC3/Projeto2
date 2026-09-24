import { useState } from 'react';
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/Toast';

interface Alternative {
  id: number;
  text: string;
  weight: number;
}

interface Question {
  id: number;
  text: string;
  expanded: boolean;
  alternatives: Alternative[];
}

const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1, text: 'Como você prefere aprender novas habilidades?', expanded: true,
    alternatives: [
      { id: 1, text: 'Estudando teoria antes de praticar', weight: 3 },
      { id: 2, text: 'Praticando diretamente e aprendendo com os erros', weight: 4 },
      { id: 3, text: 'Assistindo a demonstrações', weight: 2 },
      { id: 4, text: 'Discutindo com outras pessoas', weight: 1 },
    ]
  },
  {
    id: 2, text: 'Quando você enfrenta um problema complexo, você:', expanded: false,
    alternatives: [
      { id: 1, text: 'Analisa todos os dados antes de agir', weight: 4 },
      { id: 2, text: 'Testa soluções rapidamente', weight: 3 },
      { id: 3, text: 'Busca ajuda de especialistas', weight: 2 },
      { id: 4, text: 'Cria soluções criativas e inovadoras', weight: 1 },
    ]
  },
];

const RESULTS = [
  { student: 'Maria Souza', type: 'Analítico', date: '10/09/2026', score: 28 },
  { student: 'Carlos Lima', type: 'Criativo', date: '11/09/2026', score: 24 },
  { student: 'Ana Ferreira', type: 'Comunicador', date: '12/09/2026', score: 22 },
  { student: 'Julia Costa', type: 'Executor', date: '13/09/2026', score: 20 },
  { student: 'Rafael Oliveira', type: 'Analítico', date: '14/09/2026', score: 30 },
];

const TYPE_COLORS: Record<string, string> = {
  'Analítico': 'bg-blue-50 text-blue-700 border-blue-200',
  'Criativo': 'bg-purple-50 text-purple-700 border-purple-200',
  'Comunicador': 'bg-green-50 text-green-700 border-green-200',
  'Executor': 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function Tests() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'builder' | 'results'>('builder');
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);

  const toggleExpand = (id: number) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, expanded: !q.expanded } : q));
  };

  const deleteQuestion = (id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    toast('Pergunta removida', 'info');
  };

  const updateQuestionText = (id: number, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, text } : q));
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: Date.now(),
      text: 'Nova pergunta',
      expanded: true,
      alternatives: [
        { id: Date.now() + 1, text: 'Alternativa A', weight: 1 },
        { id: Date.now() + 2, text: 'Alternativa B', weight: 2 },
      ],
    };
    setQuestions(prev => [...prev, newQ]);
    toast('Pergunta adicionada', 'success');
  };

  const addAlternative = (qId: number) => {
    setQuestions(prev => prev.map(q => q.id === qId
      ? { ...q, alternatives: [...q.alternatives, { id: Date.now(), text: 'Nova alternativa', weight: 1 }] }
      : q
    ));
  };

  const updateAlternativeText = (qId: number, altId: number, text: string) => {
    setQuestions(prev => prev.map(q => q.id === qId
      ? { ...q, alternatives: q.alternatives.map(a => a.id === altId ? { ...a, text } : a) }
      : q
    ));
  };

  const updateAlternativeWeight = (qId: number, altId: number, weight: number) => {
    setQuestions(prev => prev.map(q => q.id === qId
      ? { ...q, alternatives: q.alternatives.map(a => a.id === altId ? { ...a, weight } : a) }
      : q
    ));
  };

  const deleteAlternative = (qId: number, altId: number) => {
    setQuestions(prev => prev.map(q => q.id === qId
      ? { ...q, alternatives: q.alternatives.filter(a => a.id !== altId) }
      : q
    ));
  };

  const handleSaveTest = () => {
    toast('Teste salvo com sucesso');
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Testes de Perfil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Construtor e resultados dos testes</p>
        </div>
        {tab === 'builder' && (
          <button onClick={handleSaveTest}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Salvar teste
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        {[{ id: 'builder', label: 'Construtor de teste' }, { id: 'results', label: 'Resultados' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as 'builder' | 'results')}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'results' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium">
            Atenção: Os resultados dos testes de perfil têm finalidade exclusivamente educacional e de orientação.{' '}
            <strong>Não devem ser interpretados como diagnóstico psicológico</strong> ou utilizados para fins de seleção, exclusão ou rotulação de alunos.
          </p>
        </div>
      )}

      {tab === 'builder' && (
        <div className="max-w-2xl space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Teste de Perfil — Versão 2026.1</p>
              <p className="text-xs text-gray-500 mt-0.5">{questions.length} pergunta(s) · 4 classificações</p>
            </div>
            <button className="px-3 py-1.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Configurações</button>
          </div>

          {questions.map((q, qi) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => toggleExpand(q.id)}>
                <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">{qi + 1}</span>
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">{q.text || 'Pergunta sem texto'}</span>
                <button onClick={e => { e.stopPropagation(); deleteQuestion(q.id); }}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
                {q.expanded ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
              </div>

              {q.expanded && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Texto da pergunta</label>
                    <input
                      type="text"
                      value={q.text}
                      onChange={e => updateQuestionText(q.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-500">Alternativas</label>
                    {q.alternatives.map((alt, ai) => (
                      <div key={alt.id} className="flex items-center gap-2">
                        <span className="w-5 text-xs text-gray-400 text-right flex-shrink-0">{String.fromCharCode(65 + ai)}.</span>
                        <input
                          type="text"
                          value={alt.text}
                          onChange={e => updateAlternativeText(q.id, alt.id, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-gray-400">Peso:</span>
                          <input
                            type="number"
                            value={alt.weight}
                            min={1} max={5}
                            onChange={e => updateAlternativeWeight(q.id, alt.id, Number(e.target.value))}
                            className="w-12 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button onClick={() => deleteAlternative(q.id, alt.id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addAlternative(q.id)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Plus size={12} /> Adicionar alternativa
                  </button>
                </div>
              )}
            </div>
          ))}

          <button onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <Plus size={16} />
            Adicionar pergunta
          </button>
        </div>
      )}

      {tab === 'results' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Aluno', 'Classificação', 'Pontuação', 'Data'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RESULTS.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.student}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${TYPE_COLORS[r.type] || ''}`}>{r.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.score} pts</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
