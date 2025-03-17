const express = require('express');
const router = express.Router();
const estoqueController = require('../controllers/estoqueController');
const { proteger } = require('../middlewares/auth');

// Rotas de estoque
router.get('/verificar', proteger, estoqueController.verificarEstoque);
router.post('/transferir', proteger, estoqueController.transferir);
router.get('/locais', proteger, estoqueController.listarLocais);

module.exports = router;