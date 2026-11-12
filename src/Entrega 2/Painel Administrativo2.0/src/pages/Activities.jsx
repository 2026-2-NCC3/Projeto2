import { useCallback, useEffect, useState } from "react"

import { QrCode, Search } from "lucide-react"

import { listarAtividades } from "../services/api"

import { administradorAutorizado } from "../utils/checkin"

import ActivityQrDialog from "../components/ActivityQrDialog"
import ActivityForm from "../components/ActivityForm"

function ActivitiesContent() {
  const [atividades, setAtividades] = useState([])

  const [busca, setBusca] = useState("")

  const [carregando, setCarregando] = useState(true)

  const [erro, setErro] = useState("")

  const [tentativa, setTentativa] = useState(0)

  const [selecionada, setSelecionada] = useState(null)
  const [editando, setEditando] = useState(null)

  const fechar = useCallback(() => setSelecionada(null), [])

  useEffect(() => {
    const controller = new AbortController()

    setCarregando(true)

    setErro("")

    listarAtividades({ signal: controller.signal })
      .then((registros) => {
        if (!Array.isArray(registros)) throw new Error("Resposta inválida")

        if (!controller.signal.aborted) setAtividades(registros)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setErro("Não foi possível carregar as atividades.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false)
      })

    return () => controller.abort()
  }, [tentativa])

  const filtradas = atividades.filter((atividade) =>
    [atividade.titulo, atividade.curso_titulo].some((texto) =>
      texto?.toLowerCase().includes(busca.toLowerCase()),
    ),
  )

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Atividades / Encontros</h1>
          <p className="mt-0.5 text-sm text-gray-500">Encontros e QR Code para registro de presença.</p>
        </div>
        {!editando && <button onClick={() => setEditando({})}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Nova atividade</button>}
      </div>
      {editando && <ActivityForm atividade={editando} aoCancelar={() => setEditando(null)}
        aoSalvar={() => {
          setEditando(null)
          setTentativa((valor) => valor + 1)
        }} />}
      <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4">
        <Search size={16} className="text-gray-400" />
        <span className="sr-only">Buscar atividades ou cursos</span>
        <input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar atividade ou curso…"
          className="w-full text-sm outline-none"
        />
      </label>
      {erro && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {erro}
          <button
            onClick={() => setTentativa((valor) => valor + 1)}
            className="ml-2 underline"
          >
            Tentar novamente
          </button>
        </p>
      )}
      {carregando ? (
        <p role="status" className="py-8 text-center text-gray-500">
          Carregando atividades…
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-4">Atividade / Curso</th>
                <th className="p-4">Data e horário da agenda</th>
                <th className="p-4">Local</th>
                <th className="p-4">Presença</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((atividade) => (
                <tr key={atividade.id} className="border-t border-gray-100">
                  <td className="p-4 font-medium">
                    {atividade.titulo}
                    <span className="block text-xs font-normal text-gray-500">
                      {atividade.curso_titulo}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {atividade.data?.split("-").reverse().join("/")} ·{" "}
                    {atividade.hora_inicio}–{atividade.hora_fim}
                  </td>
                  <td className="p-4 text-gray-600">
                    {atividade.local || "Não informado"}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                    <button disabled={Boolean(editando)} onClick={() => setEditando(atividade)}
                      className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-50">
                      Editar
                    </button>
                    <button
                      onClick={() => setSelecionada(atividade)}
                      className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 font-medium text-white"
                    >
                      <QrCode size={16} /> Gerar QR Code
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!erro && filtradas.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">
              Nenhuma atividade encontrada.
            </p>
          )}
        </div>
      )}
      {selecionada && (
        <ActivityQrDialog atividade={selecionada} aoFechar={fechar} />
      )}
    </div>
  )
}

export default function Activities({ usuario }) {
  return administradorAutorizado(usuario) ? (
    <ActivitiesContent />
  ) : (
    <p role="alert" className="p-6 text-red-700">
      Acesso restrito a administradores.
    </p>
  )
}
