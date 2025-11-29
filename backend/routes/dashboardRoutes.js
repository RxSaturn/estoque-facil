/**
 * Dashboard Routes - Rotas otimizadas para o dashboard
 * @module routes/dashboardRoutes
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { proteger } = require('../middlewares/auth');

// Aplicar autenticação em todas as rotas
router.use(proteger);

/**
 * @route GET /api/dashboard/metrics
 * @desc Obtém todas as métricas do dashboard em uma única chamada
 * @access Private
 */
router.get('/metrics', dashboardController.getMetrics);

/**
 * @route GET /api/dashboard/products
 * @desc Obtém estatísticas de produtos
 * @access Private
 */
router.get('/products', dashboardController.getProductStats);

/**
 * @route GET /api/dashboard/sales
 * @desc Obtém estatísticas de vendas do dia
 * @access Private
 */
router.get('/sales', dashboardController.getSalesStats);

/**
 * @route GET /api/dashboard/top-products
 * @desc Obtém top produtos vendidos
 * @access Private
 */
router.get('/top-products', dashboardController.getTopProducts);

/**
 * @route GET /api/dashboard/low-stock
 * @desc Obtém produtos com estoque baixo
 * @access Private
 */
router.get('/low-stock', dashboardController.getLowStock);

/**
 * @route GET /api/dashboard/categories
 * @desc Obtém distribuição por categorias
 * @access Private
 */
router.get('/categories', dashboardController.getCategoryDistribution);

/**
 * @route GET /api/dashboard/transactions
 * @desc Obtém movimentações recentes
 * @access Private
 */
router.get('/transactions', dashboardController.getRecentTransactions);

module.exports = router;
