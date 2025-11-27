require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Importando as rotas
const authRoutes = require("./routes/authRoutes");
const produtoRoutes = require("./routes/produtoRoutes");
const estoqueRoutes = require("./routes/estoqueRoutes");
const vendaRoutes = require("./routes/vendaRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const localRoutes = require("./routes/localRoutes");
const movimentacaoRoutes = require("./routes/movimentacaoRoutes");
const recuperacaoSenhaRoutes = require('./routes/recuperacaoSenhaRoutes');


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Conexão com o banco de dados
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost/estoque-facil", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro na conexão com MongoDB:", err));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/produtos", produtoRoutes);
app.use("/api/estoque", estoqueRoutes);
app.use("/api/vendas", vendaRoutes);
app.use("/api/relatorios", relatorioRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/locais", localRoutes);
app.use("/api/movimentacoes", movimentacaoRoutes);
app.use('/api/recuperacao-senha', recuperacaoSenhaRoutes);

// Endpoint de health check para verificação de conexão
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});


// Rota de teste
app.get("/", (req, res) => {
  res.send("API Estoque Fácil está funcionando!");
});

// Porta do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
