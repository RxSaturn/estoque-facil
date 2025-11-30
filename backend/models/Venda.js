const mongoose = require('mongoose');

const vendaSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 1
  },
  local: {
    type: String,
    required: true,
    trim: true
  },
  dataVenda: {
    type: Date,
    default: Date.now,
    required: true
  },
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
});

// Índices para otimização de queries de relatórios
vendaSchema.index({ dataVenda: -1, produto: 1 });
vendaSchema.index({ produto: 1, dataVenda: -1 });
// Compound index for queries filtering by dataVenda and local
vendaSchema.index({ dataVenda: -1, local: 1, produto: 1 });

const Venda = mongoose.model('Venda', vendaSchema);

module.exports = Venda;