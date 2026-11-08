const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Testes de logica do HTML. Nao substituem verificacao visual em navegador.
const html = fs.readFileSync(path.join(__dirname,
  '../../Frontend2.0/proxima_etapa_prototipo_final.html'), 'utf8');

function demo() {
  const elements = new Map();
  const listeners = new Map();
  const timers = new Map();
  let nextTimer = 0;
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', value: '', scrollTop: 0,
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(type, callback) { listeners.set(id + ':' + type, callback); }
    });
    return elements.get(id);
  };
  const context = vm.createContext({
    document: { getElementById: element, documentElement: {},
      addEventListener(type, callback) { listeners.set(type, callback); } },
    getComputedStyle: () => ({ getPropertyValue: () => 'url(logo.png)' }),
    structuredClone, queueMicrotask: callback => callback(),
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch() { throw new Error('O prototipo nao pode acessar a API'); }
  });
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    vm.runInContext(script[1], context, { timeout: 1000 });
  }
  return {
    run: code => vm.runInContext(code, context, { timeout: 1000 }),
    element,
    click(dataset) {
      const button = { dataset, closest: () => null };
      listeners.get('click')({ target: { closest: () => button } });
    },
    flush() {
      const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn());
    }
  };
}

test('HTML renderiza 16 telas e todos os estados sem rotas quebradas', () => {
  const d = demo();
  const routes = JSON.parse(d.run('JSON.stringify(screens.map(row=>row[0]))'));
  assert.equal(routes.length, 16);
  for (const route of routes) {
    d.run(`go(${JSON.stringify(route)})`);
    for (const state of ['normal', 'loading', 'empty', 'error', 'success', 'offline', 'pending', 'expired']) {
      d.run(`s.devState=${JSON.stringify(state)};render()`);
      const content = d.element('mainView').innerHTML;
      assert.ok(content.length > 30, `${route}/${state}`);
      assert.doesNotMatch(content, /undefined|\[object Object\]/);
      for (const link of content.matchAll(/data-go="([^"]+)"/g)) {
        assert.ok(routes.includes(link[1]), `${route} -> ${link[1]}`);
      }
    }
    assert.ok(d.element('androidCapability').textContent);
  }
  assert.match(html, /Protótipo · dados fictícios · sem conexão com a API/);
});

test('comunicados e notificacoes mantem leituras independentes', () => {
  const d = demo();
  d.run("go('messages')");
  const unread = d.run('s.notifications.filter(n=>n.unread).length');
  d.click({ message: '1' });
  assert.equal(d.run('s.readMessages.join()'), '1');
  assert.equal(d.run('s.notifications.filter(n=>n.unread).length'), unread);
  d.click({ message: '1' });
  assert.equal(d.run('s.readMessages.length'), 1);
  assert.match(d.element('mainView').innerHTML, /Leitura marcada nesta demonstração/);
});

test('agenda marca somente encontros das inscricoes atuais', () => {
  const d = demo();
  assert.match(d.run('calendarMarkup()'), /has-event/);
  d.run("s.enrolled=[];go('agenda')");
  assert.doesNotMatch(d.run('calendarMarkup()'), /has-event/);
  assert.match(d.element('mainView').innerHTML, /Sem atividades neste dia/);
});

test('reset, saida e voltar cancelam check-in e respostas tardias simuladas', () => {
  for (const action of ["resetState('splash')", "resetState('login')", "go('history')", 'back()']) {
    const d = demo();
    d.run("go('checkin');checkinFinish()");
    d.run(action);
    d.flush();
    assert.equal(d.run('s.attendance.length'), 3, action);
    assert.equal(d.run("s.checkin==='success'"), false, action);
  }
  const d = demo();
  d.run("s.chat.push({mine:true,text:'privado',time:'10:00'});s.readMessages=[1];s.logged=true");
  d.click({ modalAction: 'logout' });
  assert.equal(d.run('s.screen'), 'login');
  assert.equal(d.run('s.readMessages.length'), 0);
  assert.equal(d.run("s.chat.some(m=>m.text==='privado')"), false);
  assert.equal(d.run('s.logged'), false);
});

test('check-in demonstrativo e idempotente e estado pendente nao confirma presenca', () => {
  const d = demo();
  d.run("go('checkin');checkinFinish()");
  d.flush();
  assert.equal(d.run('s.attendance.length'), 4);
  d.run("s.checkin='idle';checkinFinish()"); d.flush();
  assert.equal(d.run('s.attendance.length'), 4);
  d.run("s.devState='pending';render()");
  assert.match(d.element('mainView').innerHTML, /Confirmação pendente/);
  assert.doesNotMatch(d.element('mainView').innerHTML, /Presença registrada!/);
});
