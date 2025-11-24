const express = require('express');
const router = express.Router();
const recuperacaoSenhaController = require('../controllers/recuperacaoSenhaController');

// Rota para solicitar recuperação de senha
router.post('/solicitar', recuperacaoSenhaController.solicitarRecuperacao);

// Rota para validar token
router.get('/validar/:token', recuperacaoSenhaController.validarToken);

// Rota para redefinir senha
router.post('/redefinir/:token', recuperacaoSenhaController.redefinirSenha);

module.exports = router;