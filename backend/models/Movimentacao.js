const mongoose = require('mongoose');

const movimentacaoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['entrada', 'saida', 'transferencia', 'venda', 'atualizacao'],
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

// Índices compostos para otimização de relatórios e consultas frequentes
movimentacaoSchema.index({ data: -1, tipo: 1 });
movimentacaoSchema.index({ produto: 1, data: -1 });
movimentacaoSchema.index({ tipo: 1, data: -1 });
movimentacaoSchema.index({ realizadoPor: 1, data: -1 });

const Movimentacao = mongoose.model('Movimentacao', movimentacaoSchema);

module.exports = Movimentacao;
