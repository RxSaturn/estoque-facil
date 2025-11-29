const rateLimit = require('express-rate-limit');

// Limite geral da API - 300 requisições por 15 minutos por IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  message: {
    sucesso: false,
    mensagem: 'Muitas requisições deste IP. Por favor, tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limite para rotas de autenticação - 10 tentativas por 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas de login. Por favor, tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limite para rotas de relatórios - 10 requisições por minuto
const relatorioLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: {
    sucesso: false,
    mensagem: 'Muitas requisições de relatórios. Por favor, aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limite para geração de PDF - 5 requisições por 5 minutos
const pdfLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5,
  message: {
    sucesso: false,
    mensagem: 'Muitas requisições de geração de PDF. Por favor, tente novamente em 5 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limite para recuperação de senha - 5 tentativas por hora
const recuperacaoSenhaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas de recuperação de senha. Por favor, tente novamente em 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limite para rotas de dashboard - 120 requisições por minuto
// Dashboard carrega múltiplos widgets simultaneamente
const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 120,
  message: {
    sucesso: false,
    mensagem: 'Muitas requisições ao dashboard. Por favor, aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  relatorioLimiter,
  pdfLimiter,
  recuperacaoSenhaLimiter,
  dashboardLimiter
};
