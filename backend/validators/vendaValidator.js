const { z } = require('zod');

/**
 * Schema de validação para registro de venda
 * Garante que todos os campos obrigatórios estejam presentes e válidos
 */
const registrarVendaSchema = z.object({
  produto: z.string({
    required_error: 'Produto é obrigatório',
    invalid_type_error: 'Produto deve ser um ID válido'
  }).min(1, 'Produto é obrigatório'),
  
  quantidade: z.coerce.number({
    required_error: 'Quantidade é obrigatória',
    invalid_type_error: 'Quantidade deve ser um número'
  }).int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade mínima é 1'),
  
  local: z.string({
    required_error: 'Local é obrigatório',
    invalid_type_error: 'Local deve ser uma string'
  }).min(1, 'Local é obrigatório'),
  
  data: z.string().datetime({ offset: true }).optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  
  observacao: z.string().max(500, 'Observação muito longa (máx 500 caracteres)').optional()
});

/**
 * Valida dados de registro de venda
 * @param {Object} dados - Dados a serem validados
 * @returns {{ success: boolean, data?: Object, error?: Object }} Resultado da validação
 */
const validarRegistroVenda = (dados) => {
  const resultado = registrarVendaSchema.safeParse(dados);
  
  if (!resultado.success) {
    const erros = resultado.error.errors.map(err => ({
      campo: err.path.join('.'),
      mensagem: err.message
    }));
    
    return {
      success: false,
      error: {
        mensagem: erros[0].mensagem,
        erros
      }
    };
  }
  
  return {
    success: true,
    data: resultado.data
  };
};

module.exports = {
  registrarVendaSchema,
  validarRegistroVenda
};
