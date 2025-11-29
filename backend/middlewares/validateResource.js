const { ZodError } = require('zod');

/**
 * Middleware genérico para validação de recursos usando Zod
 * Valida body, params ou query da requisição antes de chegar ao controller
 * 
 * @param {Object} schema - Objeto contendo schemas Zod para validação
 * @param {import('zod').ZodSchema} [schema.body] - Schema para validar o body da requisição
 * @param {import('zod').ZodSchema} [schema.params] - Schema para validar os params da requisição
 * @param {import('zod').ZodSchema} [schema.query] - Schema para validar a query da requisição
 * @returns {Function} Middleware do Express
 */
const validateResource = (schema) => {
  return async (req, res, next) => {
    try {
      // Validar body se schema.body existir
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validar params se schema.params existir
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      // Validar query se schema.query existir
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatar erros do Zod para resposta amigável
        const erros = error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message
        }));

        return res.status(400).json({
          sucesso: false,
          mensagem: erros[0]?.mensagem || 'Dados inválidos',
          erros
        });
      }

      // Se não for erro de validação, passa para o error handler
      next(error);
    }
  };
};

module.exports = validateResource;
