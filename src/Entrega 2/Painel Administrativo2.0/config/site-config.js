import fs from 'node:fs';
import path from 'node:path';

function readObject(filename) {
    const config = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        throw new Error('A configuração pública do site deve ser um objeto JSON.');
    }
    return config;
}

// Metadados reais do produto são versionados. O arquivo gerenciado pelo Figma
// apenas os sobrescreve quando presente; nunca é requisito de um checkout limpo.
export function loadSiteConfiguration(root) {
    const defaults = readObject(path.join(root, 'site.config.json'));
    const overridePath = path.join(root, '.figma/make/site.json');
    let override;
    try {
        override = readObject(overridePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return defaults;
        }
        throw error; // Configuração presente mas inválida não é ignorada.
    }
    const result = { ...defaults, ...override };
    const configurableSections = [
        'icons',
        'openGraph',
        'analytics',
        'customScripts',
        'robots',
        'accessibility'
    ];
    for (const section of configurableSections) {
        if (defaults[section] || override[section]) {
            result[section] = { ...defaults[section], ...override[section] };
        }
    }
    return result;
}
