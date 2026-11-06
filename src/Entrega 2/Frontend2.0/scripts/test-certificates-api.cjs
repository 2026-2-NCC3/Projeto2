// RFM09/15: testes reais da API, UI e cache; bancos e usuarios exclusivamente de fixtures.
// Antes: npm ci no Backend2.0; gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest.
// Uso: node scripts/test-certificates-api.cjs emulator-5554
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const { spawnSync, execFile } = require('node:child_process');
const assert = require('node:assert/strict');
const { withApi } = require('../../Backend2.0/test/helpers/api');
const root = path.resolve(__dirname, '..');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
    || (process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
const serial = process.argv[2];
if (!sdk || !serial || !/^[A-Za-z0-9_.:-]+$/.test(serial)) throw new Error('Informe SDK e serial ADB explicito.');
const adb = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
const cleanup = [];
let previousMapping;
let changed = false;
let offlineServer;

function device(args) {
    const result = spawnSync(adb, ['-s', serial, ...args], { encoding: 'utf8', timeout: 120000 });
    if (result.error || result.status !== 0) throw new Error('Falha na operacao ADB de teste.');
    return result.stdout;
}

async function instrument(className, argument) {
    const output = await new Promise((resolve, reject) => {
        execFile(adb, ['-s', serial, 'shell', 'am', 'instrument', '-w', '-r', '-e', argument, 'true',
            '-e', 'class', 'com.example.projetopi.' + className,
            'com.example.projetopi.test/androidx.test.runner.AndroidJUnitRunner'],
        { encoding: 'utf8', timeout: 120000 }, (error, stdout) => error ? reject(error) : resolve(stdout));
    });
    const result = output.match(/OK \((\d+) tests?\)/);
    if (!result || /FAILURES!!!|shortMsg=Process crashed/.test(output)) {
        const details = output.split(/\r?\n/).filter(line =>
            /INSTRUMENTATION_STATUS: (test=|stack=)|AssertionError|Caused by:/.test(line)).join('\n');
        console.error(details.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token omitido]'));
        throw new Error('Testes Android de certificados nao concluiram.');
    }
    console.log(className + ': ' + result[1] + ' teste(s) aprovado(s).');
}

(async () => {
    try {
        const apk = path.join(root, 'app/build/outputs/apk/debug/app-debug.apk');
        const testApk = path.join(root, 'app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk');
        assert.ok(fs.existsSync(apk) && fs.existsSync(testApk), 'Compile o app e os testes.');
        previousMapping = device(['reverse', '--list']).split(/\r?\n/).map(line => line.trim().split(/\s+/))
            .find(parts => parts[1] === 'tcp:3000')?.[2];
        const api = await withApi({ after(callback) { cleanup.push(callback); } });
        api.db.exec("INSERT INTO cursos(id,titulo,data_inicio,vagas_total) VALUES ('c1','Curso ficticio certificado','2026-01-01',10),('c2','Outro curso ficticio','2026-01-01',10);"
            + "INSERT INTO inscricoes(id,aluno_id,curso_id) VALUES ('i1','a1','c1'),('i2','a2','c2');"
            + "INSERT INTO certificados(id,inscricao_id,status,arquivo_url) VALUES ('ce1','i1','pendente','https://private.invalid/NAO-EXPOR.pdf'),('ce2','i2','pendente',NULL);"
            + "INSERT INTO certificado_criterios(id,certificado_id,criterio,atendido) VALUES ('cc1','ce1','frequencia',1),('cc2','ce1','avaliacao',1),('cc3','ce1','carga_horaria',1);"
            + "UPDATE certificados SET status='emitido',emitido_em='2026-11-05T12:00:00Z' WHERE id='ce1';");
        const before = api.db.prepare('SELECT * FROM certificados ORDER BY id').all();
        device(['reverse', 'tcp:3000', 'tcp:' + new URL(api.baseUrl).port]);
        changed = true;
        device(['install', '-r', apk]);
        device(['install', '-r', testApk]);
        await instrument('CertificateApiInstrumentedTest', 'fixture_api');
        offlineServer = net.createServer(socket => socket.destroy());
        await new Promise(resolve => offlineServer.listen(0, '127.0.0.1', resolve));
        device(['reverse', 'tcp:3000', 'tcp:' + offlineServer.address().port]);
        await instrument('CertificatesOfflineInstrumentedTest', 'offline_test');
        assert.deepEqual(api.db.prepare('SELECT * FROM certificados ORDER BY id').all(), before);
        assert.deepEqual(api.db.pragma('foreign_key_check'), []);
        assert.equal((await api.request('/api/certificados', 'op')).body.length, 2);
        console.log('Banco temporario inalterado; FKs integras; consulta administrativa compativel.');
    } finally {
        try {
            if (changed) {
                if (previousMapping) device(['reverse', 'tcp:3000', previousMapping]);
                else device(['reverse', '--remove', 'tcp:3000']);
            }
        } finally {
            if (offlineServer) await new Promise(resolve => offlineServer.close(resolve));
            for (const callback of cleanup.reverse()) await callback();
        }
    }
})().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
