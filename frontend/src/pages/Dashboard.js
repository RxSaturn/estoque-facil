import React, { useContext, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaBoxOpen,
  FaExchangeAlt,
  FaChartLine,
  FaShoppingCart,
  FaExclamationTriangle,
  FaSync,
} from "react-icons/fa";
import AuthContext from "../contexts/AuthContext";
import {
  getProductStats,
  getSalesStats,
  getTopProducts,
  getLowStockProducts,
  getRecentTransactions,
  getCategoryDistribution,
  clearDashboardCache,
} from "../services/dashboardService";
import { toast } from "react-toastify";

// Novos componentes modulares
import MetricCard from "../components/dashboard/MetricCard";
import StockAlerts from "../components/dashboard/StockAlerts";
import SalesChart from "../components/dashboard/SalesChart";
import CategoryDistribution from "../components/dashboard/CategoryDistribution";
import RecentActivity from "../components/dashboard/RecentActivity";
import SkeletonCard from "../components/dashboard/SkeletonCard";

import "./Dashboard.css";

// Componente principal do Dashboard
const Dashboard = () => {
  const { usuario } = useContext(AuthContext);
  const queryClient = useQueryClient();

  // Timeout aumentado de 8s para 15s para redes mais lentas
  const QUERY_TIMEOUT = 15000;

  // Consultas TanStack Query para cada tipo de dados com promessas com timeout
  const produtosQuery = useQuery({
    queryKey: ["estatisticasProdutos"],
    queryFn: async () => {
      console.log("🔄 Iniciando query de produtos");
      try {
        const result = await Promise.race([
          getProductStats(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout na consulta de produtos")),
              QUERY_TIMEOUT
            )
          ),
        ]);
        console.log("✅ Query de produtos concluída com sucesso");
        return result;
      } catch (error) {
        console.error("❌ Erro na query de produtos:", error);
        throw error;
      }
    },
    onError: (err) => {
      console.error("❌ Erro final na query de produtos:", err);
      toast.error("Erro ao carregar dados de produtos. Tente atualizar.");
      // Retornar dados padrão para evitar erros de UI
      return { total: 0, quantidadeTotal: 0 };
    },
  });

  const vendasQuery = useQuery({
    queryKey: ["estatisticasVendas"],
    queryFn: async () => {
      console.log("🔄 Iniciando query de vendas");
      try {
        const result = await Promise.race([
          getSalesStats(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout na consulta de vendas")),
              QUERY_TIMEOUT
            )
          ),
        ]);
        console.log("✅ Query de vendas concluída com sucesso");
        return result;
      } catch (error) {
        console.error("❌ Erro na query de vendas:", error);
        throw error;
      }
    },
    onError: (err) => {
      console.error("❌ Erro final na query de vendas:", err);
      toast.error("Erro ao carregar dados de vendas. Tente atualizar.");
      // Retornar dados padrão
      return { vendasHoje: 0, tendenciaVendas: 0 };
    },
  });

  const topProdutosQuery = useQuery({
    queryKey: ["topProdutos"],
    queryFn: async () => {
      console.log("🔄 Iniciando query de top produtos");
      try {
        const result = await Promise.race([
          getTopProducts(5),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout na consulta de top produtos")),
              QUERY_TIMEOUT
            )
          ),
        ]);
        console.log("✅ Query de top produtos concluída com sucesso");
        return result;
      } catch (error) {
        console.error("❌ Erro na query de top produtos:", error);
        throw error;
      }
    },
    onError: (err) => {
      console.error("❌ Erro final na query de top produtos:", err);
      toast.error("Erro ao carregar top produtos. Tente atualizar.");
      return [];
    },
  });

  const estoqueBaixoQuery = useQuery({
    queryKey: ["produtosBaixoEstoque"],
    queryFn: async () => {
      console.log("🔄 Iniciando query de estoque baixo");
      try {
        const result = await Promise.race([
          getLowStockProducts(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout na consulta de estoque baixo")),
              QUERY_TIMEOUT
            )
          ),
        ]);
        console.log("✅ Query de estoque baixo concluída com sucesso");
        return result;
      } catch (error) {
        console.error("❌ Erro na query de estoque baixo:", error);
        throw error;
      }
    },
    onError: (err) => {
      console.error("❌ Erro final na query de estoque baixo:", err);
      toast.error(
        "Erro ao carregar produtos com estoque baixo. Tente atualizar."
      );
      return [];
    },
  });

  const categoriasQuery = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      console.log("🔄 Iniciando query de categorias");
      try {
        const result = await Promise.race([
          getCategoryDistribution(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout na consulta de categorias")),
              QUERY_TIMEOUT
            )
          ),
        ]);
        console.log("✅ Query de categorias concluída com sucesso");
        return result;
      } catch (error) {
        console.error("❌ Erro na query de categorias:", error);
        throw error;
      }
    },
    onError: (err) => {
      console.error("❌ Erro final na query de categorias:", err);
      toast.error("Erro ao carregar categorias. Tente atualizar.");
      return [];
    },
  });

  const movimentacoesQuery = useQuery({
    queryKey: ["movimentacoesRecentes"],
    queryFn: async () => {
      console.log("🔄 Iniciando query de movimentações");
      try {
        const result = await Promise.race([
          getRecentTransactions(8),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout na consulta de movimentações")),
              QUERY_TIMEOUT
            )
          ),
        ]);
        console.log("✅ Query de movimentações concluída com sucesso");
        return result;
      } catch (error) {
        console.error("❌ Erro na query de movimentações:", error);
        throw error;
      }
    },
    onError: (err) => {
      console.error("❌ Erro final na query de movimentações:", err);
      toast.error("Erro ao carregar movimentações. Tente atualizar.");
      return [];
    },
  });

  // Verificar se todos os dados essenciais estão carregando
  const isLoading = produtosQuery.isLoading || movimentacoesQuery.isLoading;

  // Verificar se alguma query está refetchingS
  const isRefetching =
    produtosQuery.isFetching ||
    vendasQuery.isFetching ||
    movimentacoesQuery.isFetching;

  // Verificar se alguma query falhou
  const isError =
    produtosQuery.isError || vendasQuery.isError || movimentacoesQuery.isError;

  // Verificar se há dados parciais (algumas queries ok, outras com erro)
  const isPartial =
    topProdutosQuery.isError ||
    estoqueBaixoQuery.isError ||
    categoriasQuery.isError;

  // Função para recarregar todos os dados com limpeza de cache
  const refreshAllData = useCallback(() => {
    toast.info("Atualizando dados do dashboard...", {
      toastId: "dashboard-refresh",
      autoClose: 2000
    });
    // Limpar cache do serviço de dashboard
    clearDashboardCache();
    // Invalidar todas as queries do React Query
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Construir objeto de resumo a partir dos dados das queries
  const resumo = {
    totalProdutos: produtosQuery.data?.total || 0,
    totalEstoque: produtosQuery.data?.quantidadeTotal || 0,
    movimentacoesRecentes: movimentacoesQuery.data?.length || 0,
    vendasRecentes: vendasQuery.data?.vendasHoje || 0,
    alertasEstoque: estoqueBaixoQuery.data?.length || 0,
  };

  // Tendências (não modificado de acordo com os dados anteriores)
  const salesTrend = {
    produtos: 0,
    estoqueBaixo: 0,
    vendas: vendasQuery.data?.tendenciaVendas || 0,
    receita: 0,
  };

  // Tela de carregamento com skeleton loaders
  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="welcome-section">
          <h1>Carregando dashboard...</h1>
          <p>Aguarde enquanto carregamos seus dados</p>
        </div>
        
        {/* Skeleton cards para métricas */}
        <div className="cards-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} variant="stat" />
          ))}
        </div>
        
        {/* Skeleton para seções */}
        <div className="dashboard-grid">
          <div className="dashboard-section">
            <SkeletonCard variant="table" />
            <SkeletonCard variant="table" />
            <SkeletonCard variant="chart" />
          </div>
          <div className="dashboard-section">
            <SkeletonCard variant="list" />
          </div>
        </div>
      </div>
    );
  }

  // Tela de erro quando todos os dados essenciais falharam
  if (isError) {
    // Determinar o tipo de erro para mensagem contextual
    const getErrorMessage = () => {
      const prodError = produtosQuery.error;
      const vendasError = vendasQuery.error;
      const movError = movimentacoesQuery.error;
      
      // Verificar se é erro de conexão
      if (prodError?.isConnectionError || vendasError?.isConnectionError || movError?.isConnectionError) {
        return {
          title: "Erro de conexão",
          message: "Não foi possível conectar ao servidor. Verifique se o servidor backend está rodando e se sua conexão de internet está funcionando.",
          icon: "connection"
        };
      }
      
      // Verificar se é erro de timeout
      const timeoutError = [prodError, vendasError, movError].find(
        e => e?.message?.includes('Timeout') || e?.message?.includes('timeout')
      );
      if (timeoutError) {
        return {
          title: "Conexão lenta",
          message: "A conexão com o servidor está demorando muito. Isso pode ser causado por uma rede lenta ou servidor sobrecarregado.",
          icon: "timeout"
        };
      }
      
      // Verificar se é erro de autenticação
      const authError = [prodError, vendasError, movError].find(
        e => e?.response?.status === 401 || e?.response?.status === 403
      );
      if (authError) {
        return {
          title: "Sessão expirada",
          message: "Sua sessão expirou. Por favor, faça login novamente para continuar.",
          icon: "auth"
        };
      }
      
      return {
        title: "Erro ao carregar dados",
        message: "Não foi possível obter os dados essenciais do dashboard. Tente atualizar a página.",
        icon: "error"
      };
    };
    
    const errorInfo = getErrorMessage();
    
    return (
      <div className="error-container">
        <FaExclamationTriangle className="error-icon" />
        <h2>{errorInfo.title}</h2>
        <p>{errorInfo.message}</p>
        <div className="error-details">
          {produtosQuery.error && (
            <small className="error-detail">Produtos: {produtosQuery.error.message || 'Erro desconhecido'}</small>
          )}
          {vendasQuery.error && (
            <small className="error-detail">Vendas: {vendasQuery.error.message || 'Erro desconhecido'}</small>
          )}
          {movimentacoesQuery.error && (
            <small className="error-detail">Movimentações: {movimentacoesQuery.error.message || 'Erro desconhecido'}</small>
          )}
        </div>
        <button className="btn-reload" onClick={refreshAllData}>
          <FaSync /> Tentar novamente
        </button>
      </div>
    );
  }

  // Renderização principal do dashboard
  return (
    <div className="dashboard-container">
      {isRefetching && (
        <div className="refetching-indicator">
          <div className="loading-spinner-small"></div>
          Atualizando dados...
        </div>
      )}

      {isPartial && (
        <div className="warning-banner">
          <FaExclamationTriangle /> Alguns dados podem estar incompletos.
          <button onClick={refreshAllData} className="refresh-link">
            <FaSync /> Atualizar
          </button>
        </div>
      )}

      <div className="welcome-section">
        <h1>Bem-vindo, {usuario?.nome || "RxSaturn"}!</h1>
        <p>Aqui está um resumo do seu estoque atual.</p>
        <div className="timestamp">
          <span>Atualizado em: {new Date().toLocaleString()}</span>
        </div>
        <button className="btn-refresh" onClick={refreshAllData}>
          <FaSync /> Atualizar dados
        </button>
      </div>

      {/* Cards de resumo usando MetricCard */}
      <div className="cards-grid">
        <MetricCard
          title="Total de Produtos"
          value={resumo.totalProdutos}
          icon={FaBoxOpen}
          iconColor="primary"
          trend={salesTrend.produtos}
          link="/produtos"
          linkText="Ver todos"
        />

        <MetricCard
          title="Estoque Total"
          value={resumo.totalEstoque}
          suffix="itens"
          icon={FaExchangeAlt}
          iconColor="success"
          link="/movimentacao"
          linkText="Gerenciar"
        />

        <MetricCard
          title="Movimentações"
          value={resumo.movimentacoesRecentes}
          suffix="recentes"
          icon={FaChartLine}
          iconColor="purple"
          link="/relatorios"
          linkText="Relatórios"
        />

        <MetricCard
          title="Vendas"
          value={resumo.vendasRecentes}
          suffix="hoje"
          icon={FaShoppingCart}
          iconColor="warning"
          trend={salesTrend.vendas}
          link="/historico"
          linkText="Detalhes"
        />

        <MetricCard
          title="Alertas"
          value={resumo.alertasEstoque}
          suffix="estoque baixo"
          icon={FaExclamationTriangle}
          iconColor="danger"
          trend={salesTrend.estoqueBaixo}
          link="/produtos"
          linkText="Ver alertas"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          {/* Top Produtos - usando SalesChart component */}
          <SalesChart 
            topProdutos={topProdutosQuery.data || []}
            loading={topProdutosQuery.isFetching && !topProdutosQuery.data}
            error={topProdutosQuery.isError ? topProdutosQuery.error : null}
          />

          {/* Produtos com Estoque Baixo - usando StockAlerts component */}
          <StockAlerts 
            produtos={estoqueBaixoQuery.data || []}
            loading={estoqueBaixoQuery.isFetching && !estoqueBaixoQuery.data}
            error={estoqueBaixoQuery.isError ? estoqueBaixoQuery.error : null}
            onRefresh={refreshAllData}
          />

          {/* Distribuição por Categoria - usando CategoryDistribution component */}
          <CategoryDistribution 
            categorias={categoriasQuery.data || []}
            loading={categoriasQuery.isFetching && !categoriasQuery.data}
            error={categoriasQuery.isError ? categoriasQuery.error : null}
          />
        </div>

        <div className="dashboard-section">
          {/* Movimentações Recentes - usando RecentActivity component */}
          <RecentActivity 
            movimentacoes={movimentacoesQuery.data || []}
            loading={movimentacoesQuery.isFetching && !movimentacoesQuery.data}
            error={movimentacoesQuery.isError ? movimentacoesQuery.error : null}
            onRefresh={refreshAllData}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;