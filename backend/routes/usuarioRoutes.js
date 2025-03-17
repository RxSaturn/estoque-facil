const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { proteger, admin } = require('../middlewares/auth');

// Rotas de usuários (somente para admins)
router.get('/', proteger, admin, usuarioController.listarUsuarios);
router.post('/', proteger, admin, usuarioController.criarUsuario);
router.put('/:id', proteger, admin, usuarioController.atualizarUsuario);
router.put('/:id/senha', proteger, admin, usuarioController.alterarSenha);
router.delete('/:id', proteger, admin, usuarioController.removerUsuario);

module.exports = router;