export const AUDIENCES = { todos: 'Todos os alunos elegíveis', curso: 'Alunos de um curso', individual: 'Alunos selecionados' };

export function messagePayload(form) {
    const titulo = form.titulo.trim();
    const corpo = form.corpo.trim();
    if (!titulo || titulo.length > 160 || !corpo || corpo.length > 10000 || !Object.hasOwn(AUDIENCES, form.publico_alvo)) {
        throw new Error('Preencha assunto, conteúdo e público válidos.');
    }
    const result = { titulo, corpo, publico_alvo: form.publico_alvo };
    if (form.publico_alvo === 'curso') {
        if (!form.curso_id) throw new Error('Selecione um curso.');
        result.curso_id = form.curso_id;
    }
    if (form.publico_alvo === 'individual') {
        if (!form.aluno_ids.length || form.aluno_ids.length > 500) throw new Error('Selecione entre 1 e 500 alunos.');
        result.aluno_ids = [...new Set(form.aluno_ids)];
    }
    return result;
}

export function validateMessages(records) {
    if (!Array.isArray(records)) throw new Error('Resposta inválida.');
    const ids = new Set();
    for (const record of records) {
        if (!record || typeof record.id !== 'string' || !record.id || ids.has(record.id)
            || typeof record.titulo !== 'string' || typeof record.corpo !== 'string'
            || !Object.hasOwn(AUDIENCES, record.publico_alvo)
            || !(record.enviado_em === null || typeof record.enviado_em === 'string')
            || !Number.isSafeInteger(record.total_destinatarios) || record.total_destinatarios < 0
            || !Number.isSafeInteger(record.total_lidos) || record.total_lidos < 0
            || record.total_lidos > record.total_destinatarios || !Array.isArray(record.aluno_ids)) {
            throw new Error('Resposta inválida.');
        }
        ids.add(record.id);
    }
    return records;
}
