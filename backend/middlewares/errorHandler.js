const ApiError = require('../utils/ApiError');

/**
 * Middleware para tratamento centralizado de erros
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let mensagem = err.message || 'Erro interno do servidor';

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const erros = Object.values(err.errors).map(e => e.message);
    mensagem = erros.join('. ');
  }

  // Erro de chave duplicada do MongoDB (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const campo = Object.keys(err.keyValue)[0];
    mensagem = `Já existe um registro com este ${campo}`;
  }

  // Erro de JWT inválido
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    mensagem = 'Token inválido';
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    mensagem = 'Token expirado';
  }

  // Erro de CastError (ID inválido no MongoDB)
  if (err.name === 'CastError') {
    statusCode = 400;
    mensagem = 'ID inválido';
  }

  // Log do erro em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('Erro:', err);
  }

  res.status(statusCode).json({
    sucesso: false,
    mensagem,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
