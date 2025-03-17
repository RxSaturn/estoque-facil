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

const Venda = mongoose.model('Venda', vendaSchema);

module.exports = Venda;