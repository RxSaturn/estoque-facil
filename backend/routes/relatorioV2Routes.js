const express = require("express");
const router = express.Router();
const relatorioV2Controller = require("../controllers/relatorioV2Controller");
const { proteger } = require("../middlewares/auth");
const { pdfLimiter } = require("../middlewares/rateLimit");

// Aplicar middleware de autenticação em todas as rotas
router.use(proteger);

// Endpoint otimizado para obter todos os dados do relatório em uma única query
// GET /api/relatorios/v2/dados
router.get("/dados", relatorioV2Controller.getDadosRelatorio);

// Endpoint otimizado para gerar PDF
// GET /api/relatorios/v2/pdf
router.get("/pdf", pdfLimiter, relatorioV2Controller.gerarPDFOtimizado);

module.exports = router;
