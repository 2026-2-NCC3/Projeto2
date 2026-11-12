import { useEffect, useRef, useState } from "react"

import QRCode from "qrcode"

import { X } from "lucide-react"

import { emitirQrPresenca } from "../services/api"

import { criarJanelaQr, escalaQrCanvas } from "../utils/checkin"

import AttendanceRecords from "./AttendanceRecords"

export default function ActivityQrDialog({ atividade, aoFechar }) {
  const [inicio, setInicio] = useState("")

  const [fim, setFim] = useState("")

  const [fuso, setFuso] = useState("local")

  const [emitindo, setEmitindo] = useState(false)

  const [erro, setErro] = useState("")

  const [qr, setQr] = useState(null)

  const [agora, setAgora] = useState(Date.now())

  const canvas = useRef(null)

  const dialogo = useRef(null)

  const operacao = useRef(null)

  const zonaLocal = Intl.DateTimeFormat().resolvedOptions().timeZone

  const expirado = qr && agora >= Date.parse(qr.valido_ate)

  useEffect(() => {
    const focoAnterior = document.activeElement

    dialogo.current?.querySelector("input")?.focus()

    function teclado(evento) {
      if (evento.key === "Escape") aoFechar()

      if (evento.key === "Tab") {
        const elementos = [
          ...dialogo.current.querySelectorAll(
            "button:not(:disabled), input, select:not(:disabled)",
          ),
        ]

        const primeiro = elementos[0]

        const ultimo = elementos[elementos.length - 1]

        if (evento.shiftKey && document.activeElement === primeiro) {
          evento.preventDefault()
          ultimo?.focus()
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault()
          primeiro?.focus()
        }
      }
    }

    document.addEventListener("keydown", teclado)

    return () => {
      operacao.current?.abort()

      document.removeEventListener("keydown", teclado)

      focoAnterior?.focus()
    }
  }, [aoFechar])

  useEffect(() => {
    if (!qr) return

    const timer = setInterval(() => setAgora(Date.now()), 1000)

    return () => clearInterval(timer)
  }, [qr])

  useEffect(() => {
    if (!qr || expirado || !canvas.current) return

    const alvo = canvas.current
    const recipiente = alvo.parentElement
    const opcoes = { margin: 4, errorCorrectionLevel: "M" }
    let observador

    function informarFalha() {
      setQr(null)
      setErro("Não foi possível desenhar o QR Code. Tente gerar novamente.")
    }

    try {
      const { modules } = QRCode.create(qr.token, opcoes)
      let escalaAtual

      function desenhar() {
        const escala = escalaQrCanvas(recipiente.clientWidth, modules.size, opcoes.margin)
        if (escala < 1 || escala === escalaAtual) return

        escalaAtual = escala
        QRCode.toCanvas(alvo, qr.token, { ...opcoes, scale: escala }, (falha) => {
          if (falha) informarFalha()
        })
      }

      desenhar()
      observador = new ResizeObserver(desenhar)
      observador.observe(recipiente)
    } catch {
      informarFalha()
    }
    return () => observador?.disconnect()
  }, [qr, expirado])

  function alterar(setter, valor) {
    operacao.current?.abort()

    setEmitindo(false)

    setQr(null)

    setErro("")

    setter(valor)
  }

  async function gerar(evento) {
    evento.preventDefault()

    operacao.current?.abort()

    const controller = new AbortController()

    operacao.current = controller

    setQr(null)

    setErro("")

    let janela

    try {
      janela = criarJanelaQr(atividade.id, inicio, fim, fuso)
    } catch (validacao) {
      setErro(validacao.message)

      return
    }

    try {
      setEmitindo(true)

      const resposta = await emitirQrPresenca(janela, {
        signal: controller.signal,
      })

      if (controller.signal.aborted) return

      if (
        typeof resposta?.qr_token !== "string" ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
          resposta.qr_token,
        ) ||
        resposta.qr_token.length > 4096
      ) {
        throw new Error("Resposta inválida")
      }

      setAgora(Date.now())

      setQr({ ...janela, token: resposta.qr_token })
    } catch (falha) {
      if (!controller.signal.aborted) {
        const mensagens = {
          400: "Confira a atividade e a janela de validade informadas.",

          401: "Sua sessão expirou. Entre novamente.",

          403: "Você não tem autorização para emitir este QR Code.",

          404: "A atividade não está disponível para emissão.",
        }

        setErro(
          falha.status
            ? mensagens[falha.status] || "Não foi possível emitir o QR Code."
            : falha instanceof TypeError || falha.name === "TimeoutError"
              ? "Falha de conexão ou tempo esgotado. Tente novamente."
              : "Não foi possível gerar o QR Code. Confira a conexão e tente novamente.",
        )
      }
    } finally {
      if (!controller.signal.aborted) setEmitindo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-titulo"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 id="qr-titulo" className="font-semibold text-gray-900">
              Gerar QR Code
            </h2>
            <p className="mt-1 text-sm text-gray-600">{atividade.titulo}</p>
            <p className="text-xs text-gray-500">{atividade.curso_titulo}</p>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar QR Code"
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </header>
        <div className="space-y-5 p-5">
          <form onSubmit={gerar} className="space-y-3">
            <p className="text-sm text-gray-500">
              Defina explicitamente a validade. O aluno precisa estar inscrito e
              autorizado.
            </p>
            <label className="block text-sm font-medium text-gray-700">
              Fuso dos horários
              <select
                value={fuso}
                onChange={(evento) => alterar(setFuso, evento.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="local">Este computador: {zonaLocal}</option>
                <option value="UTC">UTC</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Início da validade
                <input
                  required
                  type="datetime-local"
                  value={inicio}
                  onChange={(evento) => alterar(setInicio, evento.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Término da validade
                <input
                  required
                  type="datetime-local"
                  value={fim}
                  onChange={(evento) => alterar(setFim, evento.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
            <button
              disabled={emitindo}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {emitindo ? "Gerando…" : "Gerar QR Code"}
            </button>
          </form>
          {erro && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {erro}
            </p>
          )}
          {qr && (
            <section
              aria-label="QR de presença"
              className="rounded-xl border border-gray-200 p-4 text-center"
            >
              <h3 className="font-semibold">{atividade.titulo}</h3>
              <p className="text-sm text-gray-600">
                De {new Date(qr.valido_de).toLocaleString("pt-BR")} até{" "}
                {new Date(qr.valido_ate).toLocaleString("pt-BR")} ({zonaLocal})
              </p>
              <p className="mt-1 text-xs text-gray-500">
                UTC: {qr.valido_de} — {qr.valido_ate}
              </p>
              <p role="status" className="my-2 text-sm font-medium">
                {expirado
                  ? "QR expirado. Gere uma nova janela."
                  : agora < Date.parse(qr.valido_de)
                    ? "Aguardando o início da validade."
                    : "QR válido para leitura no aplicativo."}
              </p>
              {!expirado && (
                <div>
                  <canvas
                    ref={canvas}
                    aria-label="QR Code assinado para presença nesta atividade"
                    className="mx-auto block [image-rendering:pixelated]"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                Exiba somente aos participantes autorizados. Fechar esta janela
                não revoga o código antes do término.
              </p>
            </section>
          )}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="mb-2 font-semibold text-gray-900">
              Presenças nesta atividade
            </h3>
            <AttendanceRecords atividadeId={atividade.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
