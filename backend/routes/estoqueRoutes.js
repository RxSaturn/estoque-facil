const express = require("express");
const router = express.Router();
const estoqueController = require("../controllers/estoqueController");
const { proteger } = require("../middlewares/auth");

// Rotas de estoque
router.get("/verificar", proteger, estoqueController.verificarEstoque);
router.post("/transferir", proteger, estoqueController.transferir);
router.get("/locais", proteger, estoqueController.listarLocais);
router.get("/", proteger, estoqueController.obterTodoEstoque);

// Novas rotas para estoque baixo
router.get("/produtos-baixo-estoque", proteger, estoqueController.obterProdutosBaixoEstoque);
router.get("/estatisticas", proteger, estoqueController.obterEstatisticasEstoque);
router.post("/atualizar-flags", proteger, estoqueController.atualizarFlagsEstoque);
router.get('/estoque-critico', estoqueController.getEstoqueCritico);

module.exports = router;