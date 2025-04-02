const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const { proteger } = require('../middlewares/auth');

// Rotas de vendas existentes
router.post('/', proteger, vendaController.registrarVenda);
router.get('/', proteger, vendaController.listarVendas);
router.get('/historico', proteger, vendaController.listarHistorico);

// Nova rota para excluir vendas de produtos removidos
router.delete('/produtos-removidos', proteger, vendaController.excluirVendasProdutosRemovidos);

module.exports = router;
