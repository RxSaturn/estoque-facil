/**
 * useUsuarios - Hook para CRUD de usuários com cache
 * Utiliza TanStack Query para gerenciamento de estado do servidor
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-toastify';

// Chaves de query para cache
const QUERY_KEYS = {
  usuarios: ['usuarios'],
  usuario: (id) => ['usuario', id]
};

// Configuração padrão para queries
const defaultConfig = {
  staleTime: 1000 * 60 * 3, // 3 minutos
  gcTime: 1000 * 60 * 10, // 10 minutos
  refetchOnWindowFocus: false,
  retry: 2
};

/**
 * Hook para listar usuários com paginação e filtros
 * @param {Object} filtros - Filtros para a busca
 * @param {number} filtros.page - Página atual
 * @param {number} filtros.limit - Itens por página
 * @param {string} filtros.busca - Termo de busca
 * @param {string} filtros.perfil - Filtro por perfil
 * @param {Object} options - Opções adicionais do useQuery
 */
export const useUsuarios = (filtros = {}, options = {}) => {
  const { page = 1, limit = 20, busca, perfil } = filtros;

  return useQuery({
    queryKey: [...QUERY_KEYS.usuarios, { page, limit, busca, perfil }],
    queryFn: async () => {
      const params = { page, limit };
      if (busca) params.busca = busca;
      if (perfil) params.perfil = perfil;

      const response = await api.get('/api/usuarios', { params });
      
      // Normalizar resposta para suportar diferentes formatos
      const usuarios = response.data.usuarios || response.data;
      const total = response.data.total ?? usuarios.length;

      return {
        usuarios,
        total
      };
    },
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para obter um usuário específico
 * @param {string} id - ID do usuário
 * @param {Object} options - Opções adicionais do useQuery
 */
export const useUsuario = (id, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.usuario(id),
    queryFn: async () => {
      const response = await api.get(`/api/usuarios/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para criar usuário
 */
export const useCreateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/usuarios', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usuarios });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao criar usuário';
      toast.error(message);
    }
  });
};

/**
 * Hook para atualizar usuário
 */
export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/usuarios/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usuarios });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usuario(variables.id) });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao atualizar usuário';
      toast.error(message);
    }
  });
};

/**
 * Hook para alterar senha de usuário
 */
export const useAlterarSenha = () => {
  return useMutation({
    mutationFn: async ({ id, senha }) => {
      const response = await api.put(`/api/usuarios/${id}/senha`, { senha });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao alterar senha';
      toast.error(message);
    }
  });
};

/**
 * Hook para remover usuário
 */
export const useDeleteUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/api/usuarios/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usuarios });
      toast.success('Usuário removido com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao remover usuário';
      toast.error(message);
    }
  });
};

const hooks = {
  useUsuarios,
  useUsuario,
  useCreateUsuario,
  useUpdateUsuario,
  useAlterarSenha,
  useDeleteUsuario
};

export default hooks;
