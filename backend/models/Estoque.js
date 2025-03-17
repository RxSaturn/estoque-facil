const mongoose = require('mongoose');

const estoqueSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },
  local: {
    type: String,
    required: [true, 'Local é obrigatório'],
    trim: true
  },
  quantidade: {
    type: Number,
    required: [true, 'Quantidade é obrigatória'],
    min: 0,
    default: 0
  },
  dataRegistro: {
    type: Date,
    default: Date.now
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  },
  atualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
});

// Índice composto para evitar duplicidade de produto+local
estoqueSchema.index({ produto: 1, local: 1 }, { unique: true });

const Estoque = mongoose.model('Estoque', estoqueSchema);

module.exports = Estoque;