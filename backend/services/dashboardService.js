/**
 * Dashboard Service - Métricas agregadas do dashboard
 * @module services/dashboardService
 */

const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Venda = require('../models/Venda');
const Movimentacao = require('../models/Movimentacao');
const {
  getCategoryDistributionPipeline,
  getStockByLocationPipeline,
  getLowStockPipeline,
  getDailySalesPipeline,
  getSalesByPeriodPipeline,
  getTopProductsPipeline,
  getRecentMovementsPipeline,
  getStockStatsPipeline
} = require('../utils/aggregations');

/**
 * Obtém métricas consolidadas do dashboard em uma única chamada
 * Usa Promise.all para consultas paralelas otimizando performance
 * @returns {Promise<Object>} Métricas consolidadas
 */
const getDashboardMetrics = async () => {
  try {
    // Calcular datas para filtros
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Início da semana (domingo)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Início do mês
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    
    // Últimos 3 meses para top produtos
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Limites de estoque
    const limites = Estoque.LIMITE_ESTOQUE || { CRITICO: 10, BAIXO: 20 };

    // Executar todas as consultas em paralelo
    const [
      totalProdutos,
      estoqueStats,
      vendasHoje,
      vendasSemana,
      vendasMes,
      topProdutos,
      produtosBaixoEstoque,
      distribuicaoCategorias,
      estoquePorLocal,
      movimentacoesRecentes
    ] = await Promise.all([
      // Total de produtos cadastrados
      Produto.countDocuments(),
      
      // Estatísticas do estoque
      Estoque.aggregate(getStockStatsPipeline()),
      
      // Vendas do dia
      Venda.aggregate(getDailySalesPipeline(startOfDay, endOfDay)),
      
      // Vendas da semana
      Venda.aggregate(getDailySalesPipeline(startOfWeek, endOfDay)),
      
      // Vendas do mês
      Venda.aggregate(getDailySalesPipeline(startOfMonth, endOfDay)),
      
      // Top 5 produtos mais vendidos (últimos 3 meses)
      Venda.aggregate(getTopProductsPipeline(threeMonthsAgo, endOfDay, 5)),
      
      // Produtos com estoque baixo (top 5)
      Estoque.aggregate(getLowStockPipeline(limites, 5)),
      
      // Distribuição por categoria
      Produto.aggregate(getCategoryDistributionPipeline()),
      
      // Estoque por local
      Estoque.aggregate(getStockByLocationPipeline()),
      
      // Movimentações recentes
      Movimentacao.aggregate(getRecentMovementsPipeline(8))
    ]);

    // Processar resultados
    const estoqueInfo = estoqueStats[0] || { totalItens: 0, totalRegistros: 0, mediaQuantidade: 0 };
    const vendasHojeInfo = vendasHoje[0] || { totalVendas: 0, totalQuantidade: 0, valorTotal: 0 };
    const vendasSemanaInfo = vendasSemana[0] || { totalVendas: 0, totalQuantidade: 0, valorTotal: 0 };
    const vendasMesInfo = vendasMes[0] || { totalVendas: 0, totalQuantidade: 0, valorTotal: 0 };

    return {
      sucesso: true,
      timestamp: new Date().toISOString(),
      metricas: {
        totalProdutos,
        valorTotalEstoque: estoqueInfo.totalItens,
        totalRegistrosEstoque: estoqueInfo.totalRegistros,
        mediaQuantidadeEstoque: Math.round(estoqueInfo.mediaQuantidade * 100) / 100
      },
      vendas: {
        hoje: vendasHojeInfo.totalVendas,
        semana: vendasSemanaInfo.totalVendas,
        mes: vendasMesInfo.totalVendas,
        quantidadeHoje: vendasHojeInfo.totalQuantidade,
        quantidadeSemana: vendasSemanaInfo.totalQuantidade,
        quantidadeMes: vendasMesInfo.totalQuantidade
      },
      topProdutos: topProdutos.map(p => ({
        id: p._id,
        nome: p.nome,
        categoria: p.categoria,
        quantidadeVendas: p.quantidadeVendas
      })),
      alertasEstoque: produtosBaixoEstoque.map(p => ({
        id: p.produto,
        produtoId: p.produtoId,
        nome: p.produtoNome,
        local: p.local,
        quantidade: p.quantidade,
        status: p.status
      })),
      distribuicaoCategorias: distribuicaoCategorias.map(c => ({
        nome: c.nome,
        quantidade: c.quantidade
      })),
      estoquePorLocal: estoquePorLocal.map(l => ({
        local: l.local,
        quantidade: l.quantidade
      })),
      movimentacoesRecentes: movimentacoesRecentes.map(m => ({
        id: m._id,
        tipo: m.tipo,
        quantidade: m.quantidade,
        localOrigem: m.localOrigem,
        localDestino: m.localDestino,
        data: m.data,
        produtoNome: m.produtoNome,
        produtoId: m.produtoId
      }))
    };
  } catch (error) {
    console.error('Erro ao obter métricas do dashboard:', error);
    throw error;
  }
};

