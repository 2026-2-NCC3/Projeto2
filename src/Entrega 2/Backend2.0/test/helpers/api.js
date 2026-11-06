const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { runMigrations } = require("../../src/config/migrationRunner");

const root = path.resolve(__dirname, "../..");
const secret = "fictitious-integration-secret-only";
const TEST_PASSWORD_COST = 4;
const SERVER_STARTUP_TIMEOUT_MS = 10000;

function createFictionalUsers(database) {
  const passwordHash = bcrypt.hashSync("Ficticio-teste-123!", TEST_PASSWORD_COST);
  const users = [
    ["a1", "aluno"],
    ["a2", "aluno"],
    ["op", "admin_operador"],
    ["super", "admin_super"]
  ];

  for (const [userId, role] of users) {
    database.prepare(
      "INSERT INTO usuarios (id,nome_completo,email) VALUES (?,?,?)"
    ).run(userId, "Ficticio " + userId, userId + "@example.invalid");
    database.prepare("INSERT INTO credenciais VALUES (?,?,?)")
      .run(userId, passwordHash, new Date().toISOString());
    database.prepare("INSERT INTO papeis (usuario_id,papel) VALUES (?,?)")
      .run(userId, role);

    if (role === "aluno") {
      database.prepare("INSERT INTO alunos (usuario_id) VALUES (?)").run(userId);
    }
  }
}

function waitForServerPort(serverProcess) {
  return new Promise((resolve, reject) => {
    let serverOutput = "";
    const startupTimeout = setTimeout(() => {
      reject(new Error("Startup timeout"));
    }, SERVER_STARTUP_TIMEOUT_MS);

    serverProcess.stdout.on("data", (chunk) => {
      serverOutput += chunk;
      const portMatch = serverOutput.match(/localhost:(\d+)/);
      if (portMatch) {
        clearTimeout(startupTimeout);
        resolve(portMatch[1]);
      }
    });
    serverProcess.once("error", (error) => {
      clearTimeout(startupTimeout);
      reject(error);
    });
    serverProcess.once("exit", () => {
      clearTimeout(startupTimeout);
      reject(new Error("Server exited before startup"));
    });
  });
}

async function withApi(testContext) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proxima-api-"));
  const databaseFilename = path.join(temporaryDirectory, "fictional.db");
  const database = new Database(databaseFilename);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  runMigrations(database, { initialize: true });
  createFictionalUsers(database);

  const serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: {
      ...process.env,
      DB_PATH: databaseFilename,
      PORT: "0",
      JWT_SECRET: secret
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const serverExit = once(serverProcess, "exit");
  testContext.after(async () => {
    if (serverProcess.exitCode === null) {
      serverProcess.kill();
      await serverExit;
    }
    database.close();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  const port = await waitForServerPort(serverProcess);
  const token = (userId, role = "admin_super", options = {}) => jwt.sign(
    { usuario_id: userId, papel: role },
    secret,
    { expiresIn: "1h", ...options }
  );

  async function request(route, userOrToken, method = "GET", body) {
    const headers = { "Content-Type": "application/json" };
    if (userOrToken) {
      const accessToken = userOrToken.startsWith("ey") ? userOrToken : token(userOrToken);
      headers.Authorization = "Bearer " + accessToken;
    }
    const response = await fetch("http://127.0.0.1:" + port + route, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const responseBody = await response.text();
    return {
      status: response.status,
      body: responseBody ? JSON.parse(responseBody) : null
    };
  }

  return {
    db: database,
    filename: databaseFilename,
    baseUrl: "http://127.0.0.1:" + port,
    request,
    token,
    dir: temporaryDirectory,
    secret
  };
}

module.exports = { withApi, root };
