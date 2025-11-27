/**
 * Classe para erros padronizados da API
 */
class ApiError extends Error {
  constructor(statusCode, mensagem) {
    super(mensagem);
    this.statusCode = statusCode;
    this.sucesso = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