/**
 * Obtém estatísticas de produtos
 * @returns {Promise<Object>} Estatísticas de produtos
 */
const getProductStats = async () => {
  try {
    const [total, estoqueAgregado] = await Promise.all([
      Produto.countDocuments(),
      Estoque.aggregate([
        { $group: { _id: null, quantidadeTotal: { $sum: '$quantidade' } } }
      ])
    ]);

    const quantidadeTotal = estoqueAgregado.length > 0 ? estoqueAgregado[0].quantidadeTotal : 0;

    return { total, quantidadeTotal };
  } catch (error) {
    console.error('Erro ao obter estatísticas de produtos:', error);
    throw error;
  }
};

/**
 * Obtém estatísticas de vendas para um período específico
 * @param {Date} startDate - Data de início
 * @param {Date} endDate - Data de fim
 * @returns {Promise<Object>} Estatísticas de vendas
 */
const getSalesStats = async (startDate, endDate) => {
  try {
    const [vendas, movimentacoesVenda] = await Promise.all([
      Venda.aggregate(getDailySalesPipeline(startDate, endDate)),
      Movimentacao.countDocuments({
        tipo: 'venda',
        data: { $gte: startDate, $lte: endDate }
      })
    ]);

    const vendasInfo = vendas[0] || { totalVendas: 0, totalQuantidade: 0, valorTotal: 0 };

    return {
      vendasHoje: vendasInfo.totalVendas || movimentacoesVenda,
      quantidadeVendida: vendasInfo.totalQuantidade,
      valorTotal: vendasInfo.valorTotal,
      tendenciaVendas: 0 // Pode ser calculado comparando com período anterior
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de vendas:', error);
    throw error;
  }
};

/**
 * Obtém top produtos vendidos
 * @param {number} limit - Número máximo de produtos
 * @returns {Promise<Array>} Lista de top produtos
 */
const getTopProducts = async (limit = 5) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const now = new Date();

    const topProdutos = await Venda.aggregate(getTopProductsPipeline(threeMonthsAgo, now, limit));

    return topProdutos.map(p => ({
      id: p._id,
      nome: p.nome,
      quantidadeVendas: p.quantidadeVendas
    }));
  } catch (error) {
    console.error('Erro ao obter top produtos:', error);
    throw error;
  }
};

/**
 * Obtém produtos com estoque baixo
 * @param {number} limit - Número máximo de produtos
 * @returns {Promise<Array>} Lista de produtos com estoque baixo
 */
const getLowStockProducts = async (limit = 10) => {
  try {
    const limites = Estoque.LIMITE_ESTOQUE || { CRITICO: 10, BAIXO: 20 };
    const produtos = await Estoque.aggregate(getLowStockPipeline(limites, limit));

    return produtos.map(p => ({
      id: p.produto,
      nome: p.produtoNome,
      local: p.local,
      estoqueAtual: p.quantidade,
      estoqueMinimo: limites.BAIXO,
      status: p.status
    }));
  } catch (error) {
    console.error('Erro ao obter produtos com estoque baixo:', error);
    throw error;
  }
};

/**
 * Obtém distribuição por categorias
 * @returns {Promise<Array>} Distribuição por categorias
 */
const getCategoryDistribution = async () => {
  try {
    return await Produto.aggregate(getCategoryDistributionPipeline());
  } catch (error) {
    console.error('Erro ao obter distribuição por categorias:', error);
    throw error;
  }
};

/**
 * Obtém movimentações recentes
 * @param {number} limit - Número máximo de movimentações
 * @returns {Promise<Array>} Lista de movimentações recentes
 */
const getRecentTransactions = async (limit = 8) => {
  try {
    const movimentacoes = await Movimentacao.aggregate(getRecentMovementsPipeline(limit));

    return movimentacoes.map(m => ({
      id: m._id,
      tipo: m.tipo,
      quantidade: m.quantidade,
      localOrigem: m.localOrigem,
      localDestino: m.localDestino,
      data: m.data,
      produtoNome: m.produtoNome,
      produto: { nome: m.produtoNome, id: m.produtoId }
    }));
  } catch (error) {
    console.error('Erro ao obter movimentações recentes:', error);
    throw error;
  }
};

module.exports = {
  getDashboardMetrics,
  getProductStats,
  getSalesStats,
  getTopProducts,
  getLowStockProducts,
  getCategoryDistribution,
  getRecentTransactions
};
