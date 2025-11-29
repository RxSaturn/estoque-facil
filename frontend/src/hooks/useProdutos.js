/**
 * useProdutos - Hook para CRUD de produtos com cache
 * Utiliza TanStack Query para gerenciamento de estado do servidor
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-toastify';

// Chaves de query para cache
const QUERY_KEYS = {
  produtos: ['produtos'],
  produto: (id) => ['produto', id],
  tipos: ['produtos-tipos'],
  categorias: ['produtos-categorias'],
  subcategorias: ['produtos-subcategorias'],
  estatisticas: ['produtos-estatisticas']
};

// Configuração padrão para queries
const defaultConfig = {
  staleTime: 1000 * 60 * 3, // 3 minutos
  gcTime: 1000 * 60 * 10, // 10 minutos
  refetchOnWindowFocus: false,
  retry: 2
};

/**
 * Hook para listar produtos com paginação e filtros
 */
export const useProdutos = (filtros = {}, options = {}) => {
  const { page = 1, limit = 20, busca, tipo, categoria, subcategoria } = filtros;

  return useQuery({
    queryKey: [...QUERY_KEYS.produtos, { page, limit, busca, tipo, categoria, subcategoria }],
    queryFn: async () => {
      const params = { page, limit };
      if (busca) params.busca = busca;
      if (tipo) params.tipo = tipo;
      if (categoria) params.categoria = categoria;
      if (subcategoria) params.subcategoria = subcategoria;

      const response = await api.get('/api/produtos', { params });
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para obter um produto específico
 */
export const useProduto = (id, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.produto(id),
    queryFn: async () => {
      const response = await api.get(`/api/produtos/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para listar tipos de produtos
 */
export const useTipos = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.tipos,
    queryFn: async () => {
      const response = await api.get('/api/produtos/tipos');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos - tipos mudam raramente
    ...options
  });
};

/**
 * Hook para listar categorias
 */
export const useCategorias = (tipo = '', options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.categorias, tipo],
    queryFn: async () => {
      const params = tipo ? { tipo } : {};
      const response = await api.get('/api/produtos/categorias', { params });
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
    ...options
  });
};

/**
 * Hook para listar subcategorias
 */
export const useSubcategorias = (tipo = '', categoria = '', options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.subcategorias, tipo, categoria],
    queryFn: async () => {
      const params = {};
      if (tipo) params.tipo = tipo;
      if (categoria) params.categoria = categoria;
      const response = await api.get('/api/produtos/subcategorias', { params });
      return response.data;
    },
    enabled: !!tipo || !!categoria,
    staleTime: 1000 * 60 * 10,
    ...options
  });
};

/**
 * Hook para criar produto
 */
export const useCreateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/api/produtos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.produtos });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estatisticas });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao criar produto';
      toast.error(message);
    }
  });
};

/**
 * Hook para atualizar produto
 */
export const useUpdateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/produtos/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.produtos });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.produto(variables.id) });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao atualizar produto';
      toast.error(message);
    }
  });
};

/**
 * Hook para remover produto
 */
export const useDeleteProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/api/produtos/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.produtos });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estatisticas });
      toast.success('Produto removido com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao remover produto';
      toast.error(message);
    }
  });
};

/**
 * Hook para obter estatísticas de produtos
 */
export const useProdutoStats = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.estatisticas,
    queryFn: async () => {
      const response = await api.get('/api/produtos/estatisticas');
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para contagem de produtos
 */
export const useProdutoCount = (filtros = {}, options = {}) => {
  return useQuery({
    queryKey: ['produtos-count', filtros],
    queryFn: async () => {
      const response = await api.get('/api/produtos/count', { params: filtros });
      return response.data;
    },
    ...defaultConfig,
    ...options
  });
};

export default {
  useProdutos,
  useProduto,
  useTipos,
  useCategorias,
  useSubcategorias,
  useCreateProduto,
  useUpdateProduto,
  useDeleteProduto,
  useProdutoStats,
  useProdutoCount
};
