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
  }
});

// Índices para facilitar buscas
produtoSchema.index({ nome: 'text', tipo: 'text', categoria: 'text', subcategoria: 'text' });

const Produto = mongoose.model('Produto', produtoSchema);

module.exports = Produto;