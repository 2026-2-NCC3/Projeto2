const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
    console.error("Servidor nao iniciado: configure JWT_SECRET no .env local.");
    process.exit(1);
}
let banco;
const ensureSchema = require("./src/config/ensureSchema");

try {
    banco = require("./database/database");
    ensureSchema(banco);
} catch (erro) {
    console.error("Servidor nao iniciado. Verifique o banco e execute db:init (vazio) ou migrate (existente). Consulte database/MIGRATIONS.md.");
    if (banco) banco.close();
    process.exit(1);
}
const authRoutes = require("./src/routes/authRoutes");
const profilesRoutes = require("./src/routes/profilesRoutes");
const cursosRoutes = require("./src/routes/cursosRoutes");
const universidadesRoutes = require("./src/routes/universidadesRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const atividadesRoutes = require("./src/routes/atividadesRoutes");
const inscricoesRoutes = require("./src/routes/inscricoesRoutes");


const app = express();
const PORT = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);

// Permite que a API receba dados no formato JSON
app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);

// Controller + Model de perfis. A tela Android de cadastro é a View.
app.use("/api/profiles", profilesRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/universidades", universidadesRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/atividades", atividadesRoutes);
app.use("/api/inscricoes", inscricoesRoutes);
app.use("/api/agenda", require("./src/routes/agendaRoutes"));
app.use("/api/presencas", require("./src/routes/presencasRoutes"));
app.use("/api/certificados", require("./src/routes/certificadosRoutes"));

// Rota inicial da API
app.get("/", (req, res) => {
    res.json({
        mensagem: "API Próxima Etapa está funcionando!"
    });
});

// Rota utilizada para verificar a saúde do servidor
app.get("/api/health", (req, res) => {
    try {
        banco.prepare("SELECT 1").get();
        res.status(200).json({
            status: "online",
            mensagem: "Backend funcionando corretamente"
        });
    } catch {
        res.status(503).json({
            status: "indisponivel",
            mensagem: "Banco de dados indisponivel."
        });
    }
});

// Nunca envie SQL, stack traces ou credenciais ao cliente.
app.use((erro, req, res, next) => {
    if (res.headersSent) return next(erro);
    const status = erro.type === "entity.parse.failed" ? 400 : 500;
    res.status(status).json({ erro: status === 400 ? "JSON invalido" : "Nao foi possivel concluir a operacao" });
});

// Inicializa o servidor
const server = require("node:http").createServer(app);
server.once("listening", () => {
    console.log(`Servidor executando em http://localhost:${server.address().port}`);
});

server.on("error", (erro) => {
    console.error(erro.code === "EADDRINUSE"
        ? "Servidor nao iniciado: a porta HTTP ja esta em uso. Encerre a outra instancia antes de iniciar."
        : "Servidor interrompido: nao foi possivel abrir a porta HTTP.");
    banco.close();
    process.exitCode = 1;
});

server.listen(PORT, "0.0.0.0");

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
        server.close(() => banco.close());
    });
}
