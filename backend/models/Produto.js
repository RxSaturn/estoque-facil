const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: [true, 'Nome do produto é obrigatório'],
    trim: true
  },
  tipo: {
    type: String,
    required: [true, 'Tipo do produto é obrigatório'],
    trim: true
  },
  categoria: {
    type: String,
    required: [true, 'Categoria do produto é obrigatória'],
    trim: true
  },
  subcategoria: {
    type: String,
    required: [true, 'Subcategoria do produto é obrigatória'],
    trim: true
  },
  imagemUrl: {
    type: String,
    default: '/uploads/default-product.png'
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  // Novos campos
  temEstoqueBaixo: {
    type: Boolean,
    default: false
  },
  temEstoqueCritico: {
    type: Boolean,
    default: false
  },
  temEstoqueEsgotado: {
    type: Boolean,
    default: false
  },
  statusEspecifico: {
    type: Boolean,
    default: false
  }
});

// Índices para facilitar buscas
produtoSchema.index({ nome: 'text', tipo: 'text', categoria: 'text', subcategoria: 'text' });
// Novos índices para as flags de estoque
produtoSchema.index({ temEstoqueBaixo: 1 });
produtoSchema.index({ temEstoqueCritico: 1 });
produtoSchema.index({ temEstoqueEsgotado: 1 });
// Índices para otimização de queries de listagem e filtros
produtoSchema.index({ categoria: 1, updatedAt: -1 });
produtoSchema.index({ tipo: 1, categoria: 1 });
produtoSchema.index({ updatedAt: -1 });

const Produto = mongoose.model('Produto', produtoSchema);

module.exports = Produto;