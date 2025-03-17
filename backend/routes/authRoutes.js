const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { proteger } = require('../middlewares/auth');

// Rotas de autenticação
router.post('/login', authController.login);
router.post('/registro', authController.registro);
router.get('/verificar', proteger, authController.verificarUsuario);

module.exports = router;