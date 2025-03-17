const mongoose = require('mongoose');

const movimentacaoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['entrada', 'saida', 'transferencia', 'venda'],
    required: true
  },
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
  localOrigem: {
    type: String,
    required: true
  },
  localDestino: {
    type: String,
    required: function() {
      return this.tipo === 'transferencia';
    }
  },
  data: {
    type: Date,
    default: Date.now
  },
  realizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  observacao: {
    type: String,
    trim: true
  }
});

const Movimentacao = mongoose.model('Movimentacao', movimentacaoSchema);

module.exports = Movimentacao;