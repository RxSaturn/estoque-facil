import React, { useContext } from "react";
import { Link } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  FaBoxOpen,
  FaExchangeAlt,
  FaChartLine,
  FaShoppingCart,
  FaExclamationTriangle,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
  FaTrophy,
  FaChartPie,
  FaSync,
  FaClock,
} from "react-icons/fa";
import AuthContext from "../contexts/AuthContext";
import {
  getProductStats,
  getSalesStats,
  getTopProducts,
  getLowStockProducts,
  getRecentTransactions,
  getCategoryDistribution,
} from "../services/dashboardService";
import { toast } from "react-toastify";
import "./Dashboard.css";

// Crie um QueryClient para gerenciar as queries com configurações otimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000, // Aumentar delay entre tentativas
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (era cacheTime no v3)
      timeout: 15000, // Timeout de 15 segundos
      networkMode: "always", // Continuar tentando mesmo offline
    },
  },
});

// Componente wrapper para prover o React Query context
const DashboardWithQueryProvider = () => (
  <QueryClientProvider client={queryClient}>
    <Dashboard />
    {process.env.NODE_ENV === "development" && (
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    )}
  </QueryClientProvider>
);

// Componente principal do Dashboard
const Dashboard = () => {
  const { usuario } = useContext(AuthContext);
  const queryClient = useQueryClient();

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
              10000
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
              10000
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
              10000
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
              10000
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
              10000
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
              10000
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

  // Função para recarregar todos os dados
  const refreshAllData = () => {
    toast.info("Atualizando dados do dashboard...");
    queryClient.invalidateQueries();
  };

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

  // Função para formatar data
  const formatarData = (dataString) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString("pt-BR");
    } catch (e) {
      return dataString || "Data indisponível";
    }
  };

  // Função para renderizar indicador de tendência
  const renderTrend = (valor) => {
    if (!valor || valor === 0) return null;
    return (
      <span
        className={`trend-indicator ${valor > 0 ? "positivo" : "negativo"}`}
      >
        {valor > 0 ? <FaArrowUp /> : <FaArrowDown />}
        <span>{Math.abs(valor)}%</span>
      </span>
    );
  };

  // Tela de carregamento com estados detalhados
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Carregando dashboard...</h2>
        <div className="loading-status">
          <div className="loading-progress">
            <div
              className={`loading-item ${
                !produtosQuery.isLoading ? "loaded" : ""
              }`}
            >
              {!produtosQuery.isLoading ? "✓" : "•"} Produtos
            </div>
            <div
              className={`loading-item ${
                !vendasQuery.isLoading ? "loaded" : ""
              }`}
            >
              {!vendasQuery.isLoading ? "✓" : "•"} Vendas
            </div>
            <div
              className={`loading-item ${
                !topProdutosQuery.isLoading ? "loaded" : ""
              }`}
            >
              {!topProdutosQuery.isLoading ? "✓" : "•"} Top Produtos
            </div>
            <div
              className={`loading-item ${
                !estoqueBaixoQuery.isLoading ? "loaded" : ""
              }`}
            >
              {!estoqueBaixoQuery.isLoading ? "✓" : "•"} Estoque Baixo
            </div>
            <div
              className={`loading-item ${
                !categoriasQuery.isLoading ? "loaded" : ""
              }`}
            >
              {!categoriasQuery.isLoading ? "✓" : "•"} Categorias
            </div>
            <div
              className={`loading-item ${
                !movimentacoesQuery.isLoading ? "loaded" : ""
              }`}
            >
              {!movimentacoesQuery.isLoading ? "✓" : "•"} Movimentações
            </div>
          </div>
          <div className="loading-info">
            <FaClock /> Aguarde até 15 segundos para carregamento completo
          </div>
        </div>
      </div>
    );
  }

  // Tela de erro quando todos os dados essenciais falharam
  if (isError) {
    return (
      <div className="error-container">
        <FaExclamationTriangle className="error-icon" />
        <h2>Erro ao carregar dados</h2>
        <p>Não foi possível obter os dados essenciais do dashboard.</p>
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

      {/* Cards de resumo */}
      <div className="cards-grid">
        <div className="stat-card">
          <div className="card-icon produtos">
            <FaBoxOpen />
          </div>
          <div className="card-content">
            <h3>Total de Produtos</h3>
            <p className="card-value">
              {resumo.totalProdutos}
              {renderTrend(salesTrend.produtos)}
            </p>
            <Link to="/produtos" className="card-link">
              Ver todos
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon estoque">
            <FaExchangeAlt />
          </div>
          <div className="card-content">
            <h3>Estoque Total</h3>
            <p className="card-value">{resumo.totalEstoque} itens</p>
            <Link to="/movimentacao" className="card-link">
              Gerenciar
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon movimentacoes">
            <FaChartLine />
          </div>
          <div className="card-content">
            <h3>Movimentações</h3>
            <p className="card-value">
              {resumo.movimentacoesRecentes} recentes
            </p>
            <Link to="/relatorios" className="card-link">
              Relatórios
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon vendas">
            <FaShoppingCart />
          </div>
          <div className="card-content">
            <h3>Vendas</h3>
            <p className="card-value">
              {resumo.vendasRecentes} hoje
              {renderTrend(salesTrend.vendas)}
            </p>
            <Link to="/historico" className="card-link">
              Detalhes
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon alertas">
            <FaExclamationTriangle />
          </div>
          <div className="card-content">
            <h3>Alertas</h3>
            <p className="card-value">
              {resumo.alertasEstoque} estoque baixo
              {renderTrend(salesTrend.estoqueBaixo)}
            </p>
            <Link to="/relatorios" className="card-link">
              Ver alertas
            </Link>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          {/* Top Produtos */}
          <div
            className={`dashboard-card ${
              topProdutosQuery.isFetching ? "card-fetching" : ""
            }`}
          >
            <div className="card-header">
              <h2>
                <FaTrophy className="header-icon" /> Top Produtos
                {topProdutosQuery.isError && (
                  <span
                    className="error-badge"
                    title={
                      topProdutosQuery.error?.message ||
                      "Erro ao carregar dados"
                    }
                  >
                    !
                  </span>
                )}
              </h2>
              <Link to="/produtos" className="btn-sm">
                <FaPlus /> Adicionar Produto
              </Link>
            </div>

            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Vendas</th>
                    <th>Desempenho</th>
                  </tr>
                </thead>
                <tbody>
                  {topProdutosQuery.data?.length > 0 ? (
                    topProdutosQuery.data.map((produto, index) => {
                      // Normalizar campos para diferentes formatos de API
                      const nome = produto.nome || produto.name;
                      const vendas =
                        produto.quantidadeVendas || produto.salesCount || 0;

                      // Calcular o progresso relativo para a barra
                      const maxSales = Math.max(
                        ...topProdutosQuery.data.map(
                          (p) => p.quantidadeVendas || p.salesCount || 0
                        )
                      );
                      const progresso = Math.round(
                        (vendas / Math.max(maxSales, 1)) * 100
                      );

                      return (
                        <tr key={produto.id || produto._id || index}>
                          <td>{nome}</td>
                          <td>{vendas} transações</td>
                          <td>
                            <div className="progress-container">
                              <div
                                className={`progress-bar rank-${index + 1}`}
                                style={{ width: `${progresso}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data">
                        {topProdutosQuery.isFetching
                          ? "Carregando..."
                          : "Nenhum dado de vendas disponível"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Produtos com Estoque Baixo */}
          <div
            className={`dashboard-card ${
              estoqueBaixoQuery.isFetching ? "card-fetching" : ""
            }`}
          >
            <div className="card-header">
              <h2>
                <FaExclamationTriangle className="header-icon" /> Produtos com
                Estoque Baixo
                {estoqueBaixoQuery.isError && (
                  <span
                    className="error-badge"
                    title={
                      estoqueBaixoQuery.error?.message ||
                      "Erro ao carregar dados"
                    }
                  >
                    !
                  </span>
                )}
              </h2>
              <Link to="/produtos" className="btn-sm">
                <FaPlus /> Repor Estoque
              </Link>
            </div>

            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Local</th>
                    <th>Estoque</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {estoqueBaixoQuery.data?.length > 0 ? (
                    estoqueBaixoQuery.data.map((produto, index) => {
                      // Normalizar campos para diferentes formatos de API
                      const nome = produto.nome || produto.name;
                      const local =
                        produto.local ||
                        produto.location ||
                        "Depósito Principal";
                      const estoqueAtual =
                        produto.estoqueAtual || produto.currentStock || 0;
                      const estoqueMinimo =
                        produto.estoqueMinimo || produto.minStock || 5;

                      // Determinar status
                      let statusClass;
                      let statusText;

                      if (estoqueAtual === 0) {
                        statusClass = "esgotado";
                        statusText = "Esgotado";
                      } else if (estoqueAtual <= estoqueMinimo / 2) {
                        statusClass = "critico";
                        statusText = "Crítico";
                      } else {
                        statusClass = "baixo";
                        statusText = "Baixo";
                      }

                      return (
                        <tr key={produto.id || produto._id || index}>
                          <td>{nome}</td>
                          <td>{local}</td>
                          <td>
                            {estoqueAtual} / {estoqueMinimo}
                          </td>
                          <td>
                            <span className={`status-badge ${statusClass}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">
                        {estoqueBaixoQuery.isFetching
                          ? "Carregando..."
                          : "Nenhum produto com estoque baixo"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribuição por Categoria */}
          <div
            className={`dashboard-card ${
              categoriasQuery.isFetching ? "card-fetching" : ""
            }`}
          >
            <div className="card-header">
              <h2>
                <FaChartPie className="header-icon" /> Distribuição por
                Categoria
                {categoriasQuery.isError && (
                  <span
                    className="error-badge"
                    title={
                      categoriasQuery.error?.message || "Erro ao carregar dados"
                    }
                  >
                    !
                  </span>
                )}
              </h2>
            </div>

            <div className="categorias-container">
              {categoriasQuery.data?.length > 0 ? (
                <div className="categorias-grid">
                  {categoriasQuery.data.map((categoria, index) => {
                    // Normalizar campos para diferentes formatos de API
                    const nome = categoria.nome || categoria.name;
                    const quantidade =
                      categoria.quantidade || categoria.count || 0;

                    const total = categoriasQuery.data.reduce(
                      (sum, cat) => sum + (cat.quantidade || cat.count || 0),
                      0
                    );
                    const percentual = Math.round(
                      (quantidade / Math.max(total, 1)) * 100
                    );

                    // Array de cores para as categorias
                    const cores = [
                      "#3498db",
                      "#2ecc71",
                      "#9b59b6",
                      "#f39c12",
                      "#e74c3c",
                      "#1abc9c",
                      "#34495e",
                      "#d35400",
                      "#16a085",
                      "#8e44ad",
                    ];

                    return (
                      <div
                        className="categoria-item"
                        key={categoria.id || categoria._id || index}
                      >
                        <div className="categoria-info">
                          <div
                            className="categoria-cor"
                            style={{
                              backgroundColor: cores[index % cores.length],
                            }}
                          ></div>
                          <span className="categoria-nome">{nome}</span>
                        </div>
                        <div className="categoria-dados">
                          <span className="categoria-contagem">
                            {quantidade}
                          </span>
                          <span className="categoria-percentual">
                            {percentual}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-data">
                  {categoriasQuery.isFetching
                    ? "Carregando categorias..."
                    : "Nenhuma categoria encontrada"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          {/* Movimentações Recentes */}
          <div
            className={`dashboard-card ${
              movimentacoesQuery.isFetching ? "card-fetching" : ""
            }`}
          >
            <div className="card-header">
              <h2>
                <FaExchangeAlt className="header-icon" /> Movimentações Recentes
                {movimentacoesQuery.isError && (
                  <span
                    className="error-badge"
                    title={
                      movimentacoesQuery.error?.message ||
                      "Erro ao carregar dados"
                    }
                  >
                    !
                  </span>
                )}
              </h2>
              <Link to="/movimentacao" className="btn-sm">
                <FaExchangeAlt /> Nova Movimentação
              </Link>
            </div>

            <div className="movimentacoes-list">
              {movimentacoesQuery.data?.length > 0 ? (
                movimentacoesQuery.data.map((mov, index) => {
                  // Normalizar campos para diferentes formatos de API
                  const tipo = mov.tipo || mov.type;
                  const produtoNome =
                    mov.produto?.nome || mov.produtoNome || mov.productName;
                  const quantidade = mov.quantidade || mov.quantity;
                  const localOrigem =
                    mov.localOrigem || mov.origem || mov.origin;
                  const localDestino =
                    mov.localDestino || mov.destino || mov.destination;
                  const data = mov.data || mov.date || new Date().toISOString();
                  const local = mov.local || mov.location;

                  // Determinar o tipo de movimentação e ícone
                  let tipoClass;
                  let icone;
                  let tipoTexto;

                  switch (tipo) {
                    case "transferencia":
                    case "transfer":
                      tipoClass = "transferencia";
                      icone = <FaExchangeAlt />;
                      tipoTexto = "Transferência";
                      break;
                    case "venda":
                    case "sale":
                      tipoClass = "venda";
                      icone = <FaArrowUp />;
                      tipoTexto = "Venda";
                      break;
                    case "entrada":
                    case "entry":
                      tipoClass = "entrada";
                      icone = <FaArrowDown />;
                      tipoTexto = "Entrada";
                      break;
                    default:
                      tipoClass = "outro";
                      icone = <FaExchangeAlt />;
                      tipoTexto = "Movimentação";
                  }

                  return (
                    <div
                      className="movimentacao-item"
                      key={mov.id || mov._id || index}
                    >
                      <div className={`movimentacao-tipo ${tipoClass}`}>
                        {icone}
                      </div>

                      <div className="movimentacao-info">
                        <h4>{tipoTexto}</h4>
                        <p className="produto">{produtoNome}</p>
                        <p className="detalhes">
                          {tipoClass === "transferencia"
                            ? `${localOrigem} → ${localDestino}`
                            : `${
                                localOrigem || local || "Local não especificado"
                              }`}
                        </p>
                      </div>

                      <div className="movimentacao-quantidade">
                        <span className="quantidade">{quantidade}</span>
                        <span className="data">{formatarData(data)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-data">
                  {movimentacoesQuery.isFetching
                    ? "Carregando movimentações..."
                    : "Nenhuma movimentação recente"}
                </div>
              )}
            </div>

            <Link to="/historico" className="ver-tudo-link">
              Ver todas as transações
            </Link>
          </div>

          {/* Componente "Últimas Transações" foi removido conforme solicitado */}
          
        </div>
      </div>
    </div>
  );
};

export default DashboardWithQueryProvider;
