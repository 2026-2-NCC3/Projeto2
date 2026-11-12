// RFM01/03/05/06/07/15: emulador real + API real + bancos exclusivamente temporarios.
// Preparacao: npm ci no Backend2.0; gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest.
// Execucao: node scripts/test-presence-api.cjs emulator-5554
// Nao usa adb clear/uninstall; restaura o encaminhamento anterior mesmo se o teste falhar.
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs');
const { execFile, spawnSync } = require('node:child_process');
const { promisify } = require('node:util');
const assert = require('node:assert/strict');
const { withApi } = require('../../Backend2.0/test/helpers/api');
const { apk, testApk } = require('./debug-apks.cjs');
const execFileAsync = promisify(execFile);
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
    || (process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
const serial = process.argv[2];
if (!sdk || !serial || !/^[A-Za-z0-9_.:-]+$/.test(serial)) {
    throw new Error('Informe ANDROID_HOME e um serial ADB explicito.');
}
const adb = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
const callbacks = [];
let previousMapping;
let mappingChanged = false;
let offlineServer;
let relay;

function device(args) {
    const result = spawnSync(adb, ['-s', serial, ...args], { encoding: 'utf8', timeout: 120000 });
    if (result.error || result.status !== 0) throw new Error('Falha na operacao ADB de teste.');
    return result.stdout;
}

async function cleanup() {
    try {
        if (mappingChanged) {
            if (previousMapping) device(['reverse', 'tcp:3000', previousMapping]);
            else device(['reverse', '--remove', 'tcp:3000']);
            mappingChanged = false;
        }
    } finally {
        if (offlineServer) await new Promise(resolve => offlineServer.close(resolve));
        if (relay) await new Promise(resolve => relay.close(resolve));
        for (const callback of callbacks.reverse()) await callback();
    }
}

async function instrument(classes, mode) {
    const selection = classes.map(name => 'com.example.projetopi.' + name).join(',');
    const { stdout: output } = await execFileAsync(adb,
        ['-s', serial, 'shell', 'am', 'instrument', '-w', '-r', '-e', mode, 'true',
            '-e', 'drop_checkin_response', 'true', '-e', 'class', selection,
            'com.example.projetopi.test/androidx.test.runner.AndroidJUnitRunner'],
        { encoding: 'utf8', timeout: 120000 });
    // Nao imprime corpos HTTP nem credenciais.
    const result = output.match(/OK \((\d+) tests?\)/);
    if (!result) {
        const details = output.split(/\r?\n/).filter(line =>
            /INSTRUMENTATION_STATUS: (test=|stack=)|AssertionError|Caused by:/.test(line)).join('\n');
        console.error(details.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token omitido]'));
    }
    assert.ok(result && !/FAILURES!!!|shortMsg=Process crashed/.test(output),
        'Testes instrumentados nao concluiram com sucesso (' + mode + ').');
    console.log('Android instrumentado (' + mode + '): ' + result[1] + ' testes aprovados.');
}

(async () => {
    try {
        assert.ok(fs.existsSync(apk) && fs.existsSync(testApk), 'Compile o app e os testes antes de executar.');
        previousMapping = device(['reverse', '--list']).split(/\r?\n/)
            .map(line => line.trim().split(/\s+/)).find(parts => parts[1] === 'tcp:3000')?.[2];
        const api = await withApi({ after(callback) { callbacks.push(callback); } });
        api.db.exec("INSERT INTO cursos (id,titulo,data_inicio,vagas_total) VALUES ('c1','Curso ficticio de integracao','2026-11-05',10);"
            + "INSERT INTO atividades (id,curso_id,titulo,data,hora_inicio,hora_fim) VALUES ('at1','c1','Encontro ficticio de integracao',date('now','+2 days'),'10:00','11:00');"
            + "INSERT INTO inscricoes (id,aluno_id,curso_id) VALUES ('i1','a1','c1');");
        let responseDropped = false;
        let historyRequested = false;
        relay = http.createServer((request, response) => {
            const upstream = http.request(new URL(request.url, api.baseUrl), {
                method: request.method, headers: request.headers
            }, upstreamResponse => {
                if (responseDropped && request.method === 'GET' && request.url === '/api/presencas/minhas') {
                    historyRequested = true;
                }
                if (!historyRequested && request.method === 'POST' &&
                    request.url === '/api/presencas/check-in' &&
                    [200, 201].includes(upstreamResponse.statusCode)) {
                    responseDropped ||= upstreamResponse.statusCode === 201;
                    // HttpURLConnection pode reabrir o socket e reenviar o POST.
                    upstreamResponse.resume();
                    response.destroy();
                    return;
                }
                response.writeHead(upstreamResponse.statusCode, upstreamResponse.headers);
                upstreamResponse.pipe(response);
            });
            upstream.on('error', () => response.destroy());
            request.pipe(upstream);
        });
        await new Promise(resolve => relay.listen(0, '127.0.0.1', resolve));
        device(['reverse', 'tcp:3000', 'tcp:' + relay.address().port]);
        mappingChanged = true;
        device(['install', '-r', apk]);
        device(['install', '-r', testApk]);
        const onlineClasses = ['LocalStudentStoreInstrumentedTest', 'PresenceSynchronizerInstrumentedTest',
            'LocalPresenceApiInstrumentedTest#loginCoursesAgendaQrSqliteRecoveryAndHistoryUseRealApi',
            'LocalPresenceApiInstrumentedTest#dashboardSessionAndAgendaSelectionSurviveRealNavigation'];
        await instrument(onlineClasses, 'fixture_api');
        assert.ok(responseDropped, 'O relay não interrompeu a resposta real do check-in.');

        offlineServer = net.createServer(socket => socket.destroy());
        await new Promise(resolve => offlineServer.listen(0, '127.0.0.1', resolve));
        device(['reverse', 'tcp:3000', 'tcp:' + offlineServer.address().port]);
        await instrument(['LocalPresenceApiInstrumentedTest#agendaDisplaysSavedRecordsWhenConnectionFails'],
            'offline_test');
        assert.equal(api.db.prepare('SELECT COUNT(*) AS n FROM presencas').get().n, 1);
        assert.equal(api.db.prepare('SELECT COUNT(*) AS n FROM inscricoes').get().n, 1);
        assert.deepEqual(api.db.pragma('foreign_key_check'), []);
        const history = await api.request('/api/presencas/alunos/a1', 'op');
        assert.equal(history.status, 200);
        assert.equal(history.body.length, 1);
        console.log('API/painel: resposta do check-in interrompida após HTTP 201; uma presença, histórico consistente e FKs íntegras.');
    } finally {
        await cleanup();
    }
})().catch(error => {
    console.error('Falha na verificacao isolada de persistencia/presenca:', error.message);
    process.exitCode = 1;
});
