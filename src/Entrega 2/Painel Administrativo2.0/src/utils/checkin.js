export function administradorAutorizado(usuario) {
  return ["admin_operador", "admin_super"].includes(usuario?.papel)
}

function partesDaData(data) {
  return [
    data.getFullYear(),
    data.getMonth() + 1,
    data.getDate(),
    data.getHours(),
    data.getMinutes(),
  ]
}

export function horarioParaUtc(valor, fuso = "local") {
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valor)
  if (!partes || !["local", "UTC"].includes(fuso)) {
    throw new Error("Informe uma data e um horário válidos.")
  }
  const numeros = partes.slice(1).map(Number)
  const [ano, mes, dia, hora, minuto] = numeros
  if (ano < 1000) {
    throw new Error("Informe uma data válida.")
  }
  const data =
    fuso === "UTC"
      ? new Date(Date.UTC(ano, mes - 1, dia, hora, minuto))
      : new Date(ano, mes - 1, dia, hora, minuto)
  const conferidas =
    fuso === "UTC"
      ? [
          data.getUTCFullYear(),
          data.getUTCMonth() + 1,
          data.getUTCDate(),
          data.getUTCHours(),
          data.getUTCMinutes(),
        ]
      : partesDaData(data)
  if (conferidas.some((parte, indice) => parte !== numeros[indice])) {
    throw new Error("Data inválida ou horário inexistente neste fuso.")
  }
  if (fuso === "local") {
    const ambiguo = [-120, -90, -60, -30, 30, 60, 90, 120].some(
      (deslocamento) => {
        const alternativa = new Date(data.getTime() + deslocamento * 60000)
        return partesDaData(alternativa).every(
          (parte, indice) => parte === numeros[indice],
        )
      },
    )
    if (ambiguo) {
      throw new Error(
        "Horário ambíguo neste fuso. Selecione UTC e informe o instante desejado.",
      )
    }
  }
  return data.toISOString().replace(".000Z", "Z")
}

export function criarJanelaQr(
  atividadeId,
  inicio,
  fim,
  fuso,
  agora = Date.now(),
) {
  if (typeof atividadeId !== "string" || !atividadeId.trim()) {
    throw new Error("Selecione uma atividade existente.")
  }
  const validoDe = horarioParaUtc(inicio, fuso)
  const validoAte = horarioParaUtc(fim, fuso)
  if (Date.parse(validoAte) <= Date.parse(validoDe)) {
    throw new Error("O término deve ser posterior ao início.")
  }
  if (Date.parse(validoAte) <= agora) {
    throw new Error("O término deve estar no futuro.")
  }
  return {
    atividade_id: atividadeId,
    valido_de: validoDe,
    valido_ate: validoAte,
  }
}

export function filtrarPresencas(presencas, atividadeId) {
  return atividadeId
    ? presencas.filter((presenca) => presenca.atividade_id === atividadeId)
    : presencas
}
