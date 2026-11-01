import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { loadSiteConfiguration } from '../config/site-config.js';
import { figmaSiteConfiguration } from '../vite.config.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function fixture(t) {
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'proxima-panel-config-'));
    t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
    fs.copyFileSync(path.join(root,'site.config.json'),path.join(dir,'site.config.json'));
    return dir;
}
test('checkout sem .figma usa metadados reais versionados, idioma e robots',t=>{
    const dir=fixture(t), config=loadSiteConfiguration(dir);
    assert.match(config.title,/Próxima Etapa/);assert.equal(config.language,'pt-BR');assert.equal(config.robots.index,false);
    const plugin=figmaSiteConfiguration(config);
    const result=plugin.transformIndexHtml.handler(fs.readFileSync(path.join(root,'index.html'),'utf8'));
    assert.match(result.html,/<html lang="pt-BR">/);assert.doesNotMatch(result.html,/figma:/);
    const assets=[];plugin.generateBundle.call({emitFile:asset=>assets.push(asset)});
    assert.equal(assets[0].fileName,'robots.txt');assert.match(assets[0].source,/Disallow: \//);
});
test('override Figma preserva metadados, scripts, icones, analytics e acessibilidade',t=>{
    const dir=fixture(t);fs.mkdirSync(path.join(dir,'.figma/make'),{recursive:true});
    fs.writeFileSync(path.join(dir,'.figma/make/site.json'),JSON.stringify({title:'Preview & ONG',icons:{icon:'/custom.ico'},openGraph:{image:'/social.png'},analytics:{googleAnalyticsId:'G-TEST'},customScripts:{headStart:'<script data-test="preview"></script>'}}));
    const config=loadSiteConfiguration(dir), result=figmaSiteConfiguration(config).transformIndexHtml.handler(fs.readFileSync(path.join(root,'index.html'),'utf8'));
    assert.equal(config.language,'pt-BR');assert.match(result.html,/Preview &amp; ONG/);assert.match(result.html,/data-test="preview"/);
    assert.ok(result.tags.some(t=>t.attrs?.href==='/custom.ico'));assert.ok(result.tags.some(t=>t.attrs?.content==='/social.png'));
    assert.ok(result.tags.some(t=>t.attrs?.src?.includes('G-TEST')));assert.ok(result.tags.some(t=>t.attrs?.class==='figma-bypass-link'));
});
test('override presente e malformado interrompe o build em vez de ocultar configuracao invalida',t=>{
    const dir=fixture(t);fs.mkdirSync(path.join(dir,'.figma/make'),{recursive:true});fs.writeFileSync(path.join(dir,'.figma/make/site.json'),'{invalid');
    assert.throws(()=>loadSiteConfiguration(dir),SyntaxError);
});
async function verifyBuild(t,base,apiUrl) {
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'proxima-panel-build-'));
    t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
    const priorBase=process.env.FIGMA_PUBLIC_URL, priorApi=process.env.VITE_API_URL;
    try {
        if(base==='/') delete process.env.FIGMA_PUBLIC_URL;else process.env.FIGMA_PUBLIC_URL=base;
        if(apiUrl) process.env.VITE_API_URL=apiUrl;else delete process.env.VITE_API_URL;
        await build({root,configFile:path.join(root,'vite.config.js'),logLevel:'error',build:{outDir:dir,emptyOutDir:true}});
        const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
        assert.match(html,/Próxima Etapa/);assert.match(html,/lang="pt-BR"/);assert.doesNotMatch(html,/figma:/);assert.match(html,/noindex/);
        const refs=[...html.matchAll(/(?:src|href)="([^"]*assets[^"]*)"/g)].map(m=>m[1]);
        assert.ok(refs.some(url=>url.endsWith('.js')));assert.ok(refs.some(url=>url.endsWith('.css')));
        for(const url of refs) {assert.ok(url.startsWith(base));assert.ok(fs.existsSync(path.join(dir,url.slice(base.length))));}
        const js=fs.readdirSync(path.join(dir,'assets')).filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync(path.join(dir,'assets',f),'utf8')).join('');
        assert.ok(js.includes(apiUrl||'http://localhost:3000'));
        if(apiUrl) assert.ok(!js.includes('http://localhost:3000'));
        assert.equal(fs.readFileSync(path.join(dir,'robots.txt'),'utf8'),'User-agent: *\nDisallow: /\n');
        const server=await preview({root,configFile:path.join(root,'vite.config.js'),logLevel:'error',build:{outDir:dir},preview:{host:'127.0.0.1',port:0,strictPort:false}});
        try {
            const address='http://127.0.0.1:'+server.httpServer.address().port;
            assert.equal((await fetch(address+base)).status,200);
            for(const url of refs) assert.equal((await fetch(address+url)).status,200);
        } finally {await new Promise(resolve=>server.httpServer.close(resolve));}
    } finally {
        if(priorBase===undefined)delete process.env.FIGMA_PUBLIC_URL;else process.env.FIGMA_PUBLIC_URL=priorBase;
        if(priorApi===undefined)delete process.env.VITE_API_URL;else process.env.VITE_API_URL=priorApi;
    }
}
test('build e preview servem JS/CSS na raiz e mantem API local padrao',t=>verifyBuild(t,'/'));
test('build em subdiretorio preserva VITE_API_URL e serve recursos no base correto',t=>verifyBuild(t,'/painel/','https://api.example.invalid/backend'));
