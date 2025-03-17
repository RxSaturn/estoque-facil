const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { proteger } = require('../middlewares/auth');

// Rotas de relatórios
router.get('/resumo', proteger, relatorioController.gerarResumo);
router.get('/pdf', proteger, relatorioController.gerarPDF);

module.exports = router;