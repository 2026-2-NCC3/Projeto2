import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import QRCode from "qrcode"
import jsQR from "jsqr"
import {
  administradorAutorizado,
  horarioParaUtc,
  criarJanelaQr,
  filtrarPresencas,
} from "../src/utils/checkin.js"

test("QR: permite somente os dois papéis administrativos existentes", () => {
  for (const papel of ["admin_operador", "admin_super"])
    assert.ok(administradorAutorizado({ papel }))
  for (const usuario of [null, {}, { papel: "aluno" }, { papel: "admin" }])
    assert.equal(administradorAutorizado(usuario), false)
})

test("QR: converte horário do computador para UTC e respeita virada de dia", () => {
  const codigo =
    "import {horarioParaUtc} from './src/utils/checkin.js'; console.log(horarioParaUtc('2030-01-01T23:30'));"
  const resultado = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", codigo],
    {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, TZ: "America/Sao_Paulo" },
      encoding: "utf8",
    },
  )
  assert.equal(resultado.status, 0, resultado.stderr)
  assert.equal(resultado.stdout.trim(), "2030-01-02T02:30:00Z")
  assert.equal(
    horarioParaUtc("2030-01-01T23:30", "UTC"),
    "2030-01-01T23:30:00Z",
  )
})

test("QR: rejeita datas inválidas, horários inexistentes e ambíguos", () => {
  for (const valor of [
    "",
    "2030-02-30T10:00",
    "2030-01-01T25:00",
    "2030-01-01T10:00Z",
  ]) {
    assert.throws(() => horarioParaUtc(valor, "UTC"))
  }
  const codigo =
    "import assert from 'node:assert/strict'; import {horarioParaUtc} from './src/utils/checkin.js'; assert.throws(()=>horarioParaUtc('2030-03-10T02:30')); assert.throws(()=>horarioParaUtc('2030-11-03T01:30'));"
  const resultado = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", codigo],
    {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, TZ: "America/New_York" },
      encoding: "utf8",
    },
  )
  assert.equal(resultado.status, 0, resultado.stderr)
})

test("QR: envia somente campos contratados e valida a janela antes da API", () => {
  const janela = criarJanelaQr(
    "at-ficticia",
    "2030-01-01T10:00",
    "2030-01-01T11:00",
    "UTC",
    0,
  )
  assert.deepEqual(janela, {
    atividade_id: "at-ficticia",
    valido_de: "2030-01-01T10:00:00Z",
    valido_ate: "2030-01-01T11:00:00Z",
  })
  assert.throws(() =>
    criarJanelaQr("", "2030-01-01T10:00", "2030-01-01T11:00", "UTC", 0),
  )
  assert.throws(() =>
    criarJanelaQr("at", "2030-01-01T10:00", "2030-01-01T10:00", "UTC", 0),
  )
  assert.throws(() =>
    criarJanelaQr(
      "at",
      "2030-01-01T10:00",
      "2030-01-01T11:00",
      "UTC",
      Date.parse("2030-01-02"),
    ),
  )
})

export function lerImagemQr(token) {
  const qr = QRCode.create(token, { errorCorrectionLevel: "M" })
  const margem = 4
  const escala = 5
  const largura = (qr.modules.size + margem * 2) * escala
  const pixels = new Uint8ClampedArray(largura * largura * 4).fill(255)
  for (let y = 0; y < qr.modules.size; y++) {
    for (let x = 0; x < qr.modules.size; x++) {
      if (!qr.modules.get(y, x)) continue
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const indice =
            (((y + margem) * escala + dy) * largura +
              (x + margem) * escala +
              dx) *
            4
          pixels[indice] = pixels[indice + 1] = pixels[indice + 2] = 0
        }
      }
    }
  }
  return jsQR(pixels, largura, largura)?.data
}

test("QR: imagem decodificável contém o token integral, sem URL ou envelope", () => {
  const token =
    "eyJhbGciOiJIUzI1NiJ9." +
    Buffer.from(
      JSON.stringify({ atividade_id: "ficticia", texto: "a".repeat(450) }),
    ).toString("base64url") +
    ".assinaturaFicticia"
  assert.ok(lerImagemQr(token) === token)
})

test("presenças: filtra atividade sem criar registros ou inferir faltas", () => {
  const registros = [
    { id: "p1", atividade_id: "at1" },
    { id: "p2", atividade_id: "at2" },
  ]
  assert.deepEqual(filtrarPresencas(registros, "at1"), [registros[0]])
  assert.deepEqual(filtrarPresencas(registros, "inexistente"), [])
  assert.deepEqual(filtrarPresencas(registros, ""), registros)
  assert.equal(registros.length, 2)
})
