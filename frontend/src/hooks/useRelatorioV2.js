/**
 * useRelatorioV2 - Hook simplificado para relatórios V2
 * 
 * Características:
 * - Uma única chamada à API para obter todos os dados
 * - Estados simples: loading, error, dados
 * - PDF separado: não depende dos dados em tela
 */

import { useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

/**
 * Hook principal para relatórios V2
 */
const useRelatorioV2 = () => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  /**
   * Gera o relatório com base nos filtros
   * @param {Object} filtros - Filtros do relatório
   */
  const gerarRelatorio = useCallback(async (filtros) => {
    const { dataInicio, dataFim, tipo, categoria, subcategoria, local, metodoCalculo = 'transacoes' } = filtros;

    // Validar datas obrigatórias
    if (!dataInicio || !dataFim) {
      const mensagem = 'Por favor, selecione as datas de início e fim.';
      setError(mensagem);
      toast.error(mensagem, { toastId: 'date-validation-error' });
      return;
    }

    // Validar formato das datas
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);

    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      const mensagem = 'Datas inválidas. Verifique o formato das datas.';
      setError(mensagem);
      toast.error(mensagem, { toastId: 'invalid-date-error' });
      return;
    }

    if (dataInicioObj > dataFimObj) {
      const mensagem = 'A data inicial não pode ser posterior à data final.';
      setError(mensagem);
      toast.error(mensagem, { toastId: 'date-range-error' });
      return;
    }

    // Verificar período muito longo
    const diffTime = Math.abs(dataFimObj - dataInicioObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      toast.warning('Período muito extenso. O relatório pode demorar para carregar.', {
        toastId: 'long-period-warning',
      });
    }

    setLoading(true);
    setError(null);

    try {
      // Construir query string
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        metodoCalculo,
      });

      if (tipo) params.append('tipo', tipo);
      if (categoria) params.append('categoria', categoria);
      if (subcategoria) params.append('subcategoria', subcategoria);
      if (local) params.append('local', local);

      const response = await api.get(`/api/relatorios/v2/dados?${params.toString()}`, {
        timeout: 30000, // 30 segundos de timeout
      });

      if (response.data.sucesso) {
        setDados(response.data);
      } else {
        throw new Error(response.data.mensagem || 'Erro ao gerar relatório');
      }
    } catch (err) {
      console.error('Erro ao gerar relatório V2:', err);
      
      let mensagem = 'Erro ao gerar relatório';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        mensagem = 'O relatório está demorando muito. Tente filtrar por um período menor.';
      } else if (err.response?.status === 400) {
        mensagem = err.response?.data?.mensagem || 'Parâmetros inválidos.';
      } else if (err.response?.status >= 500) {
        mensagem = 'Erro no servidor. Tente novamente mais tarde.';
      } else if (err.response?.data?.mensagem) {
        mensagem = err.response.data.mensagem;
      }

      setError(mensagem);
      toast.error(mensagem, { toastId: 'relatorio-error' });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Baixa o PDF do relatório
   * Faz chamada separada e independente dos dados em tela
   * @param {Object} filtros - Filtros do relatório
   */
  const baixarPDF = useCallback(async (filtros) => {
    const { dataInicio, dataFim, tipo, categoria, subcategoria, local, metodoCalculo = 'transacoes' } = filtros;

    // Validar datas obrigatórias
    if (!dataInicio || !dataFim) {
      toast.error('Por favor, selecione as datas de início e fim antes de baixar o PDF.', {
        toastId: 'pdf-date-error',
      });
      return;
    }

    setGerandoPDF(true);

    try {
      // Construir query string
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        metodoCalculo,
      });

      if (tipo) params.append('tipo', tipo);
      if (categoria) params.append('categoria', categoria);
      if (subcategoria) params.append('subcategoria', subcategoria);
      if (local) params.append('local', local);

      const response = await api.get(`/api/relatorios/v2/pdf?${params.toString()}`, {
        responseType: 'blob',
        timeout: 60000, // 60 segundos para PDF
      });

      // Criar URL para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.setAttribute('download', `relatorio-estoque-${dataHoje}.pdf`);

      document.body.appendChild(link);
      link.click();

      // Limpar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF V2:', err);
      
      let mensagem = 'Erro ao gerar PDF';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        mensagem = 'O PDF está demorando muito. Tente filtrar por um período menor.';
      } else if (err.response?.status === 404) {
        mensagem = 'Nenhum dado encontrado para gerar o PDF.';
      } else if (err.response?.status >= 500) {
        mensagem = 'Erro no servidor ao gerar PDF. Tente novamente mais tarde.';
      }

      toast.error(mensagem, { toastId: 'pdf-error' });
    } finally {
      setGerandoPDF(false);
    }
  }, []);

  /**
   * Limpa os dados do relatório
   */
  const limparDados = useCallback(() => {
    setDados(null);
    setError(null);
  }, []);

  return {
    dados,
    loading,
    error,
    gerandoPDF,
    gerarRelatorio,
    baixarPDF,
    limparDados,
  };
};

/**
 * Utilitário para períodos predefinidos
 */
export const periodosPredefinidos = {
  ultimaSemana: () => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 7);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
    };
  },
  ultimoMes: () => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setMonth(hoje.getMonth() - 1);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
    };
  },
  ultimoTrimestre: () => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setMonth(hoje.getMonth() - 3);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
    };
  },
  ultimoAno: () => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setFullYear(hoje.getFullYear() - 1);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
    };
  },
  mesAtual: () => {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
    };
  },
  anoAtual: () => {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), 0, 1);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
    };
  },
};

export default useRelatorioV2;
