const express = require("express");
const router = express.Router();
const relatorioController = require("../controllers/relatorioController");
const { proteger } = require("../middlewares/auth");
const { pdfLimiter } = require("../middlewares/rateLimit");

// Aplicar middleware de autenticação em todas as rotas
router.use(proteger);

// Definição correta das rotas
router.get("/resumo", relatorioController.getResumo);
router.get("/pdf", pdfLimiter, relatorioController.gerarPDF);

// Para a funcionalidade de top produtos baseada em número de vendas
router.get("/top-produtos", relatorioController.getTopProdutosPorVendas);

// Novos endpoints otimizados
router.get("/resumo-geral", relatorioController.getResumoGeral);
router.get("/grafico-vendas", relatorioController.getGraficoVendas);
router.get("/top-produtos-otimizado", relatorioController.getTopProdutos);

// Endpoints granulares para carregamento paralelo
router.get("/stats", relatorioController.getStats);
router.get("/charts/sales", relatorioController.getChartsSales);
router.get("/charts/categories", relatorioController.getChartsCategories);
router.get("/charts/stock", relatorioController.getChartsStock);


module.exports = router;
