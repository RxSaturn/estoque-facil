const mongoose = require("mongoose");

const localSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  nome: {
    type: String,
    required: [true, "Nome do local é obrigatório"],
    unique: true,
    trim: true,
  },
  descricao: {
    type: String,
    trim: true,
  },
  tipo: {
    type: String,
    enum: ["deposito", "prateleira", "vitrine", "reserva", "outro"],
    default: "outro",
  },
  ativo: {
    type: Boolean,
    default: true,
  },
  dataCriacao: {
    type: Date,
    default: Date.now,
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now,
  },
});

// Middleware para atualizar a data de última atualização
localSchema.pre("save", function (next) {
  this.ultimaAtualizacao = Date.now();
  next();
});

// Índice para busca por nome
localSchema.index({ nome: "text" });

const Local = mongoose.model("Local", localSchema);

module.exports = Local;
