/**
 * Serviço de Vendas - Lógica de negócios transacional
 * @module services/vendaService
 * 
 * Implementa:
 * - Atualizações Atômicas (findOneAndUpdate com $inc) para evitar race conditions
 * - Transações MongoDB para garantir integridade ACID
 */

const mongoose = require('mongoose');
const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Movimentacao = require('../models/Movimentacao');
const Venda = require('../models/Venda');
const ApiError = require('../utils/ApiError');

/**
 * Registra uma venda com atualização atômica do estoque
 * Resolve o problema de race condition usando $inc atômico
 * 
 * @param {Object} dadosVenda - Dados da venda
 * @param {string} dadosVenda.produto - ID do produto (ObjectId)
 * @param {number} dadosVenda.quantidade - Quantidade a vender
 * @param {string} dadosVenda.local - Local do estoque
 * @param {Date} [dadosVenda.data] - Data da venda (opcional)
 * @param {string} [dadosVenda.observacao] - Observação da venda
 * @param {string} dadosVenda.usuarioId - ID do usuário que registra
 * @returns {Promise<Object>} Resultado da venda
 */
const registrarVendaAtomico = async (dadosVenda) => {
  const { produto, quantidade, local, data, observacao, usuarioId } = dadosVenda;
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Atualização atômica: decrementa estoque apenas se houver quantidade suficiente
    // Isso resolve a race condition - a operação é atômica no MongoDB
    const estoqueAtualizado = await Estoque.findOneAndUpdate(
      { 
        produto: produto,
        local: local,
        quantidade: { $gte: quantidade } // Só atualiza se houver estoque suficiente
      },
      {
        $inc: { quantidade: -quantidade },
        $set: { 
          ultimaAtualizacao: new Date(),
          atualizadoPor: usuarioId
        }
      },
      { 
        new: true, // Retorna o documento atualizado
        session 
      }
    );
    
    // Se não encontrou ou não tinha estoque suficiente
    if (!estoqueAtualizado) {
      // Verificar se o estoque existe para dar mensagem apropriada
      const estoqueExistente = await Estoque.findOne({ produto, local }).session(session);
      
      if (!estoqueExistente) {
        throw new ApiError(400, `Não há estoque cadastrado para este produto no local ${local}`);
      }
      
      throw new ApiError(400, 
        `Estoque insuficiente. Disponível: ${estoqueExistente.quantidade}, Solicitado: ${quantidade}`
      );
    }
    
    // Registrar a venda
    const dataVenda = data ? new Date(data) : new Date();
    const [venda] = await Venda.create([{
      produto,
      quantidade,
      local,
      dataVenda,
      registradoPor: usuarioId
    }], { session });
    
    // Registrar movimentação
    await Movimentacao.create([{
      tipo: 'venda',
      produto,
      quantidade,
      localOrigem: local,
      data: dataVenda,
      realizadoPor: usuarioId,
      observacao: observacao || 'Venda de produto'
    }], { session });
    
    // Commit da transação
    await session.commitTransaction();
    
    return {
      sucesso: true,
      mensagem: 'Venda registrada com sucesso',
      venda,
      estoqueRestante: estoqueAtualizado.quantidade
    };
    
  } catch (error) {
    await session.abortTransaction();
    
    // Re-throw ApiErrors sem modificação
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Log de erros de transação para debugging
    console.error('Erro ao registrar venda (transação):', {
      message: error.message,
      code: error.code,
      produto,
      local,
      quantidade
    });
    
    throw new ApiError(500, 'Erro ao processar venda. Tente novamente.');
    
  } finally {
    session.endSession();
  }
};

module.exports = {
  registrarVendaAtomico
};
