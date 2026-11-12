import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { loadSiteConfiguration } from '../config/site-config.js';
import { figmaSiteConfiguration } from '../vite.config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function createConfigurationFixture(testContext) {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'proxima-panel-config-'));
    testContext.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));
    fs.copyFileSync(
        path.join(root, 'site.config.json'),
        path.join(temporaryDirectory, 'site.config.json')
    );
    return temporaryDirectory;
}

function writeFigmaOverride(temporaryDirectory, contents) {
    fs.mkdirSync(path.join(temporaryDirectory, '.figma/make'), { recursive: true });
    fs.writeFileSync(path.join(temporaryDirectory, '.figma/make/site.json'), contents);
}

function documentTemplate() {
    return fs.readFileSync(path.join(root, 'index.html'), 'utf8');
}

test('checkout sem .figma usa metadados reais versionados, idioma e robots', testContext => {
    const temporaryDirectory = createConfigurationFixture(testContext);
    const configuration = loadSiteConfiguration(temporaryDirectory);
    assert.match(configuration.title, /Próxima Etapa/);
    assert.equal(configuration.language, 'pt-BR');
    assert.equal(configuration.robots.index, false);

    const plugin = figmaSiteConfiguration(configuration);
    const transformedDocument = plugin.transformIndexHtml.handler(documentTemplate());
    assert.match(transformedDocument.html, /<html lang="pt-BR">/);
    assert.doesNotMatch(transformedDocument.html, /figma:/);

    const emittedAssets = [];
    plugin.generateBundle.call({ emitFile: asset => emittedAssets.push(asset) });
    assert.equal(emittedAssets[0].fileName, 'robots.txt');
    assert.match(emittedAssets[0].source, /Disallow: \//);
});

test('override Figma preserva metadados, scripts, icones, analytics e acessibilidade', testContext => {
    const temporaryDirectory = createConfigurationFixture(testContext);
    writeFigmaOverride(temporaryDirectory, JSON.stringify({
        title: 'Preview & ONG',
        icons: { icon: '/custom.ico' },
        openGraph: { image: '/social.png' },
        analytics: { googleAnalyticsId: 'G-TEST' },
        customScripts: { headStart: '<script data-test="preview"></script>' }
    }));

    const configuration = loadSiteConfiguration(temporaryDirectory);
    const transformedDocument = figmaSiteConfiguration(configuration)
        .transformIndexHtml.handler(documentTemplate());
    assert.equal(configuration.language, 'pt-BR');
    assert.match(transformedDocument.html, /Preview &amp; ONG/);
    assert.match(transformedDocument.html, /data-test="preview"/);
    assert.ok(transformedDocument.tags.some(tag => tag.attrs?.href === '/custom.ico'));
    assert.ok(transformedDocument.tags.some(tag => tag.attrs?.content === '/social.png'));
    assert.ok(transformedDocument.tags.some(tag => tag.attrs?.src?.includes('G-TEST')));
    assert.ok(transformedDocument.tags.some(tag => tag.attrs?.class === 'figma-bypass-link'));
});

test('override presente e malformado interrompe o build em vez de ocultar configuracao invalida', testContext => {
    const temporaryDirectory = createConfigurationFixture(testContext);
    writeFigmaOverride(temporaryDirectory, '{invalid');
    assert.throws(() => loadSiteConfiguration(temporaryDirectory), SyntaxError);
});

function assertStaticAssets(outputDirectory, publicBase, documentHtml) {
    const staticAssetUrls = [...documentHtml.matchAll(/(?:src|href)="([^"]*assets[^"]*)"/g)]
        .map(assetMatch => assetMatch[1]);
    assert.ok(staticAssetUrls.some(assetUrl => assetUrl.endsWith('.js')));
    assert.ok(staticAssetUrls.some(assetUrl => assetUrl.endsWith('.css')));
    for (const assetUrl of staticAssetUrls) {
        assert.ok(assetUrl.startsWith(publicBase));
        assert.ok(fs.existsSync(path.join(outputDirectory, assetUrl.slice(publicBase.length))));
    }
    return staticAssetUrls;
}

async function assertPreview(outputDirectory, publicBase, staticAssetUrls) {
    const server = await preview({
        root,
        configFile: path.join(root, 'vite.config.js'),
        logLevel: 'error',
        build: { outDir: outputDirectory },
        preview: { host: '127.0.0.1', port: 0, strictPort: false }
    });
    try {
        const serverAddress = 'http://127.0.0.1:' + server.httpServer.address().port;
        assert.equal((await fetch(serverAddress + publicBase)).status, 200);
        for (const assetUrl of staticAssetUrls) {
            assert.equal((await fetch(serverAddress + assetUrl)).status, 200);
        }
    } finally {
        await new Promise(resolve => server.httpServer.close(resolve));
    }
}

function restoreEnvironmentVariable(name, previousValue) {
    if (previousValue === undefined) {
        delete process.env[name];
    } else {
        process.env[name] = previousValue;
    }
}

async function verifyBuild(testContext, publicBase, apiUrl) {
    const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'proxima-panel-build-'));
    testContext.after(() => fs.rmSync(outputDirectory, { recursive: true, force: true }));
    const previousPublicBase = process.env.FIGMA_PUBLIC_URL;
    const previousApiUrl = process.env.VITE_API_URL;

    try {
        if (publicBase === '/') {
            delete process.env.FIGMA_PUBLIC_URL;
        } else {
            process.env.FIGMA_PUBLIC_URL = publicBase;
        }
        if (apiUrl) {
            process.env.VITE_API_URL = apiUrl;
        } else {
            delete process.env.VITE_API_URL;
        }

        await build({
            root,
            configFile: path.join(root, 'vite.config.js'),
            logLevel: 'error',
            build: { outDir: outputDirectory, emptyOutDir: true }
        });
        const documentHtml = fs.readFileSync(path.join(outputDirectory, 'index.html'), 'utf8');
        assert.match(documentHtml, /Próxima Etapa/);
        assert.match(documentHtml, /lang="pt-BR"/);
        assert.doesNotMatch(documentHtml, /figma:/);
        assert.match(documentHtml, /noindex/);
        const staticAssetUrls = assertStaticAssets(outputDirectory, publicBase, documentHtml);

        const javascriptBundle = fs.readdirSync(path.join(outputDirectory, 'assets'))
            .filter(filename => filename.endsWith('.js'))
            .map(filename => fs.readFileSync(path.join(outputDirectory, 'assets', filename), 'utf8'))
            .join('');
        assert.ok(javascriptBundle.includes(apiUrl || 'https://projeto2-krn7.onrender.com'));
        if (apiUrl !== 'http://localhost:3000') {
            assert.ok(!javascriptBundle.includes('http://localhost:3000'));
        }
        assert.equal(
            fs.readFileSync(path.join(outputDirectory, 'robots.txt'), 'utf8'),
            'User-agent: *\nDisallow: /\n'
        );
        await assertPreview(outputDirectory, publicBase, staticAssetUrls);
    } finally {
        restoreEnvironmentVariable('FIGMA_PUBLIC_URL', previousPublicBase);
        restoreEnvironmentVariable('VITE_API_URL', previousApiUrl);
    }
}

test('build e preview servem JS/CSS na raiz e usam Render por padrao', testContext =>
    verifyBuild(testContext, '/'));
test('build em subdiretorio preserva VITE_API_URL e serve recursos no base correto', testContext =>
    verifyBuild(testContext, '/painel/', 'https://api.example.invalid/backend'));

test('build preserva endpoint local explicitamente configurado', testContext =>
    verifyBuild(testContext, '/', 'http://localhost:3000'));
