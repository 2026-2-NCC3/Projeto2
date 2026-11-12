import { test } from "node:test"
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import QRCode from "qrcode"
import jsQR from "jsqr"
import {
  fazerLogin,
  salvarSessao,
  limparSessao,
  listarAtividades,
  emitirQrPresenca,
  listarPresencasDoAluno,
  listarPerfis,
} from "../src/services/api.js"
import { criarJanelaQr } from "../src/utils/checkin.js"

const require = createRequire(import.meta.url)
const { withApi } = require("../../Backend2.0/test/helpers/api.js")

function storageFicticio() {
  const valores = new Map()
  return {
    getItem: (chave) => valores.get(chave) ?? null,
    setItem: (chave, valor) => valores.set(chave, valor),
    removeItem: (chave) => valores.delete(chave),
  }
}

function escanear(token) {
  const matriz = QRCode.create(token, { errorCorrectionLevel: "M" }).modules
  const escala = 5
  const largura = (matriz.size + 8) * escala
  const pixels = new Uint8ClampedArray(largura * largura * 4).fill(255)
  for (let y = 0; y < matriz.size; y++) {
    for (let x = 0; x < matriz.size; x++) {
      if (!matriz.get(y, x)) continue
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const indice =
            (((y + 4) * escala + dy) * largura + (x + 4) * escala + dx) * 4
          pixels[indice] = pixels[indice + 1] = pixels[indice + 2] = 0
        }
      }
    }
  }
  return jsQR(pixels, largura, largura)?.data
}

test("painel → QR decodificado → check-in autenticado → histórico real em banco temporário", async (contexto) => {
  const api = await withApi(contexto)
  api.db.exec(`
        INSERT INTO cursos (id,titulo,data_inicio,vagas_total) VALUES ('c1','Curso fictício','2030-01-01',10);
        INSERT INTO atividades (id,curso_id,titulo,data,hora_inicio,hora_fim)
            VALUES ('at1','c1','Atividade fictícia','2030-01-01','10:00','11:00');
        INSERT INTO inscricoes (id,aluno_id,curso_id) VALUES ('i1','a1','c1');
    `)
  const fetchOriginal = globalThis.fetch
  const globais = ["localStorage", "sessionStorage", "window"].map((nome) => [
    nome,
    Object.getOwnPropertyDescriptor(globalThis, nome),
  ])
  globalThis.localStorage = storageFicticio()
  globalThis.sessionStorage = storageFicticio()
  globalThis.window = new EventTarget()
  const eventos = []
  window.addEventListener("proxima-etapa:sessao-expirada", () =>
    eventos.push("expirada"),
  )
  contexto.after(() => {
    globalThis.fetch = fetchOriginal
    for (const [nome, descritor] of globais) {
      if (descritor) Object.defineProperty(globalThis, nome, descritor)
      else delete globalThis[nome]
    }
  })
  globalThis.fetch = (url, opcoes) => {
    const destino = new URL(url)
    if (destino.origin === api.baseUrl) return fetchOriginal(url, opcoes)
    assert.equal(destino.origin, "https://projeto2-krn7.onrender.com")
    return fetchOriginal(api.baseUrl + destino.pathname + destino.search, opcoes)
  }

  const login = await fazerLogin("op@example.invalid", "Ficticio-teste-123!")
  salvarSessao(login.token, login.usuario, false)
  assert.equal((await listarAtividades())[0].id, "at1")
  assert.ok((await listarPerfis()).some((aluno) => aluno.id === "a1"))
  const agora = new Date()
  const inicio = new Date(agora.getTime() - 60000).toISOString().slice(0, 16)
  const fim = new Date(agora.getTime() + 600000).toISOString().slice(0, 16)
  const janela = criarJanelaQr("at1", inicio, fim, "UTC")
  const emissao = await emitirQrPresenca(janela)
  assert.ok(typeof emissao.qr_token === "string")
  const tokenLido = escanear(emissao.qr_token)
  assert.ok(tokenLido === emissao.qr_token)
  assert.equal(localStorage.getItem("qr_token"), null)
  assert.equal(sessionStorage.getItem("qr_token"), null)

  const registro = await api.request("/api/presencas/check-in", "a1", "POST", {
    qr_token: tokenLido,
  })
  assert.equal(registro.status, 201)
  assert.equal(
    (
      await api.request("/api/presencas/check-in", "a1", "POST", {
        qr_token: tokenLido,
      })
    ).status,
    200,
  )
  const historicoAluno = await api.request("/api/presencas/minhas", "a1")
  const historicoAdmin = await listarPresencasDoAluno("a1")
  assert.equal(historicoAdmin.length, 1)
  assert.equal(historicoAdmin[0].id, historicoAluno.body[0].id)
  assert.equal(historicoAdmin[0].atividade_id, "at1")
  assert.deepEqual(await listarPresencasDoAluno("a2"), [])
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM presencas").get().n, 1)
  assert.deepEqual(api.db.pragma("foreign_key_check"), [])

  salvarSessao(api.token("a1"), { id: "a1", papel: "aluno" }, false)
  await assert.rejects(emitirQrPresenca(janela), (erro) => erro.status === 403)
  await assert.rejects(
    listarPresencasDoAluno("a2"),
    (erro) => erro.status === 403,
  )
  assert.deepEqual(await listarPresencasDoAluno("a1"), historicoAdmin)

  salvarSessao(api.token("op"), login.usuario, false)
  api.db.exec("UPDATE usuarios SET ativo=0 WHERE id='op'")
  await assert.rejects(emitirQrPresenca(janela), (erro) => erro.status === 401)
  assert.equal(sessionStorage.getItem("proxima-etapa.admin.token"), null)
  assert.deepEqual(eventos, ["expirada"])
  limparSessao()
})
