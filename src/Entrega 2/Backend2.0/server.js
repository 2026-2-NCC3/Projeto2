const express = require("express");
const cors = require("cors");
require("dotenv").config();
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

// Inicializa o servidor
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor executando em http://localhost:${server.address().port}`);
});

server.on("error", () => {
    console.error("Servidor interrompido: nao foi possivel abrir a porta HTTP.");
    banco.close();
    process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
        server.close(() => banco.close());
    });
}
