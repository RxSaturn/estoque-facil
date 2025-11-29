require("dotenv").config();

// Validar variáveis de ambiente críticas na inicialização
if (!process.env.JWT_SECRET) {
  console.error('ERRO: JWT_SECRET não está configurado nas variáveis de ambiente!');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('ERRO: JWT_SECRET deve ter pelo menos 32 caracteres para garantir segurança!');
  process.exit(1);
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Importando middlewares
const { apiLimiter, authLimiter, relatorioLimiter, recuperacaoSenhaLimiter, dashboardLimiter } = require("./middlewares/rateLimit");
const errorHandler = require("./middlewares/errorHandler");

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
const dashboardRoutes = require('./routes/dashboardRoutes');


const app = express();

// Configurar proxy trust para funcionar corretamente atrás de proxies reversos
// (evita erros de ValidationError com headers X-Forwarded-For)
app.set('trust proxy', 1);

// Middlewares de segurança
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting global
app.use("/api", apiLimiter);

// Conexão com o banco de dados
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost/estoque-facil", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro na conexão com MongoDB:", err));

// Rotas com rate limiting específico
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/produtos", produtoRoutes);
app.use("/api/estoque", estoqueRoutes);
app.use("/api/vendas", vendaRoutes);
app.use("/api/relatorios", relatorioLimiter, relatorioRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/locais", localRoutes);
app.use("/api/movimentacoes", movimentacaoRoutes);
app.use('/api/recuperacao-senha', recuperacaoSenhaLimiter, recuperacaoSenhaRoutes);
app.use('/api/dashboard', dashboardLimiter, dashboardRoutes);

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

// Error handler centralizado (deve ser o último middleware)
app.use(errorHandler);

// Porta do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
