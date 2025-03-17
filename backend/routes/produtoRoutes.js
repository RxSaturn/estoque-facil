const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const { proteger } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `produto-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Rotas de produtos
router.post('/', proteger, upload.single('imagem'), produtoController.criarProduto);
router.get('/', proteger, produtoController.listarProdutos);
router.get('/:id', proteger, produtoController.obterProdutoPorId);
router.put('/:id', proteger, upload.single('imagem'), produtoController.atualizarProduto);
router.delete('/:id', proteger, produtoController.removerProduto);

// NOVA ROTA: Zerar estoque de um produto
router.post('/:id/zerar-estoque', proteger, produtoController.zerarEstoqueProduto);

// Rotas para obter opções de filtro
router.get('/tipos', proteger, (req, res) => {
  // Implementação temporária
  res.json(['Garrafa', 'Lata', 'Caixa', 'Unidade']);
});

router.get('/categorias', proteger, (req, res) => {
  // Implementação temporária
  res.json(['Bebidas', 'Alimentos', 'Limpeza', 'Eletrônicos']);
});

router.get('/subcategorias', proteger, (req, res) => {
  // Implementação temporária
  res.json(['Refrigerantes', 'Cervejas', 'Enlatados', 'Grãos', 'Verde', 'Azul', 'Vermelho']);
});

module.exports = router;