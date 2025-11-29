/**
 * Produto Service - Operações complexas de produtos
 * @module services/produtoService
 */

const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Movimentacao = require('../models/Movimentacao');
const Venda = require('../models/Venda');
const mongoose = require('mongoose');

/**
 * Obtém estatísticas completas de um produto
 * @param {string} produtoId - ID do produto
 * @returns {Promise<Object>} Estatísticas do produto
 */
const getProductStats = async (produtoId) => {
  try {
    const produto = await Produto.findById(produtoId).lean();
    if (!produto) {
      throw new Error('Produto não encontrado');
    }

    // Buscar dados em paralelo
    const [estoques, movimentacoes, vendas] = await Promise.all([
      Estoque.find({ produto: produtoId }).lean(),
      Movimentacao.find({ produto: produtoId }).sort({ data: -1 }).limit(10).lean(),
      Venda.find({ produto: produtoId }).sort({ dataVenda: -1 }).limit(10).lean()
    ]);

    const estoqueTotal = estoques.reduce((sum, e) => sum + e.quantidade, 0);
    const totalVendas = await Venda.countDocuments({ produto: produtoId });
    const totalMovimentacoes = await Movimentacao.countDocuments({ produto: produtoId });

    return {
      produto,
      estoques,
      estoqueTotal,
      totalVendas,
      totalMovimentacoes,
      ultimasMovimentacoes: movimentacoes,
      ultimasVendas: vendas
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas do produto:', error);
    throw error;
  }
};

/**
 * Valida se há estoque suficiente para uma operação
 * @param {string} produtoId - ID do produto
 * @param {string} local - Local do estoque
 * @param {number} quantidade - Quantidade necessária
 * @returns {Promise<Object>} Resultado da validação
 */
const validateStockAvailability = async (produtoId, local, quantidade) => {
  try {
    const estoque = await Estoque.findOne({ produto: produtoId, local }).lean();
    
    if (!estoque) {
      return {
        disponivel: false,
        estoqueAtual: 0,
        mensagem: 'Produto não encontrado neste local'
      };
    }

    const disponivel = estoque.quantidade >= quantidade;
    
    return {
      disponivel,
      estoqueAtual: estoque.quantidade,
      quantidadeSolicitada: quantidade,
      mensagem: disponivel 
        ? 'Estoque disponível'
        : `Estoque insuficiente. Disponível: ${estoque.quantidade}, Solicitado: ${quantidade}`
    };
  } catch (error) {
    console.error('Erro ao validar disponibilidade de estoque:', error);
    throw error;
  }
};

/**
 * Registra uma venda com transação MongoDB
 * @param {Object} dadosVenda - Dados da venda
 * @param {string} dadosVenda.produtoId - ID do produto
 * @param {string} dadosVenda.local - Local de saída
 * @param {number} dadosVenda.quantidade - Quantidade vendida
 * @param {string} dadosVenda.usuarioId - ID do usuário
 * @param {string} [dadosVenda.observacao] - Observação opcional
 * @returns {Promise<Object>} Resultado da venda
 */
const registrarVenda = async (dadosVenda) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { produtoId, local, quantidade, usuarioId, observacao } = dadosVenda;

    // Validar estoque
    const validacao = await validateStockAvailability(produtoId, local, quantidade);
    if (!validacao.disponivel) {
      throw new Error(validacao.mensagem);
    }

    // Atualizar estoque
    const estoque = await Estoque.findOne({ produto: produtoId, local }).session(session);
    estoque.quantidade -= quantidade;
    estoque.ultimaAtualizacao = new Date();
    estoque.atualizadoPor = usuarioId;
    await estoque.save({ session });

    // Registrar venda
    const venda = await Venda.create([{
      produto: produtoId,
      quantidade,
      local,
      dataVenda: new Date(),
      realizadoPor: usuarioId,
      observacao
    }], { session });

    // Registrar movimentação
    await Movimentacao.create([{
      tipo: 'venda',
      produto: produtoId,
      quantidade,
      localOrigem: local,
      data: new Date(),
      realizadoPor: usuarioId,
      observacao: observacao || 'Venda registrada'
    }], { session });

    await session.commitTransaction();

    return {
      sucesso: true,
      venda: venda[0],
      estoqueRestante: estoque.quantidade,
      mensagem: 'Venda registrada com sucesso'
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Erro ao registrar venda:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Registra entrada de estoque com transação MongoDB
 * @param {Object} dadosEntrada - Dados da entrada
 * @returns {Promise<Object>} Resultado da entrada
 */
const registrarEntrada = async (dadosEntrada) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { produtoId, local, quantidade, usuarioId, observacao } = dadosEntrada;

    // Buscar ou criar registro de estoque
    let estoque = await Estoque.findOne({ produto: produtoId, local }).session(session);
    
    if (estoque) {
      estoque.quantidade += quantidade;
      estoque.ultimaAtualizacao = new Date();
      estoque.atualizadoPor = usuarioId;
      await estoque.save({ session });
    } else {
      estoque = await Estoque.create([{
        produto: produtoId,
        local,
        quantidade,
        dataRegistro: new Date(),
        ultimaAtualizacao: new Date(),
        atualizadoPor: usuarioId
      }], { session });
      estoque = estoque[0];
    }

    // Registrar movimentação
    await Movimentacao.create([{
      tipo: 'entrada',
      produto: produtoId,
      quantidade,
      localOrigem: local,
      data: new Date(),
      realizadoPor: usuarioId,
      observacao: observacao || 'Entrada de estoque'
    }], { session });

    await session.commitTransaction();

    return {
      sucesso: true,
      estoqueAtual: estoque.quantidade,
      mensagem: 'Entrada registrada com sucesso'
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Erro ao registrar entrada:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Realiza transferência entre locais com transação MongoDB
 * @param {Object} dadosTransferencia - Dados da transferência
 * @returns {Promise<Object>} Resultado da transferência
 */
const realizarTransferencia = async (dadosTransferencia) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { produtoId, localOrigem, localDestino, quantidade, usuarioId, observacao } = dadosTransferencia;

    // Validar estoque origem
    const validacao = await validateStockAvailability(produtoId, localOrigem, quantidade);
    if (!validacao.disponivel) {
      throw new Error(validacao.mensagem);
    }

    // Atualizar estoque origem
    const estoqueOrigem = await Estoque.findOne({ produto: produtoId, local: localOrigem }).session(session);
    estoqueOrigem.quantidade -= quantidade;
    estoqueOrigem.ultimaAtualizacao = new Date();
    estoqueOrigem.atualizadoPor = usuarioId;
    await estoqueOrigem.save({ session });

    // Atualizar ou criar estoque destino
    let estoqueDestino = await Estoque.findOne({ produto: produtoId, local: localDestino }).session(session);
    
    if (estoqueDestino) {
      estoqueDestino.quantidade += quantidade;
      estoqueDestino.ultimaAtualizacao = new Date();
      estoqueDestino.atualizadoPor = usuarioId;
      await estoqueDestino.save({ session });
    } else {
      estoqueDestino = await Estoque.create([{
        produto: produtoId,
        local: localDestino,
        quantidade,
        dataRegistro: new Date(),
        ultimaAtualizacao: new Date(),
        atualizadoPor: usuarioId
      }], { session });
      estoqueDestino = estoqueDestino[0];
    }

    // Registrar movimentação
    await Movimentacao.create([{
      tipo: 'transferencia',
      produto: produtoId,
      quantidade,
      localOrigem,
      localDestino,
      data: new Date(),
      realizadoPor: usuarioId,
      observacao: observacao || 'Transferência entre locais'
    }], { session });

    await session.commitTransaction();

    return {
      sucesso: true,
      estoqueOrigem: estoqueOrigem.quantidade,
      estoqueDestino: estoqueDestino.quantidade,
      mensagem: 'Transferência realizada com sucesso'
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Erro ao realizar transferência:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Busca produtos com filtros avançados
 * @param {Object} filtros - Filtros de busca
 * @returns {Promise<Object>} Produtos encontrados com paginação
 */
const searchProducts = async (filtros) => {
  try {
    const {
      busca,
      tipo,
      categoria,
      subcategoria,
      estoqueStatus,
      page = 1,
      limit = 20
    } = filtros;

    const query = {};

    if (busca) {
      query.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { id: { $regex: busca, $options: 'i' } },
        { categoria: { $regex: busca, $options: 'i' } }
      ];
    }

    if (tipo) query.tipo = tipo;
    if (categoria) query.categoria = categoria;
    if (subcategoria) query.subcategoria = subcategoria;

    // Filtro por status de estoque
    if (estoqueStatus) {
      switch (estoqueStatus) {
        case 'baixo':
          query.temEstoqueBaixo = true;
          break;
        case 'critico':
          query.temEstoqueCritico = true;
          break;
        case 'esgotado':
          query.temEstoqueEsgotado = true;
          break;
      }
    }

    const [total, produtos] = await Promise.all([
      Produto.countDocuments(query),
      Produto.find(query)
        .select('id nome categoria tipo subcategoria imagemUrl dataCriacao temEstoqueBaixo temEstoqueCritico temEstoqueEsgotado')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    return {
      sucesso: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      produtos
    };
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

module.exports = {
  getProductStats,
  validateStockAvailability,
  registrarVenda,
  registrarEntrada,
  realizarTransferencia,
  searchProducts
};
