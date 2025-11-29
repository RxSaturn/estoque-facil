/**
 * useRelatorios - Hook para dados de relatórios
 * Utiliza TanStack Query para gerenciamento de estado do servidor
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-toastify';

// Chaves de query para cache
const QUERY_KEYS = {
  resumo: ['relatorio-resumo'],
  produtosSemMovimentacao: ['relatorio-sem-movimentacao'],
  topProdutos: ['relatorio-top-produtos']
};

// Configuração padrão para queries
const defaultConfig = {
  staleTime: 1000 * 60 * 5, // 5 minutos
  gcTime: 1000 * 60 * 15, // 15 minutos
  refetchOnWindowFocus: false,
  retry: 1
};

/**
 * Hook para obter resumo do relatório
 */
export const useResumoRelatorio = (filtros, options = {}) => {
  const {
    dataInicio,
    dataFim,
    tipo,
    categoria,
    subcategoria,
    local,
    metodoCalculo = 'transacoes'
  } = filtros;

  return useQuery({
    queryKey: [...QUERY_KEYS.resumo, filtros],
    queryFn: async () => {
      const params = {
        dataInicio,
        dataFim,
        metodoCalculo,
        useExactDates: true
      };
      if (tipo) params.tipo = tipo;
      if (categoria) params.categoria = categoria;
      if (subcategoria) params.subcategoria = subcategoria;
      if (local) params.local = local;

      const response = await api.get('/api/relatorios/resumo', { params });
      return response.data;
    },
    enabled: !!dataInicio && !!dataFim,
    ...defaultConfig,
    ...options
  });
};

/**
 * Hook para gerar relatório manualmente
 */
export const useGerarRelatorio = () => {
  return useMutation({
    mutationFn: async (filtros) => {
      const {
        dataInicio,
        dataFim,
        tipo,
        categoria,
        subcategoria,
        local,
        metodoCalculo = 'transacoes'
      } = filtros;

      const params = {
        dataInicio,
        dataFim,
        metodoCalculo,
        useExactDates: true
      };
      if (tipo) params.tipo = tipo;
      if (categoria) params.categoria = categoria;
      if (subcategoria) params.subcategoria = subcategoria;
      if (local) params.local = local;

      const response = await api.get('/api/relatorios/resumo', { params });
      return response.data;
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao gerar relatório';
      toast.error(message);
    }
  });
};

/**
 * Hook para download de PDF do relatório
 */
export const useDownloadPDF = () => {
  return useMutation({
    mutationFn: async (filtros) => {
      const {
        dataInicio,
        dataFim,
        tipo,
        categoria,
        subcategoria,
        local,
        metodoCalculo = 'transacoes'
      } = filtros;

      let query = `dataInicio=${dataInicio}&dataFim=${dataFim}&metodoCalculo=${metodoCalculo}`;
      if (tipo) query += `&tipo=${encodeURIComponent(tipo)}`;
      if (categoria) query += `&categoria=${encodeURIComponent(categoria)}`;
      if (subcategoria) query += `&subcategoria=${encodeURIComponent(subcategoria)}`;
      if (local) query += `&local=${encodeURIComponent(local)}`;

      const response = await api.get(`/api/relatorios/pdf?${query}`, {
        responseType: 'blob'
      });

      // Criar URL para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.setAttribute('download', `estoque-facil-relatorio-${dataHoje}.pdf`);

      document.body.appendChild(link);
      link.click();

      // Limpar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      return { sucesso: true };
    },
    onSuccess: () => {
      toast.success('Relatório gerado com sucesso!');
    },
    onError: (error) => {
      const message = error.response?.data?.mensagem || 'Erro ao gerar PDF';
      toast.error(message);
    }
  });
};

/**
 * Hook para exportar CSV
 */
export const useExportCSV = () => {
  return useMutation({
    mutationFn: async ({ dados, nomeArquivo = 'relatorio' }) => {
      if (!dados || !Array.isArray(dados) || dados.length === 0) {
        throw new Error('Dados inválidos para exportação');
      }

      // Converter dados para CSV
      const headers = Object.keys(dados[0]);
      const csvContent = [
        headers.join(','),
        ...dados.map(row =>
          headers.map(header => {
            const value = row[header];
            // Escapar valores com vírgula ou aspas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Criar blob e download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.setAttribute('download', `${nomeArquivo}-${dataHoje}.csv`);

      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      return { sucesso: true };
    },
    onSuccess: () => {
      toast.success('CSV exportado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao exportar CSV');
    }
  });
};

/**
 * Hook para top produtos por vendas
 */
export const useTopProdutosPorVendas = (filtros, options = {}) => {
  const { dataInicio, dataFim, tipo, categoria, subcategoria, local } = filtros;

  return useQuery({
    queryKey: [...QUERY_KEYS.topProdutos, filtros],
    queryFn: async () => {
      const params = { dataInicio, dataFim };
      if (tipo) params.tipo = tipo;
      if (categoria) params.categoria = categoria;
      if (subcategoria) params.subcategoria = subcategoria;
      if (local) params.local = local;

      const response = await api.get('/api/relatorios/top-produtos-vendas', { params });
      return response.data;
    },
    enabled: !!dataInicio && !!dataFim,
    ...defaultConfig,
    ...options
  });
};

/**
 * Objeto utilitário com datas predefinidas
 */
export const periodosPredefinidos = {
  ultimaSemana: () => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 7);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    };
  },
  ultimoMes: () => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setMonth(hoje.getMonth() - 1);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    };
  },
  ultimoTrimestre: () => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setMonth(hoje.getMonth() - 3);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    };
  },
  ultimoAno: () => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setFullYear(hoje.getFullYear() - 1);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    };
  },
  mesAtual: () => {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    };
  },
  anoAtual: () => {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), 0, 1);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    };
  }
};

export default {
  useResumoRelatorio,
  useGerarRelatorio,
  useDownloadPDF,
  useExportCSV,
  useTopProdutosPorVendas,
  periodosPredefinidos
};
