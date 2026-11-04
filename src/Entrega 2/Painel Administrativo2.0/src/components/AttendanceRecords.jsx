import { useEffect, useState } from "react"

import { listarPerfis, listarPresencasDoAluno } from "../services/api"

import { filtrarPresencas } from "../utils/checkin"

export default function AttendanceRecords({ atividadeId = "" }) {
  const [alunos, setAlunos] = useState([])

  const [alunoId, setAlunoId] = useState("")

  const [presencas, setPresencas] = useState([])

  const [erro, setErro] = useState("")

  const [carregando, setCarregando] = useState(false)

  const [atualizacao, setAtualizacao] = useState(0)

  const [consultadoEm, setConsultadoEm] = useState(null)

  const [carregandoAlunos, setCarregandoAlunos] = useState(true)

  const [tentativaAlunos, setTentativaAlunos] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    setCarregandoAlunos(true)

    setErro("")

    listarPerfis({ signal: controller.signal })
      .then((perfis) => {
        if (!Array.isArray(perfis)) throw new Error("Resposta inválida")

        if (!controller.signal.aborted) setAlunos(perfis)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setErro("Não foi possível carregar os alunos.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregandoAlunos(false)
      })

    return () => controller.abort()
  }, [tentativaAlunos])

  useEffect(() => {
    const controller = new AbortController()

    setPresencas([])

    setConsultadoEm(null)

    setErro("")

    setCarregando(Boolean(alunoId))

    if (alunoId) {
      listarPresencasDoAluno(alunoId, { signal: controller.signal })
        .then((registros) => {
          if (!Array.isArray(registros)) throw new Error("Resposta inválida")

          if (!controller.signal.aborted) {
            setPresencas(registros)

            setConsultadoEm(new Date())
          }
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setErro(
              "Não foi possível consultar as presenças. Verifique sua conexão e permissão.",
            )
        })
        .finally(() => {
          if (!controller.signal.aborted) setCarregando(false)
        })
    }

    return () => controller.abort()
  }, [alunoId, atividadeId, atualizacao])

  const registros = filtrarPresencas(presencas, atividadeId)

  return (
    <section className="space-y-3" aria-label="Consulta de presenças">
      <p className="text-sm text-gray-500">
        Consulta por aluno autorizado. Atualize após o check-in; nenhum registro
        representa ausência.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium text-gray-700">
          Aluno
          <select
            aria-label="Aluno"
            value={alunoId}
            disabled={carregandoAlunos}
            onChange={(evento) => {
              setAlunoId(evento.target.value)
              setPresencas([])
              setConsultadoEm(null)
            }}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">
              {carregandoAlunos ? "Carregando alunos…" : "Selecione um aluno"}
            </option>
            {alunos.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome_completo}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={carregando || carregandoAlunos}
          onClick={() =>
            alunoId
              ? setAtualizacao((valor) => valor + 1)
              : setTentativaAlunos((valor) => valor + 1)
          }
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
        >
          {carregando ? "Consultando…" : "Atualizar"}
        </button>
      </div>
      {erro && (
        <p role="alert" className="text-sm text-red-700">
          {erro}
        </p>
      )}
      <div aria-live="polite" className="text-sm text-gray-600">
        {consultadoEm && !erro && (
          <p>
            Consultado às {consultadoEm.toLocaleTimeString("pt-BR")} ·{" "}
            {registros.length} registro(s)
          </p>
        )}
        {consultadoEm && registros.length === 0 && (
          <p>Nenhuma presença registrada para esta consulta.</p>
        )}
      </div>
      {registros.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3">Atividade / Curso</th>
                <th className="p-3">Check-in</th>
                <th className="p-3">Método</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((presenca) => (
                <tr key={presenca.id} className="border-t border-gray-100">
                  <td className="p-3">
                    {presenca.titulo}
                    <span className="block text-xs text-gray-500">
                      {presenca.curso_titulo}
                    </span>
                  </td>
                  <td className="p-3">
                    {new Date(presenca.checkin_em).toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3">
                    {presenca.metodo === "qrcode" ? "QR Code" : presenca.metodo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
