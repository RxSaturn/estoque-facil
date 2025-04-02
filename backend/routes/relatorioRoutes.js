const express = require("express");
const router = express.Router();
const relatorioController = require("../controllers/relatorioController");
const { proteger } = require("../middlewares/auth");

// Aplicar middleware de autenticação em todas as rotas
router.use(proteger);

// Definição correta das rotas
router.get("/resumo", relatorioController.getResumo);
router.get("/pdf", relatorioController.gerarPDF);

// Para a funcionalidade de top produtos baseada em número de vendas
router.get("/top-produtos", relatorioController.getTopProdutosPorVendas);


module.exports = router;
