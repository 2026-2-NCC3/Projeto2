import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replaceOrPrependRecord } from '../src/utils/records.js';

test('criacao insere no inicio sem alterar a lista original ou deduplicar implicitamente', () => {
    const existingRecord = { id: 'a1', name: 'Anterior' };
    const savedRecord = { id: 'a1', name: 'Novo' };
    const records = Object.freeze([existingRecord]);
    assert.deepEqual(replaceOrPrependRecord(records, savedRecord, false), [savedRecord, existingRecord]);
    assert.deepEqual(records, [existingRecord]);
});

test('edicao substitui o registro e preserva ordem e referencias dos demais', () => {
    const firstRecord = { id: 'a1', name: 'Primeiro' };
    const editedRecord = { id: 'a2', name: 'Anterior' };
    const savedRecord = { id: 'a2', name: null };
    const records = Object.freeze([firstRecord, editedRecord]);
    const updatedRecords = replaceOrPrependRecord(records, savedRecord, true);
    assert.deepEqual(updatedRecords, [firstRecord, savedRecord]);
    assert.equal(updatedRecords[0], firstRecord);
    assert.equal(records[1], editedRecord);
});

test('edicao com ID ausente nao insere um novo registro', () => {
    const records = [{ id: 'a1' }];
    assert.deepEqual(replaceOrPrependRecord(records, { id: 'a2' }, true), records);
    assert.deepEqual(replaceOrPrependRecord([], { id: 'a2' }, true), []);
});

test('comparacao de IDs continua estrita e substitui todas as correspondencias existentes', () => {
    const savedRecord = { id: 1, updated: true };
    const stringIdRecord = { id: '1' };
    const updatedRecords = replaceOrPrependRecord([{ id: 1 }, stringIdRecord, { id: 1 }], savedRecord, true);
    assert.deepEqual(updatedRecords, [savedRecord, stringIdRecord, savedRecord]);
});
