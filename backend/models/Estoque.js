const mongoose = require('mongoose');

// Define constantes de nível de estoque
const NIVEL_ESTOQUE = {
  NORMAL: 'normal',
  BAIXO: 'baixo',    // Menos de 20 unidades
  CRITICO: 'critico', // Menos de 10 unidades
  ESGOTADO: 'esgotado' // 0 unidades
};

// Define limites para cada nível
const LIMITE_ESTOQUE = {
  BAIXO: 20,
  CRITICO: 10
};

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

// Adiciona método para calcular o status do estoque
estoqueSchema.methods.calcularStatus = function() {
  if (this.quantidade <= 0) {
    return NIVEL_ESTOQUE.ESGOTADO;
  } else if (this.quantidade < LIMITE_ESTOQUE.CRITICO) {
    return NIVEL_ESTOQUE.CRITICO;
  } else if (this.quantidade < LIMITE_ESTOQUE.BAIXO) {
    return NIVEL_ESTOQUE.BAIXO;
  } else {
    return NIVEL_ESTOQUE.NORMAL;
  }
};

// Adiciona campo virtual para status do estoque
estoqueSchema.virtual('status').get(function() {
  return this.calcularStatus();
});

// Expor as constantes no modelo
estoqueSchema.statics.NIVEL_ESTOQUE = NIVEL_ESTOQUE;
estoqueSchema.statics.LIMITE_ESTOQUE = LIMITE_ESTOQUE;

// Garantir que virtuais sejam incluídos em toJSON e toObject
estoqueSchema.set('toJSON', { virtuals: true });
estoqueSchema.set('toObject', { virtuals: true });

// Índice composto para evitar duplicidade de produto+local
estoqueSchema.index({ produto: 1, local: 1 }, { unique: true });
// Índice adicional para consultas por quantidade
estoqueSchema.index({ quantidade: 1 });

const Estoque = mongoose.model('Estoque', estoqueSchema);

module.exports = Estoque;
