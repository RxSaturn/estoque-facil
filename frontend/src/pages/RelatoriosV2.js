import React, { useState, useEffect, useCallback } from "react";
import {
  FaFileAlt,
  FaDownload,
  FaChartBar,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaBoxOpen,
  FaClock,
  FaSave,
  FaTimes,
  FaExchangeAlt,
  FaInfoCircle,
  FaChartPie,
  FaTable,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import api from "../services/api";
import useRelatorioV2, { periodosPredefinidos } from "../hooks/useRelatorioV2";
import SearchableSelect from "../components/SearchableSelect";
import "./RelatoriosV2.css";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Componentes de Skeleton para loading
const SkeletonCard = () => (
  <div className="skeleton-card-v2">
    <div className="skeleton-line skeleton-title"></div>
    <div className="skeleton-line skeleton-value"></div>
  </div>
);

const SkeletonChart = () => (
  <div className="skeleton-chart-v2">
    <div className="skeleton-line skeleton-title"></div>
    <div className="skeleton-chart-content"></div>
  </div>
);

const SkeletonTable = ({ rows = 5 }) => (
  <div className="skeleton-table-v2">
    <div className="skeleton-table-header">
      <div className="skeleton-line"></div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton-table-row">
        <div className="skeleton-line"></div>
      </div>
    ))}
  </div>
);

// Componente de card sem dados
const NoDataCard = ({ message, hint }) => (
  <div className="no-data-card-v2">
    <FaInfoCircle className="icon" />
    <p className="message">{message || "Nenhum dado encontrado"}</p>
    {hint && <p className="hint">{hint}</p>}
  </div>
);

