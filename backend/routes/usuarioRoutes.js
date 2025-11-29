const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { proteger, admin } = require('../middlewares/auth');
const validateResource = require('../middlewares/validateResource');
const {
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  alterarSenhaSchema,
  idParamSchema
} = require('../schemas/usuarioSchema');

// Rotas de usuários (somente para admins)
router.get('/', proteger, admin, usuarioController.listarUsuarios);

router.post(
  '/',
  proteger,
  admin,
  validateResource({ body: criarUsuarioSchema }),
  usuarioController.criarUsuario
);

router.put(
  '/:id',
  proteger,
  admin,
  validateResource({ params: idParamSchema, body: atualizarUsuarioSchema }),
  usuarioController.atualizarUsuario
);

router.put(
  '/:id/senha',
  proteger,
  admin,
  validateResource({ params: idParamSchema, body: alterarSenhaSchema }),
  usuarioController.alterarSenha
);

router.delete(
  '/:id',
  proteger,
  admin,
  validateResource({ params: idParamSchema }),
  usuarioController.removerUsuario
);

module.exports = router;