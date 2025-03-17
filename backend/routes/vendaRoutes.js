const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const { proteger } = require('../middlewares/auth');

// Rotas de vendas
router.post('/', proteger, vendaController.registrarVenda);
router.get('/', proteger, vendaController.listarVendas);

module.exports = router;