const RelatoriosV2 = () => {
  // Carregar preferências salvas do localStorage
  const carregarPreferencias = () => {
    const salvo = localStorage.getItem("relatorios_filtros_v2");
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch (e) {
        console.error("Erro ao carregar preferências:", e);
      }
    }

    return {
      dataInicio: new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toISOString()
        .split("T")[0],
      dataFim: new Date().toISOString().split("T")[0],
      tipo: "",
      categoria: "",
      subcategoria: "",
      local: "",
    };
  };

  // Estados
  const [filtros, setFiltros] = useState(carregarPreferencias());
  const [metodoCalculo, setMetodoCalculo] = useState("transacoes");
  const [periodoPreDefinido, setPeriodoPreDefinido] = useState("personalizado");
  const [activeTab, setActiveTab] = useState("geral");
  const [preferenciaSalva, setPreferenciaSalva] = useState(false);

  // Opções de filtro
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [filtrosCarregados, setFiltrosCarregados] = useState(false);

  // Hook de relatório V2
  const { dados, loading, error, gerandoPDF, gerarRelatorio, baixarPDF, limparDados } = useRelatorioV2();

  // Carregar categorias quando tipo mudar
  const carregarCategorias = useCallback(async (tipo = "") => {
    try {
      let url = "/api/produtos/categorias";
      if (tipo) {
        url += `?tipo=${tipo}`;
      }
      const resposta = await api.get(url);
      setCategorias(resposta.data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  }, []);

  // Carregar subcategorias quando tipo ou categoria mudar
  const carregarSubcategorias = useCallback(async (tipo = "", categoria = "") => {
    try {
      let url = "/api/produtos/subcategorias";
      const params = [];
      if (tipo) params.push(`tipo=${tipo}`);
      if (categoria) params.push(`categoria=${categoria}`);
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      const resposta = await api.get(url);
      setSubcategorias(resposta.data);
    } catch (error) {
      console.error("Erro ao carregar subcategorias:", error);
    }
  }, []);

  // Carregar dados de filtro ao montar
  useEffect(() => {
    const carregarOpcoesFiltro = async () => {
      try {
        const resTipos = await api.get("/api/produtos/tipos");
        setTipos(resTipos.data);

        const preferencias = carregarPreferencias();
        const tipoInicial = preferencias.tipo || "";
        const categoriaInicial = preferencias.categoria || "";

        if (tipoInicial) {
          await carregarCategorias(tipoInicial);
        } else {
          await carregarCategorias();
        }

        if (tipoInicial || categoriaInicial) {
          await carregarSubcategorias(tipoInicial, categoriaInicial);
        }

        const resLocais = await api.get("/api/estoque/locais");
        setLocais(resLocais.data);

        setFiltrosCarregados(true);
      } catch (error) {
        console.error("Erro ao carregar opções de filtro:", error);
        toast.error("Erro ao carregar dados iniciais.");
      }
    };

    carregarOpcoesFiltro();
  }, [carregarCategorias, carregarSubcategorias]);

  // Salvar preferências automaticamente
  useEffect(() => {
    localStorage.setItem("relatorios_filtros_v2", JSON.stringify(filtros));
  }, [filtros]);

  // Aplicar período predefinido
  const aplicarPeriodoPredefinido = useCallback((periodo) => {
    if (periodo === "personalizado") return;

    const periodos = {
      ultimaSemana: periodosPredefinidos.ultimaSemana,
      ultimoMes: periodosPredefinidos.ultimoMes,
      ultimoTrimestre: periodosPredefinidos.ultimoTrimestre,
      ultimoAno: periodosPredefinidos.ultimoAno,
      mesAtual: periodosPredefinidos.mesAtual,
      anoAtual: periodosPredefinidos.anoAtual,
    };

    if (periodos[periodo]) {
      const { dataInicio, dataFim } = periodos[periodo]();
      setFiltros((prev) => ({ ...prev, dataInicio, dataFim }));
    }

    setPeriodoPreDefinido(periodo);
  }, []);

  // Handlers
  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;

    if (name === "tipo") {
      carregarCategorias(value);
      setFiltros((prev) => ({
        ...prev,
        tipo: value,
        categoria: "",
        subcategoria: "",
      }));
    } else if (name === "categoria") {
      carregarSubcategorias(filtros.tipo, value);
      setFiltros((prev) => ({ ...prev, categoria: value, subcategoria: "" }));
    } else {
      setFiltros((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "dataInicio" || name === "dataFim") {
      setPeriodoPreDefinido("personalizado");
    }
  };

  const handleChangePeriodo = (e) => {
    aplicarPeriodoPredefinido(e.target.value);
  };

  const handleChangeMetodoCalculo = (e) => {
    setMetodoCalculo(e.target.value);
  };

  const handleGerarRelatorio = (e) => {
    e.preventDefault();
    gerarRelatorio({ ...filtros, metodoCalculo });
  };

  const handleBaixarPDF = () => {
    baixarPDF({ ...filtros, metodoCalculo });
  };

  const salvarPreferencias = () => {
    localStorage.setItem("relatorios_filtros_v2", JSON.stringify(filtros));
    setPreferenciaSalva(true);
    toast.success("Preferências salvas com sucesso!");
    setTimeout(() => setPreferenciaSalva(false), 3000);
  };

  const limparFiltros = () => {
    const hoje = new Date();
    const mesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());

    setFiltros({
      dataInicio: mesAtras.toISOString().split("T")[0],
      dataFim: hoje.toISOString().split("T")[0],
      tipo: "",
      categoria: "",
      subcategoria: "",
      local: "",
    });
    setPeriodoPreDefinido("personalizado");
    limparDados();
    toast.info("Filtros resetados com sucesso!");
  };

  // Verificar se há dados
  const hasData = dados && dados.sucesso;

  return (
    <div className="relatorios-v2-container">
      <h1 className="page-title">
        <FaChartBar /> Relatórios
      </h1>

      {/* Card de Filtros */}
      <div className="filtros-card-v2">
        <h2>
          <FaCalendarAlt /> Período e Filtros
        </h2>

        <form onSubmit={handleGerarRelatorio}>
          {/* Período e Método de Cálculo */}
          <div className="filtros-header">
            <div className="filtros-header-item">
              <label>
                <FaClock /> Período Predefinido:
              </label>
              <select value={periodoPreDefinido} onChange={handleChangePeriodo}>
                <option value="personalizado">Personalizado</option>
                <option value="ultimaSemana">Última Semana</option>
                <option value="ultimoMes">Último Mês</option>
                <option value="ultimoTrimestre">Último Trimestre</option>
                <option value="ultimoAno">Último Ano</option>
                <option value="mesAtual">Mês Atual</option>
                <option value="anoAtual">Ano Atual</option>
              </select>
            </div>

            <div className="filtros-header-item">
              <label>
                <FaExchangeAlt /> Método de Cálculo:
              </label>
              <select value={metodoCalculo} onChange={handleChangeMetodoCalculo}>
                <option value="transacoes">Número de Vendas (Transações)</option>
                <option value="quantidade">Quantidade Vendida</option>
              </select>
              <small className="help-text">
                {metodoCalculo === "transacoes"
                  ? "Classifica por número de transações"
                  : "Classifica por quantidade total"}
              </small>
            </div>
          </div>

          {/* Grid de Filtros */}
          <div className="filtros-grid-v2">
            <div className="form-group-v2">
              <label htmlFor="dataInicio">Data Inicial</label>
              <input
                type="date"
                id="dataInicio"
                name="dataInicio"
                value={filtros.dataInicio}
                onChange={handleChangeFiltro}
                required
              />
            </div>

            <div className="form-group-v2">
              <label htmlFor="dataFim">Data Final</label>
              <input
                type="date"
                id="dataFim"
                name="dataFim"
                value={filtros.dataFim}
                onChange={handleChangeFiltro}
                required
                min={filtros.dataInicio}
              />
            </div>

            <div className="form-group-v2">
              <label htmlFor="tipo">Tipo de Produto</label>
              <SearchableSelect
                id="tipo"
                name="tipo"
                value={filtros.tipo}
                onChange={handleChangeFiltro}
                options={tipos}
                placeholder="Selecione um tipo"
                emptyOptionLabel="Todos"
                noResultsText="Nenhum tipo encontrado"
              />
            </div>

            <div className="form-group-v2">
              <label htmlFor="categoria">Categoria</label>
              <SearchableSelect
                id="categoria"
                name="categoria"
                value={filtros.categoria}
                onChange={handleChangeFiltro}
                options={categorias}
                placeholder="Selecione uma categoria"
                emptyOptionLabel="Todas"
                disabled={!filtros.tipo}
                noResultsText="Nenhuma categoria encontrada"
              />
            </div>

            <div className="form-group-v2">
              <label htmlFor="subcategoria">Subcategoria</label>
              <SearchableSelect
                id="subcategoria"
                name="subcategoria"
                value={filtros.subcategoria}
                onChange={handleChangeFiltro}
                options={subcategorias}
                placeholder="Selecione uma subcategoria"
                emptyOptionLabel="Todas"
                disabled={!filtros.categoria}
                noResultsText="Nenhuma subcategoria encontrada"
              />
            </div>

            <div className="form-group-v2">
              <label htmlFor="local">Local</label>
              <SearchableSelect
                id="local"
                name="local"
                value={filtros.local}
                onChange={handleChangeFiltro}
                options={locais}
                placeholder="Selecione um local"
                emptyOptionLabel="Todos"
                noResultsText="Nenhum local encontrado"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="filtros-actions-v2">
            <button
              type="submit"
              className="btn-gerar"
              disabled={loading || !filtrosCarregados}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span> Gerando...
                </>
              ) : (
                <>
                  <FaChartBar /> Gerar Relatório
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-pdf"
              onClick={handleBaixarPDF}
              disabled={gerandoPDF || !filtros.dataInicio || !filtros.dataFim}
            >
              <FaDownload /> {gerandoPDF ? "Gerando PDF..." : "Baixar PDF"}
            </button>

            <button
              type="button"
              className="btn-salvar"
              onClick={salvarPreferencias}
            >
              <FaSave /> {preferenciaSalva ? "Salvo!" : "Salvar Preferências"}
            </button>

            <button
              type="button"
              className="btn-limpar"
              onClick={limparFiltros}
            >
              <FaTimes /> Limpar
            </button>
          </div>
        </form>
      </div>

      {/* Erro */}
      {error && (
        <div className="erro-card-v2">
          <FaExclamationTriangle className="erro-icon" />
          <p>{error}</p>
        </div>
      )}

      {/* Placeholder (antes de gerar) */}
      {!hasData && !loading && !error && (
        <div className="relatorio-placeholder-v2">
          <FaFileAlt className="placeholder-icon" />
          <h2>Gere um relatório</h2>
          <p>
            Configure os filtros acima e clique em "Gerar Relatório" para
            visualizar os resultados. Os dados serão carregados de forma otimizada.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="relatorio-resultados-v2">
          <div className="relatorio-header-v2">
            <div className="relatorio-info">
              <div className="skeleton-line skeleton-header-title"></div>
              <div className="skeleton-line skeleton-header-subtitle"></div>
            </div>
            <div className="resumo-cards">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>

          <div className="graficos-grid-v2">
            <SkeletonChart />
            <SkeletonChart />
          </div>

          <SkeletonTable rows={8} />
        </div>
      )}

      {/* Resultados */}
      {hasData && !loading && (
        <div className="relatorio-resultados-v2">
          {/* Cabeçalho */}
          <div className="relatorio-header-v2">
            <div className="relatorio-info">
              <h2>Relatório de Estoque e Vendas</h2>
              <p>
                Período: {new Date(dados.periodo.inicio).toLocaleDateString("pt-BR")} a{" "}
                {new Date(dados.periodo.fim).toLocaleDateString("pt-BR")}
              </p>
              {filtros.tipo && <p>Tipo: {filtros.tipo}</p>}
              {filtros.categoria && <p>Categoria: {filtros.categoria}</p>}
              {filtros.local && <p>Local: {filtros.local}</p>}
              <p>
                Método: {metodoCalculo === "transacoes" ? "Número de vendas" : "Quantidade vendida"}
              </p>
            </div>

            <div className="resumo-cards">
              <div className="resumo-card">
                <p>Total Produtos</p>
                <h3>{dados.resumo.totalProdutos}</h3>
              </div>
              <div className="resumo-card">
                <p>Total Vendas</p>
                <h3>{dados.resumo.totalVendas}</h3>
              </div>
              <div className="resumo-card">
                <p>Itens Vendidos</p>
                <h3>{dados.resumo.totalItensVendidos}</h3>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="relatorio-tabs-v2">
            <button
              className={`tab-btn-v2 ${activeTab === "geral" ? "active" : ""}`}
              onClick={() => setActiveTab("geral")}
            >
              <FaChartPie /> Visão Geral
            </button>
            <button
              className={`tab-btn-v2 ${activeTab === "topProdutos" ? "active" : ""}`}
              onClick={() => setActiveTab("topProdutos")}
            >
              <FaBoxOpen /> Top Produtos
            </button>
            <button
              className={`tab-btn-v2 ${activeTab === "todosProdutos" ? "active" : ""}`}
              onClick={() => setActiveTab("todosProdutos")}
            >
              <FaTable /> Todos os Produtos
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          <div className="tab-content-v2">
            {/* Tab: Visão Geral */}
            {activeTab === "geral" && (
              <div>
                {/* Gráficos */}
                <div className="graficos-grid-v2">
                  <div className="grafico-card-v2">
                    <h3>Vendas por Categoria</h3>
                    <div className="grafico-container">
                      {dados.graficos.vendasPorCategoria.labels.length > 0 ? (
                        <Bar
                          data={{
                            labels: dados.graficos.vendasPorCategoria.labels,
                            datasets: [
                              {
                                label: "Quantidade Vendida",
                                data: dados.graficos.vendasPorCategoria.dados,
                                backgroundColor: "rgba(37, 99, 235, 0.6)",
                                borderColor: "rgba(37, 99, 235, 1)",
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                          }}
                        />
                      ) : (
                        <p style={{ color: "#9CA3AF" }}>Sem dados para exibir</p>
                      )}
                    </div>
                  </div>

                  <div className="grafico-card-v2">
                    <h3>Estoque por Local</h3>
                    <div className="grafico-container">
                      {dados.graficos.estoquePorLocal.labels.length > 0 ? (
                        <Pie
                          data={{
                            labels: dados.graficos.estoquePorLocal.labels,
                            datasets: [
                              {
                                data: dados.graficos.estoquePorLocal.dados,
                                backgroundColor: [
                                  "rgba(37, 99, 235, 0.7)",
                                  "rgba(16, 185, 129, 0.7)",
                                  "rgba(245, 158, 11, 0.7)",
                                  "rgba(239, 68, 68, 0.7)",
                                  "rgba(139, 92, 246, 0.7)",
                                  "rgba(236, 72, 153, 0.7)",
                                ],
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      ) : (
                        <p style={{ color: "#9CA3AF" }}>Sem dados para exibir</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="estatisticas-section">
                  <h3>Estatísticas do Período</h3>
                  <div className="estatisticas-grid">
                    <div className="estatistica-card">
                      <p className="titulo">
                        Média {metodoCalculo === "transacoes" ? "de Vendas" : "de Itens"} Diária
                      </p>
                      <p className="valor">{dados.resumo.mediaVendasDiarias}</p>
                    </div>

                    <div className="estatistica-card">
                      <p className="titulo">Total de Itens Vendidos</p>
                      <p className="valor">{dados.resumo.totalItensVendidos}</p>
                    </div>

                    <div className="estatistica-card">
                      <p className="titulo">Dia com Maior Venda</p>
                      <p className="valor">
                        {dados.resumo.diaMaiorVenda
                          ? (() => {
                              const [ano, mes, dia] = dados.resumo.diaMaiorVenda.data.split("-");
                              return `${dia}/${mes}/${ano}`;
                            })()
                          : "-"}
                      </p>
                    </div>

                    <div className="estatistica-card">
                      <p className="titulo">Produtos Vendidos</p>
                      <p className="valor">{dados.tabelas.todosProdutos.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Top Produtos */}
            {activeTab === "topProdutos" && (
              <div className="tabela-section">
                <h3>
                  Top Produtos {metodoCalculo === "transacoes" ? "por Número de Vendas" : "por Quantidade"}
                </h3>

                {dados.tabelas.topProdutos.length > 0 ? (
                  <>
                    <div className="table-responsive-v2">
                      <table className="relatorio-table-v2">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Produto</th>
                            <th>Tipo</th>
                            <th>Categoria</th>
                            <th>{metodoCalculo === "transacoes" ? "Nº Vendas" : "Quantidade"}</th>
                            <th>% do Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dados.tabelas.topProdutos.map((item, index) => (
                            <tr key={index}>
                              <td>{item.id}</td>
                              <td>{item.nome}</td>
                              <td>{item.tipo}</td>
                              <td>{item.categoria}</td>
                              <td>
                                {metodoCalculo === "transacoes" ? item.vendas : item.quantidade}
                              </td>
                              <td>{item.percentual}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Gráfico de barras horizontais */}
                    <div className="chart-container-fixed">
                      <Bar
                        data={{
                          labels: dados.tabelas.topProdutos.slice(0, 10).map((item) => item.nome),
                          datasets: [
                            {
                              label: metodoCalculo === "transacoes" ? "Nº de Vendas" : "Quantidade",
                              data: dados.tabelas.topProdutos
                                .slice(0, 10)
                                .map((item) =>
                                  metodoCalculo === "transacoes" ? item.vendas : item.quantidade
                                ),
                              backgroundColor: "rgba(37, 99, 235, 0.6)",
                              borderColor: "rgba(37, 99, 235, 1)",
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          indexAxis: "y",
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: {
                              display: true,
                              text: `Top 10 Produtos ${
                                metodoCalculo === "transacoes"
                                  ? "por Número de Vendas"
                                  : "por Quantidade"
                              }`,
                            },
                          },
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <NoDataCard
                    message="Nenhuma venda registrada no período selecionado."
                    hint="Tente ajustar o período ou os filtros para ver resultados."
                  />
                )}
              </div>
            )}

            {/* Tab: Todos os Produtos */}
            {activeTab === "todosProdutos" && (
              <div className="tabela-section">
                <h3>Todos os Produtos Vendidos no Período</h3>

                {dados.tabelas.todosProdutos.length > 0 ? (
                  <div className="table-responsive-v2">
                    <table className="relatorio-table-v2">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Produto</th>
                          <th>Tipo</th>
                          <th>Categoria</th>
                          <th>Qtd Vendida</th>
                          <th>Nº Vendas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.tabelas.todosProdutos.map((item, index) => (
                          <tr key={index}>
                            <td>{item.id}</td>
                            <td>{item.nome}</td>
                            <td>{item.tipo}</td>
                            <td>{item.categoria}</td>
                            <td>{item.qtdVendida}</td>
                            <td>{item.nVendas}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="table-footer-row">
                          <td colSpan={4}>TOTAL</td>
                          <td>
                            {dados.tabelas.todosProdutos.reduce((sum, p) => sum + p.qtdVendida, 0)}
                          </td>
                          <td>
                            {dados.tabelas.todosProdutos.reduce((sum, p) => sum + p.nVendas, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <NoDataCard
                    message="Nenhum produto vendido no período selecionado."
                    hint="Tente ajustar o período ou os filtros para ver resultados."
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatoriosV2;
