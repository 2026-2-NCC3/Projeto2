export const CERTIFICATE_STATUSES = {
    emitido: { label: 'Emitido', badge: 'bg-green-50 text-green-700 border-green-200' },
    pronto: { label: 'Pronto para emissão', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    pendente: { label: 'Pendente', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    revogado: { label: 'Revogado', badge: 'bg-red-50 text-red-700 border-red-200' },
};
export const CRITERIA_LABELS = { frequencia: 'Frequência', avaliacao: 'Avaliação', carga_horaria: 'Carga horária' };

export function validateCertificates(records) {
    if (!Array.isArray(records)) throw new Error('Resposta de certificados inválida.');
    const ids = new Set();
    for (const record of records) {
        if (!record || typeof record.id !== 'string' || !record.id || ids.has(record.id)
            || typeof record.titulo !== 'string' || typeof record.aluno_nome !== 'string'
            || !Object.hasOwn(CERTIFICATE_STATUSES, record.status) || !Array.isArray(record.criterios)
            || record.arquivo_disponivel !== false) {
            throw new Error('Resposta de certificados inválida.');
        }
        ids.add(record.id);
        for (const criterion of record.criterios) {
            if (!Object.hasOwn(CRITERIA_LABELS, criterion.criterio) || ![0, 1].includes(criterion.atendido)) {
                throw new Error('Critério de certificado inválido.');
            }
        }
    }
    return records;
}

export function filterCertificates(records, search, status) {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return records.filter(record =>
        (status === 'todos' || record.status === status)
        && [record.aluno_nome, record.titulo].some(text => text.toLocaleLowerCase('pt-BR').includes(term)));
}
