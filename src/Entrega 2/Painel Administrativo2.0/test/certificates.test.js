import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCertificates, filterCertificates } from '../src/utils/certificates.js';

const certificate = {
    id: 'ce1', titulo: 'Curso fictício', aluno_nome: 'Aluno fictício', status: 'emitido',
    emitido_em: '2026-11-05T12:00:00Z', criterios: [{ criterio: 'frequencia', atendido: 1 }],
    arquivo_disponivel: false,
};

test('certificados aceitam lista vazia e metadados dos estados existentes', () => {
    assert.deepEqual(validateCertificates([]), []);
    for (const status of ['pendente', 'pronto', 'emitido', 'revogado']) {
        assert.equal(validateCertificates([{ ...certificate, status }])[0].status, status);
    }
});

test('respostas incompletas e estados nao contratados nao parecem certificados reais', () => {
    for (const records of [null, {}, [{ ...certificate, status: 'aprovado' }],
        [{ ...certificate, arquivo_disponivel: true }], [certificate, certificate],
        [{ ...certificate, criterios: [{ criterio: 'percentual_inventado', atendido: 1 }] }]]) {
        assert.throws(() => validateCertificates(records));
    }
});

test('busca e filtro operam sobre metadados sem alterar registros ou emitir certificados', () => {
    const records = [certificate, { ...certificate, id: 'ce2', status: 'pendente', titulo: 'Outro curso' }];
    assert.deepEqual(filterCertificates(records, '  ALUNO  ', 'emitido'), [certificate]);
    assert.deepEqual(filterCertificates(records, 'inexistente', 'todos'), []);
    assert.equal(records[1].status, 'pendente');
});
