// Mantem a politica das tres telas: edicao substitui IDs existentes;
// criacao insere no inicio, sem deduplicacao ou mudanca na ordem restante.
export function replaceOrPrependRecord(records, savedRecord, isEditing) {
    if (!isEditing) {
        return [savedRecord, ...records];
    }
    return records.map((currentRecord) => {
        if (currentRecord.id === savedRecord.id) {
            return savedRecord;
        }
        return currentRecord;
    });
}
