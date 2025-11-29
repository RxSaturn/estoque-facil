/**
 * useEstoque - Hook para operações de estoque
 * Utiliza TanStack Query para gerenciamento de estado do servidor
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-toastify';

// Chaves de query para cache
const QUERY_KEYS = {
  estoque: ['estoque'],
  estoqueByProduto: (produtoId) => ['estoque', 'produto', produtoId],
  estoqueByLocal: (local) => ['estoque', 'local', local],
  locais: ['estoque-locais'],
  estoqueBaixo: ['estoque-baixo'],
  estoqueCritico: ['estoque-critico'],
  estatisticas: ['estoque-estatisticas']
};

// Configuração padrão para queries
const defaultConfig = {
  staleTime: 1000 * 60 * 3, // 3 minutos
  gcTime: 1000 * 60 * 10, // 10 minutos
  refetchOnWindowFocus: false,
  retry: 2
};

/**
 * Hook para listar todo o estoque com paginação
 */
export const useEstoque = (filtros = {}, options = {}) => {
  const { page = 1, limit = 20, produto, local, status } = filtros;

  return useQuery({
    queryKey: [...QUERY_KEYS.estoque, { page, limit, produto, local, status }],
    queryFn: async () => {
      const params = { page, limit };
      if (produto) params.produto = produto;
      if (local) params.local = local;
      if (status) params.status = status;

      const response = await api.get('/api/estoque', { params });
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para verificar estoque de um produto em um local
 */
export const useVerificarEstoque = (produtoId, local, options = {}) => {
  return useQuery({
    queryKey: ['verificar-estoque', produtoId, local],
    queryFn: async () => {
      const response = await api.get('/api/estoque/verificar', {
        params: { produto: produtoId, local }
      });
      return response.data;
    },
    enabled: !!produtoId && !!local,
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para listar locais de estoque
 */
export const useLocais = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.locais,
    queryFn: async () => {
      const response = await api.get('/api/estoque/locais');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos - locais mudam raramente
    ...options
  });
};

/**
 * Hook para produtos com estoque baixo
 */
export const useEstoqueBaixo = (filtros = {}, options = {}) => {
  const { nivel = 'todos', local, page = 1, limit = 10 } = filtros;

  return useQuery({
    queryKey: [...QUERY_KEYS.estoqueBaixo, { nivel, local, page, limit }],
    queryFn: async () => {
      const response = await api.get('/api/estoque/produtos-baixo-estoque', {
        params: { nivel, local, page, limit }
      });
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para produtos com estoque crítico
 */
export const useEstoqueCritico = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.estoqueCritico,
    queryFn: async () => {
      const response = await api.get('/api/estoque/estoque-critico');
      return response.data;
    },
    ...defaultConfig,
    staleTime: 1000 * 60 * 2, // 2 minutos - mais frequente por ser crítico
    ...options
  });
};

/**
 * Hook para estatísticas de estoque
 */
export const useEstoqueStats = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.estatisticas,
    queryFn: async () => {
      const response = await api.get('/api/estoque/estatisticas');
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para transferir estoque entre locais
 */
export const useTransferirEstoque = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dadosTransferencia) => {
      const response = await api.post('/api/estoque/transferir', dadosTransferencia);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoque });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoqueBaixo });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoqueCritico });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estatisticas });
      toast.success('Transferência realizada com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao realizar transferência';
      toast.error(message);
    }
  });
};

/**
 * Hook para registrar entrada de estoque
 */
export const useRegistrarEntrada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dadosEntrada) => {
      const response = await api.post('/api/movimentacoes/entrada', dadosEntrada);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoque });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoqueBaixo });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoqueCritico });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estatisticas });
      toast.success('Entrada registrada com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao registrar entrada';
      toast.error(message);
    }
  });
};

/**
 * Hook para registrar saída/venda de estoque
 */
export const useRegistrarSaida = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dadosSaida) => {
      const response = await api.post('/api/movimentacoes/saida', dadosSaida);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoque });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoqueBaixo });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoqueCritico });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estatisticas });
      toast.success('Saída registrada com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao registrar saída';
      toast.error(message);
    }
  });
};

/**
 * Hook para atualizar flags de estoque
 */
export const useAtualizarFlags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/estoque/atualizar-flags');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoque });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoqueBaixo });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estoqueCritico });
      toast.success('Flags de estoque atualizadas!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao atualizar flags';
      toast.error(message);
    }
  });
};

/**
 * Hook para invalidar cache de estoque
 */
export const useRefreshEstoque = () => {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    Object.values(QUERY_KEYS).forEach(key => {
      if (typeof key !== 'function') {
        queryClient.invalidateQueries({ queryKey: key });
      }
    });
  };

  return { refreshAll };
};

export default {
  useEstoque,
  useVerificarEstoque,
  useLocais,
  useEstoqueBaixo,
  useEstoqueCritico,
  useEstoqueStats,
  useTransferirEstoque,
  useRegistrarEntrada,
  useRegistrarSaida,
  useAtualizarFlags,
  useRefreshEstoque
};
