import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {csvText} from '../src/utils/exportCsv.js';

const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'../src');
test('dashboard, relatórios e navbar não contêm os conjuntos fictícios antigos',()=>{
  for(const file of ['pages/Dashboard.jsx','pages/Reports.jsx','components/Navbar.jsx','pages/Tests.jsx']){
    const source=fs.readFileSync(path.join(dir,file),'utf8');
    for(const mock of ['Maria Souza','Python Básico','enrollmentTrend = [','NOTIFICATIONS = [','INITIAL_QUESTIONS = [','RESULTS = [','impactData = [']){
      assert.ok(!source.includes(mock),`${file} ainda contém ${mock}`);
    }
  }
});
test('CSV exportado codifica aspas, separadores e fórmulas',()=>{
  const out=csvText(['curso','alunos'],[['=HYPERLINK("abc")',2],['Teste;Composto',3]]);
  assert.match(out,/\uFEFF/);
  assert.match(out,/"'=HYPERLINK\(""abc""\)"/);
  assert.match(out,/"Teste;Composto"/);
});
