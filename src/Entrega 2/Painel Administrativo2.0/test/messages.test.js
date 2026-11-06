import { test } from 'node:test';
import assert from 'node:assert/strict';
import { messagePayload, validateMessages } from '../src/utils/messages.js';

test('composicao envia apenas campos contratados para cada publico', () => {
    const form = { titulo: ' Assunto ', corpo: ' Texto ', publico_alvo: 'todos', curso_id: 'antigo', aluno_ids: ['a1'], autor_id: 'forjado' };
    assert.deepEqual(messagePayload(form), { titulo:'Assunto', corpo:'Texto', publico_alvo:'todos' });
    assert.equal(messagePayload({ ...form, publico_alvo:'curso', curso_id:'c1' }).curso_id,'c1');
    assert.deepEqual(messagePayload({ ...form, publico_alvo:'individual' }).aluno_ids,['a1']);
    assert.throws(() => messagePayload({ ...form, publico_alvo:'individual', aluno_ids:[] }));
    assert.throws(() => messagePayload({ ...form, titulo:' ' }));
});

test('publicacoes e contagens precisam vir de respostas validas da API', () => {
    const draft = { id:'m1', titulo:'Aviso', corpo:'Conteudo', publico_alvo:'todos',
        enviado_em:null, total_destinatarios:0, total_lidos:0, aluno_ids:[] };
    assert.equal(validateMessages([draft])[0].enviado_em,null);
    assert.deepEqual(validateMessages([]),[]);
    for(const records of [null,[draft,draft],[{...draft,total_lidos:1}],[{...draft,publico_alvo:'inventado'}]]) {
        assert.throws(() => validateMessages(records));
    }
});
