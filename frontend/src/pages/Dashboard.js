import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
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
import "./Dashboard.css";

const Dashboard = () => {
  const { usuario } = useContext(AuthContext);
  const [resumo, setResumo] = useState({
    totalProdutos: 0,
    totalEstoque: 0,
    movimentacoesRecentes: 0,
    vendasRecentes: 0,
    alertasEstoque: 0,
  });

  const [topProdutos, setTopProdutos] = useState([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salesTrend, setSalesTrend] = useState({
    produtos: 0,
    estoqueBaixo: 0,
    vendas: 0,
    receita: 0,
  });

  useEffect(() => {
    const carregarDadosDashboard = async () => {
      try {
        setCarregando(true);

        // Obter dados reais da API
        const productStats = await getProductStats();
        const salesStats = await getSalesStats();
        const topProductsData = await getTopProducts(5);
        const lowStockData = await getLowStockProducts();
        const transactionsData = await getRecentTransactions();
        const categoryData = await getCategoryDistribution();

        // Configurar resumo com dados reais
        setResumo({
          totalProdutos: productStats.total || 0,
          totalEstoque: productStats.totalStock || 0,
          movimentacoesRecentes: transactionsData.length || 0,
          vendasRecentes: salesStats.dailySales || 0,
          alertasEstoque: lowStockData.length || 0,
        });

        // Configurar indicadores de tendência
        setSalesTrend({
          produtos: productStats.trend || 0,
          estoqueBaixo: productStats.lowStockTrend || 0,
          vendas: salesStats.salesTrend || 0,
          receita: salesStats.revenueTrend || 0,
        });

        // Configurar dados para componentes
        setTopProdutos(topProductsData);
        setProdutosBaixoEstoque(lowStockData);
        setMovimentacoes(transactionsData);
        setCategorias(categoryData);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDadosDashboard();
  }, []);

  // Função para formatar data
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR");
  };

  // Função para renderizar indicador de tendência
  const renderTrend = (valor) => {
    if (valor === 0) return null;

    return (
      <span
        className={`trend-indicator ${valor > 0 ? "positivo" : "negativo"}`}
      >
        {valor > 0 ? <FaArrowUp /> : <FaArrowDown />}
        <span>{Math.abs(valor)}%</span>
      </span>
    );
  };

  if (carregando) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h1>Bem-vindo, {usuario?.nome || "Usuário"}!</h1>
        <p>Aqui está um resumo do seu estoque atual.</p>
      </div>

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
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <FaTrophy className="header-icon" /> Top Produtos
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
                    <th>Receita</th>
                    <th>Desempenho</th>
                  </tr>
                </thead>
                <tbody>
                  {topProdutos.length > 0 ? (
                    topProdutos.map((produto, index) => {
                      // Calcular o progresso relativo para a barra
                      const maxSales = Math.max(
                        ...topProdutos.map((p) => p.salesCount)
                      );
                      const progresso = Math.round(
                        (produto.salesCount / maxSales) * 100
                      );

                      return (
                        <tr key={produto.id || index}>
                          <td>{produto.name}</td>
                          <td>{produto.salesCount} unid.</td>
                          <td>R$ {produto.revenue.toFixed(2)}</td>
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
                      <td colSpan="4" className="no-data">
                        Nenhum dado de vendas disponível
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Produtos com Estoque Baixo */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <FaExclamationTriangle className="header-icon" /> Produtos com
                Estoque Baixo
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
                  {produtosBaixoEstoque.length > 0 ? (
                    produtosBaixoEstoque.map((produto, index) => {
                      // Determinar status
                      let statusClass;
                      let statusText;

                      if (produto.currentStock === 0) {
                        statusClass = "esgotado";
                        statusText = "Esgotado";
                      } else if (produto.currentStock <= produto.minStock / 2) {
                        statusClass = "critico";
                        statusText = "Crítico";
                      } else {
                        statusClass = "baixo";
                        statusText = "Baixo";
                      }

                      return (
                        <tr key={produto.id || index}>
                          <td>{produto.name}</td>
                          <td>{produto.location || "Depósito Principal"}</td>
                          <td>
                            {produto.currentStock} / {produto.minStock}
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
                        Nenhum produto com estoque baixo
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribuição por Categoria */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <FaChartPie className="header-icon" /> Distribuição por
                Categoria
              </h2>
            </div>

            <div className="categorias-container">
              {categorias.length > 0 ? (
                <div className="categorias-grid">
                  {categorias.map((categoria, index) => {
                    const total = categorias.reduce(
                      (sum, cat) => sum + cat.count,
                      0
                    );
                    const percentual = Math.round(
                      (categoria.count / total) * 100
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
                      <div className="categoria-item" key={index}>
                        <div className="categoria-info">
                          <div
                            className="categoria-cor"
                            style={{
                              backgroundColor: cores[index % cores.length],
                            }}
                          ></div>
                          <span className="categoria-nome">
                            {categoria.name}
                          </span>
                        </div>
                        <div className="categoria-dados">
                          <span className="categoria-contagem">
                            {categoria.count}
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
                <div className="no-data">Nenhuma categoria encontrada</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          {/* Movimentações Recentes */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <FaExchangeAlt className="header-icon" /> Movimentações Recentes
              </h2>
              <Link to="/movimentacao" className="btn-sm">
                <FaExchangeAlt /> Nova Movimentação
              </Link>
            </div>

            <div className="movimentacoes-list">
              {movimentacoes.length > 0 ? (
                movimentacoes.map((mov, index) => {
                  // Determinar o tipo de movimentação e ícone
                  let tipoClass;
                  let icone;
                  let tipoTexto;

                  switch (mov.tipo || mov.type) {
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
                    <div className="movimentacao-item" key={mov.id || index}>
                      <div className={`movimentacao-tipo ${tipoClass}`}>
                        {icone}
                      </div>

                      <div className="movimentacao-info">
                        <h4>{tipoTexto}</h4>
                        <p className="produto">
                          {mov.produto?.nome || mov.productName}
                        </p>
                        <p className="detalhes">
                          {tipoClass === "transferencia"
                            ? `${mov.localOrigem || mov.origin} → ${
                                mov.localDestino || mov.destination
                              }`
                            : `${
                                mov.localOrigem ||
                                mov.location ||
                                "Local não especificado"
                              }`}
                        </p>
                      </div>

                      <div className="movimentacao-quantidade">
                        <span className="quantidade">
                          {mov.quantidade || mov.quantity}
                        </span>
                        <span className="data">
                          {formatarData(mov.data || mov.date)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-data">Nenhuma movimentação recente</div>
              )}
            </div>

            <Link to="/historico" className="ver-tudo-link">
              Ver todas as movimentações
            </Link>
          </div>

          {/* Últimas Transações */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <FaShoppingCart className="header-icon" /> Últimas Transações
              </h2>
              <Link to="/vendas" className="btn-sm">
                <FaPlus /> Nova Venda
              </Link>
            </div>

            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.filter(
                    (m) => m.tipo === "venda" || m.type === "sale"
                  ).length > 0 ? (
                    movimentacoes
                      .filter((m) => m.tipo === "venda" || m.type === "sale")
                      .slice(0, 5)
                      .map((venda, index) => {
                        // Determinar status da venda
                        let statusClass;
                        const status = venda.status || "Concluída";

                        switch (status.toLowerCase()) {
                          case "concluída":
                          case "concluida":
                          case "completed":
                            statusClass = "concluido";
                            break;
                          case "pendente":
                          case "pending":
                            statusClass = "pendente";
                            break;
                          case "cancelada":
                          case "cancelled":
                            statusClass = "cancelado";
                            break;
                          default:
                            statusClass = "outro";
                        }

                        return (
                          <tr key={venda.id || index}>
                            <td>#{venda.id || index + 1000}</td>
                            <td>
                              {venda.cliente ||
                                venda.customerName ||
                                "Cliente não especificado"}
                            </td>
                            <td>
                              R$ {(venda.valor || venda.total || 0).toFixed(2)}
                            </td>
                            <td>
                              <span className={`status-badge ${statusClass}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">
                        Nenhuma venda recente
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Link to="/vendas" className="ver-tudo-link">
              Ver todas as vendas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
