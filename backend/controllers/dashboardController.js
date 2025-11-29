/**
 * Dashboard Controller - Endpoints otimizados do dashboard
 * @module controllers/dashboardController
 */

const dashboardService = require('../services/dashboardService');

/**
 * Obtém métricas consolidadas do dashboard
 * GET /api/dashboard/metrics
 */
exports.getMetrics = async (req, res) => {
  try {
    const metrics = await dashboardService.getDashboardMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Erro ao obter métricas do dashboard:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter métricas do dashboard',
      erro: error.message
    });
  }
};

/**
 * Obtém estatísticas de produtos
 * GET /api/dashboard/products
 */
exports.getProductStats = async (req, res) => {
  try {
    const stats = await dashboardService.getProductStats();
    res.status(200).json({
      sucesso: true,
      ...stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de produtos:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter estatísticas de produtos',
      erro: error.message
    });
  }
};

/**
 * Obtém estatísticas de vendas
 * GET /api/dashboard/sales
 */
exports.getSalesStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const stats = await dashboardService.getSalesStats(startOfDay, endOfDay);
    res.status(200).json({
      sucesso: true,
      ...stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de vendas:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter estatísticas de vendas',
      erro: error.message
    });
  }
};

/**
 * Obtém top produtos vendidos
 * GET /api/dashboard/top-products
 */
exports.getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const topProducts = await dashboardService.getTopProducts(limit);
    res.status(200).json({
      sucesso: true,
      produtos: topProducts
    });
  } catch (error) {
    console.error('Erro ao obter top produtos:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter top produtos',
      erro: error.message
    });
  }
};

/**
 * Obtém produtos com estoque baixo
 * GET /api/dashboard/low-stock
 */
exports.getLowStock = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const lowStock = await dashboardService.getLowStockProducts(limit);
    res.status(200).json({
      sucesso: true,
      produtos: lowStock
    });
  } catch (error) {
    console.error('Erro ao obter produtos com estoque baixo:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter produtos com estoque baixo',
      erro: error.message
    });
  }
};

/**
 * Obtém distribuição por categorias
 * GET /api/dashboard/categories
 */
exports.getCategoryDistribution = async (req, res) => {
  try {
    const distribution = await dashboardService.getCategoryDistribution();
    res.status(200).json({
      sucesso: true,
      categorias: distribution
    });
  } catch (error) {
    console.error('Erro ao obter distribuição por categorias:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter distribuição por categorias',
      erro: error.message
    });
  }
};

/**
 * Obtém movimentações recentes
 * GET /api/dashboard/transactions
 */
exports.getRecentTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const transactions = await dashboardService.getRecentTransactions(limit);
    res.status(200).json({
      sucesso: true,
      movimentacoes: transactions
    });
  } catch (error) {
    console.error('Erro ao obter movimentações recentes:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter movimentações recentes',
      erro: error.message
    });
  }
};
