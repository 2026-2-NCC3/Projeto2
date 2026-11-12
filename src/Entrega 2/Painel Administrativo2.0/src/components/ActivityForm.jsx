import { useEffect, useRef, useState } from "react"
import { listarCursos, salvarAtividade } from "../services/api"

const field = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"

export default function ActivityForm({ atividade, aoSalvar, aoCancelar }) {
  const [cursos, setCursos] = useState(null)
  const [erroCursos, setErroCursos] = useState("")
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const operacao = useRef(null)
  const id = atividade.id

  useEffect(() => {
    if (id) return
    const controller = new AbortController()
    listarCursos({ signal: controller.signal })
      .then((dados) => {
        if (!Array.isArray(dados)) throw new Error("Resposta inválida")
        if (!controller.signal.aborted) setCursos(dados.filter(curso => curso.status !== "cancelado"))
      })
      .catch(() => {
        if (!controller.signal.aborted) setErroCursos("Não foi possível carregar os cursos. Reabra o formulário para tentar novamente.")
      })
    return () => controller.abort()
  }, [id])

  useEffect(() => () => operacao.current?.abort(), [])

  async function salvar(evento) {
    evento.preventDefault()
    if (operacao.current) return
    setErro("")
    const dados = Object.fromEntries(new FormData(evento.currentTarget))
    dados.titulo = dados.titulo.trim()
    if (!dados.titulo || dados.hora_fim.padEnd(8, ":00") <= dados.hora_inicio.padEnd(8, ":00")) {
      setErro("Informe um título e um horário de término posterior ao início.")
      return
    }
    const controller = new AbortController()
    operacao.current = controller
    setSalvando(true)
    try {
      await salvarAtividade(dados, id, { signal: controller.signal })
      if (!controller.signal.aborted) aoSalvar()
    } catch (falha) {
      if (!controller.signal.aborted) {
        setErro(falha.status
          ? falha.message
          : "Não foi possível confirmar o salvamento. Consulte a lista antes de tentar novamente.")
      }
    } finally {
      operacao.current = null
      if (!controller.signal.aborted) setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="font-semibold">{id ? "Editar atividade" : "Nova atividade"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Curso
          {id ? <span className="mt-1 block">{atividade.curso_titulo}</span> : (
            <select name="curso_id" required disabled={!cursos?.length} className={field}>
              <option value="">{cursos ? "Selecione um curso" : "Carregando cursos…"}</option>
              {cursos?.map(curso => <option key={curso.id} value={curso.id}>{curso.titulo}</option>)}
            </select>
          )}
        </label>
        <label className="text-sm font-medium">
          Título
          <input name="titulo" required defaultValue={atividade.titulo} className={field} />
        </label>
        <label className="text-sm font-medium">
          Tipo
          <select name="tipo" defaultValue={atividade.tipo || "aula"} className={field}>
            <option value="aula">Aula</option>
            <option value="workshop">Workshop</option>
            <option value="palestra">Palestra</option>
            <option value="avaliacao">Avaliação</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Data
          <input name="data" type="date" required defaultValue={atividade.data} className={field} />
        </label>
        <label className="text-sm font-medium">
          Início
          <input name="hora_inicio" type="time" step="1" required defaultValue={atividade.hora_inicio} className={field} />
        </label>
        <label className="text-sm font-medium">
          Término
          <input name="hora_fim" type="time" step="1" required defaultValue={atividade.hora_fim} className={field} />
        </label>
        <label className="text-sm font-medium">
          Local
          <input name="local" defaultValue={atividade.local ?? ""} className={field} />
        </label>
      </div>
      {erroCursos && <p role="alert" className="text-sm text-red-700">{erroCursos}</p>}
      {cursos?.length === 0 && <p role="status" className="text-sm">Cadastre um curso antes de criar uma atividade.</p>}
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={salvando || (!id && !cursos?.length)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
          {salvando ? "Salvando…" : "Salvar atividade"}
        </button>
        <button type="button" disabled={salvando} onClick={aoCancelar}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancelar</button>
      </div>
    </form>
  )
}
