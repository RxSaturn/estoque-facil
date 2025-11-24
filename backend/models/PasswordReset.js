const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  dataExpiracao: {
    type: Date,
    required: true,
    default: function() {
      // Token expira em 1 hora
      return new Date(Date.now() + 3600000);
    }
  },
  usado: {
    type: Boolean,
    default: false
  }
});

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;