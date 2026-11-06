const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const model = require("../models/presencasCheckinModel");
const { executarEscrita } = require("../utils/controllerUtils");

const QR_ISSUER = "proxima-etapa-presencas";
const QR_AUDIENCE = "presenca-checkin";

function possuiSomenteCampos(body, campos) {
  return body && typeof body === "object" && !Array.isArray(body)
    && Object.keys(body).length === campos.length
    && campos.every((campo) => Object.hasOwn(body, campo));
}

function textoValido(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

// Contrato: UTC explicito, YYYY-MM-DDTHH:mm:ssZ. Sem inferir fuso da agenda.
function segundosUtc(valor) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(valor)) {
    return null;
  }
  const milissegundos = Date.parse(valor);
  if (!Number.isFinite(milissegundos)
      || new Date(milissegundos).toISOString().replace(".000Z", "Z") !== valor) {
    return null;
  }
  return milissegundos / 1000;
}

// POST /api/presencas/qr-token: { atividade_id, valido_de, valido_ate }.
// Somente administradores escolhem a janela; nao ha tolerancia presumida.
function emitirQrToken(req, res, next) {
  try {
    if (!possuiSomenteCampos(req.body, ["atividade_id", "valido_de", "valido_ate"])
        || !textoValido(req.body.atividade_id)) {
      return res.status(400).json({ erro: "Informe atividade e janela de validade" });
    }
    const inicio = segundosUtc(req.body.valido_de);
    const fim = segundosUtc(req.body.valido_ate);
    if (inicio === null || fim === null || fim <= inicio || fim <= Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ erro: "Janela de validade invalida; informe horarios UTC" });
    }
    if (!model.buscarAtividadeDisponivel(req.body.atividade_id)) {
      return res.status(404).json({ erro: "Atividade indisponivel" });
    }
    const qrToken = jwt.sign({
      atividade_id: req.body.atividade_id,
      emissor_id: req.usuario.id,
      nbf: inicio,
      exp: fim
    }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      issuer: QR_ISSUER,
      audience: QR_AUDIENCE,
      jwtid: crypto.randomUUID()
    });
    res.set("Cache-Control", "no-store");
    return res.status(201).json({ qr_token: qrToken });
  } catch (erro) {
    return next(erro);
  }
}

// POST /api/presencas/check-in: { qr_token }. Nao aceita IDs ou horario do aluno.
function registrarCheckin(req, res, next) {
  if (req.usuario.papel !== "aluno") {
    return res.status(403).json({ erro: "Check-in exclusivo para alunos" });
  }
  if (!possuiSomenteCampos(req.body, ["qr_token"])
      || !textoValido(req.body.qr_token) || req.body.qr_token.length > 4096) {
    return res.status(400).json({ erro: "Informe somente o token do QR" });
  }
  let autorizacao;
  try {
    autorizacao = jwt.verify(req.body.qr_token, process.env.JWT_SECRET, {
      algorithms: ["HS256"], issuer: QR_ISSUER, audience: QR_AUDIENCE
    });
    if (!textoValido(autorizacao.atividade_id) || !textoValido(autorizacao.emissor_id)
        || !Number.isSafeInteger(autorizacao.nbf) || !Number.isSafeInteger(autorizacao.exp)
        || autorizacao.exp <= autorizacao.nbf) {
      throw new Error("Contrato QR invalido");
    }
  } catch (erro) {
    return res.status(400).json({ erro: "QR invalido ou fora da validade" });
  }
  return executarEscrita(res, next, () => {
    const resultado = model.registrarCheckin.immediate(req.usuario.id, autorizacao);
    if (!resultado) {
      return res.status(403).json({ erro: "Presenca nao autorizada" });
    }
    res.set("Cache-Control", "no-store");
    return res.status(resultado.criada ? 201 : 200).json(resultado.presenca);
  });
}

module.exports = { emitirQrToken, registrarCheckin };
