const express = require("express");
const router = express.Router();
const localController = require("../controllers/localController");
const { proteger, admin } = require("../middlewares/auth");

// Rota para compatibilidade com o sistema atual
router.get("/nomes", proteger, localController.listarNomesLocais);

// Rota para listar tipos de locais
router.get("/tipos", proteger, localController.listarTiposLocais);

// Rotas CRUD - apenas administradores podem gerenciar locais
router.get("/", proteger, localController.listarLocais);
router.get("/:id", proteger, localController.obterLocal);
router.get("/:id/produtos", proteger, localController.obterProdutosNoLocal);
router.post("/", proteger, admin, localController.criarLocal);
router.put("/:id", proteger, admin, localController.atualizarLocal);
router.delete("/:id", proteger, admin, localController.removerLocal);

module.exports = router;
