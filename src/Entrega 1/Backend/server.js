const express = require("express");
const cors = require("cors");
const banco = require("./database/database");
const profilesRoutes = require("./src/routes/profilesRoutes");

const app = express();
const PORT = 3000;

// Permite que a API receba dados no formato JSON
app.use(express.json());
app.use(cors());

// Controller + Model de perfis. A tela Android de cadastro é a View.
app.use("/api/profiles", profilesRoutes);

// Rota inicial da API
app.get("/", (req, res) => {
    res.json({
        mensagem: "API Próxima Etapa está funcionando!"
    });
});

// Rota utilizada para verificar a saúde do servidor
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "online",
        mensagem: "Backend funcionando corretamente"
    });
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`Servidor executando em http://localhost:${PORT}`);
});
