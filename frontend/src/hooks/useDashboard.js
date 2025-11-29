/**
 * useDashboard - Hook para métricas do dashboard
 * Utiliza TanStack Query para gerenciamento de estado do servidor
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Chaves de query para cache
const QUERY_KEYS = {
  metrics: ['dashboard-metrics'],
  products: ['dashboard-products'],
  sales: ['dashboard-sales'],
  topProducts: ['dashboard-top-products'],
  lowStock: ['dashboard-low-stock'],
  categories: ['dashboard-categories'],
  transactions: ['dashboard-transactions']
};

// Configuração padrão para queries do dashboard
const defaultConfig = {
  staleTime: 1000 * 60 * 5, // 5 minutos
  gcTime: 1000 * 60 * 10, // 10 minutos
  refetchOnWindowFocus: false,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
};

/**
 * Hook para obter todas as métricas do dashboard em uma única chamada
 */
export const useDashboardMetrics = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.metrics,
    queryFn: async () => {
      const response = await api.get('/api/dashboard/metrics');
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para estatísticas de produtos
 */
export const useProductStats = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: async () => {
      const response = await api.get('/api/dashboard/products');
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para estatísticas de vendas
 */
export const useSalesStats = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.sales,
    queryFn: async () => {
      const response = await api.get('/api/dashboard/sales');
      return response.data;
    },
    ...defaultConfig,
    staleTime: 1000 * 60 * 2, // 2 minutos - vendas atualizam mais frequentemente
    ...options
  });
};

/**
 * Hook para top produtos vendidos
 */
export const useTopProducts = (limit = 5, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.topProducts, limit],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/top-products', {
        params: { limit }
      });
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para produtos com estoque baixo
 */
export const useLowStock = (limit = 10, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.lowStock, limit],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/low-stock', {
        params: { limit }
      });
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para distribuição por categorias
 */
export const useCategoryDistribution = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async () => {
      const response = await api.get('/api/dashboard/categories');
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para movimentações recentes
 */
export const useRecentTransactions = (limit = 8, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.transactions, limit],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/transactions', {
        params: { limit }
      });
      return response.data;
    },
    ...defaultConfig,
    staleTime: 1000 * 60 * 2, // 2 minutos
    ...options
  });
};

/**
 * Hook para invalidar cache do dashboard
 */
export const useRefreshDashboard = () => {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    Object.values(QUERY_KEYS).forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };

  const refreshMetrics = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics });
  };

  return {
    refreshAll,
    refreshMetrics
  };
};

export default {
  useDashboardMetrics,
  useProductStats,
  useSalesStats,
  useTopProducts,
  useLowStock,
  useCategoryDistribution,
  useRecentTransactions,
  useRefreshDashboard
};
