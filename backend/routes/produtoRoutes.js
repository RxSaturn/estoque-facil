const express = require("express");
const router = express.Router();
const produtoController = require("../controllers/produtoController");
const { proteger } = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `produto-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

// IMPORTANTE: A ordem das rotas é crucial!
// Rotas específicas devem vir ANTES das rotas com parâmetros

// Rotas para metadados (devem vir primeiro)
router.get("/tipos", proteger, produtoController.listarTipos);
router.get("/categorias", proteger, produtoController.listarCategorias);
router.get("/subcategorias", proteger, produtoController.listarSubcategorias);
router.get(
  "/mais-vendidos",
  proteger,
  produtoController.obterProdutosMaisVendidos
);
router.get("/estatisticas", proteger, produtoController.obterEstatisticas);
router.get("/count", proteger, produtoController.contarProdutos); // NOVO: Endpoint otimizado para contagem
router.get("/buscar", proteger, produtoController.buscarProdutos); // NOVO: Endpoint para autocomplete

// Rotas CRUD principais
router.post(
  "/",
  proteger,
  upload.single("imagem"),
  produtoController.criarProduto
);
router.get("/", proteger, produtoController.listarProdutos);

// Rotas com parâmetros (devem vir por último)
router.get("/:id", proteger, produtoController.obterProdutoPorId);
router.put(
  "/:id",
  proteger,
  upload.single("imagem"),
  produtoController.atualizarProduto
);
router.delete("/:id", proteger, produtoController.removerProduto);

// Rota de zerar estoque
router.post(
  "/:id/zerar-estoque",
  proteger,
  produtoController.zerarEstoqueProduto
);

module.exports = router;
