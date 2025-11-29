const { z } = require('zod');

/**
 * Schema para criação de usuário
 * Valida nome, email, senha e perfil
 */
const criarUsuarioSchema = z.object({
  nome: z.string({
    required_error: 'Nome é obrigatório',
    invalid_type_error: 'Nome deve ser uma string'
  })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  email: z.string({
    required_error: 'E-mail é obrigatório',
    invalid_type_error: 'E-mail deve ser uma string'
  })
    .email('E-mail inválido')
    .max(100, 'E-mail deve ter no máximo 100 caracteres')
    .trim()
    .toLowerCase(),

  senha: z.string({
    required_error: 'Senha é obrigatória',
    invalid_type_error: 'Senha deve ser uma string'
  })
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),

  perfil: z.enum(['admin', 'funcionario'], {
    invalid_type_error: 'Perfil deve ser "admin" ou "funcionario"'
  }).default('funcionario')
});

/**
 * Schema para atualização de usuário
 * Permite atualizar nome, email e perfil (sem senha)
 */
const atualizarUsuarioSchema = z.object({
  nome: z.string({
    invalid_type_error: 'Nome deve ser uma string'
  })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  email: z.string({
    invalid_type_error: 'E-mail deve ser uma string'
  })
    .email('E-mail inválido')
    .max(100, 'E-mail deve ter no máximo 100 caracteres')
    .trim()
    .toLowerCase()
    .optional(),

  perfil: z.enum(['admin', 'funcionario'], {
    invalid_type_error: 'Perfil deve ser "admin" ou "funcionario"'
  }).optional()
});

/**
 * Schema para alteração de senha
 * Valida apenas a nova senha
 */
const alterarSenhaSchema = z.object({
  senha: z.string({
    required_error: 'Senha é obrigatória',
    invalid_type_error: 'Senha deve ser uma string'
  })
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
});

/**
 * Schema para validar parâmetros de ID
 * Valida que o ID é um MongoDB ObjectId válido
 */
const idParamSchema = z.object({
  id: z.string({
    required_error: 'ID é obrigatório'
  }).regex(/^[0-9a-fA-F]{24}$/, 'ID inválido')
});

/**
 * Schema para login de usuário
 * Valida email e senha
 */
const loginSchema = z.object({
  email: z.string({
    required_error: 'E-mail é obrigatório',
    invalid_type_error: 'E-mail deve ser uma string'
  })
    .email('E-mail inválido')
    .trim()
    .toLowerCase(),

  senha: z.string({
    required_error: 'Senha é obrigatória',
    invalid_type_error: 'Senha deve ser uma string'
  })
    .min(1, 'Senha é obrigatória')
});

module.exports = {
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  alterarSenhaSchema,
  idParamSchema,
  loginSchema
};
