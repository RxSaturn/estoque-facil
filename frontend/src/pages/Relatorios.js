import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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
  FaExclamationCircle,
  FaInfoCircle,
  FaSync,
} from "react-icons/fa";
import api from "../services/api";
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
import SearchableSelect from "../components/SearchableSelect";
import "./Relatorios.css";

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

// Componente Skeleton para loading
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-line skeleton-title"></div>
    <div className="skeleton-line skeleton-value"></div>
  </div>
);

const SkeletonChart = () => (
  <div className="skeleton-chart">
    <div className="skeleton-line skeleton-title"></div>
    <div className="skeleton-chart-content"></div>
  </div>
);

const SkeletonTable = ({ rows = 5 }) => (
  <div className="skeleton-table">
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

// Componente de erro para seções individuais
const SectionError = ({ message, onRetry }) => (
  <div className="section-error">
    <FaExclamationCircle className="error-icon" />
    <p>{message || "Erro ao carregar dados"}</p>
    {onRetry && (
      <button className="btn btn-sm btn-outline" onClick={onRetry}>
        <FaSync /> Tentar novamente
      </button>
    )}
  </div>
);

const Relatorios = () => {
  // Carregar preferências salvas do localStorage, se existirem
  const carregarPreferencias = () => {
    const salvo = localStorage.getItem("relatorios_filtros");
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch (e) {
        console.error("Erro ao carregar preferências:", e);
      }
    }

    // Valores padrão se não houver preferências
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

  const [filtros, setFiltros] = useState(carregarPreferencias());
  const [periodoPreDefinido, setPeriodoPreDefinido] = useState("personalizado");
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [activeTab, setActiveTab] = useState("geral");
  const [preferenciaSalva, setPreferenciaSalva] = useState(false);
  const [produtosEstoqueCritico, setProdutosEstoqueCritico] = useState([]);
  const [filtrosCarregados, setFiltrosCarregados] = useState(false);

  // Estado para controlar se deve buscar dados
  const [shouldFetch, setShouldFetch] = useState(false);

  // Novo estado para selecionar o tipo de cálculo
  const [metodoCalculo, setMetodoCalculo] = useState("transacoes");

  // Construir query string
  const buildQueryString = useCallback(() => {
    let query = `dataInicio=${encodeURIComponent(filtros.dataInicio)}&dataFim=${encodeURIComponent(filtros.dataFim)}`;
    if (filtros.tipo) query += `&tipo=${encodeURIComponent(filtros.tipo)}`;
    if (filtros.categoria) query += `&categoria=${encodeURIComponent(filtros.categoria)}`;
    if (filtros.subcategoria) query += `&subcategoria=${encodeURIComponent(filtros.subcategoria)}`;
    if (filtros.local) query += `&local=${encodeURIComponent(filtros.local)}`;
    query += `&metodoCalculo=${encodeURIComponent(metodoCalculo)}`;
    query += `&useExactDates=true`;
    return query;
  }, [filtros, metodoCalculo]);

  // React Query para estatísticas (stats cards) - novo endpoint granular
  const {
    data: statsData,
    isFetching: isFetchingStats,
    isError: isErrorStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["stats", filtros, metodoCalculo],
    queryFn: async () => {
      const response = await api.get(`/api/relatorios/stats?${buildQueryString()}`);
      return response.data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  });

  // React Query para gráfico de vendas ao longo do tempo
  const {
    data: chartsSalesData,
    isFetching: isFetchingChartsSales,
  } = useQuery({
    queryKey: ["chartsSales", filtros, metodoCalculo],
    queryFn: async () => {
      const response = await api.get(`/api/relatorios/charts/sales?${buildQueryString()}`);
      return response.data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // React Query para gráfico de vendas por categoria
  const {
    data: chartsCategoriesData,
    isFetching: isFetchingChartsCategories,
    isError: isErrorChartsCategories,
    refetch: refetchChartsCategories,
  } = useQuery({
    queryKey: ["chartsCategories", filtros, metodoCalculo],
    queryFn: async () => {
      const response = await api.get(`/api/relatorios/charts/categories?${buildQueryString()}`);
      return response.data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // React Query para gráfico de estoque por local
  const {
    data: chartsStockData,
    isFetching: isFetchingChartsStock,
    isError: isErrorChartsStock,
    refetch: refetchChartsStock,
  } = useQuery({
    queryKey: ["chartsStock", filtros],
    queryFn: async () => {
      const response = await api.get(`/api/relatorios/charts/stock?${buildQueryString()}`);
      return response.data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // React Query para top produtos
  const {
    data: topProdutosData,
    isFetching: isFetchingTopProdutos,
    isError: isErrorTopProdutos,
    refetch: refetchTopProdutos,
  } = useQuery({
    queryKey: ["topProdutos", filtros, metodoCalculo],
    queryFn: async () => {
      const response = await api.get(`/api/relatorios/top-produtos-otimizado?${buildQueryString()}&limite=20`);
      return response.data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // React Query para resumo completo (para abas que precisam de mais dados - produtos sem movimentação)
  const {
    data: resumo,
    isFetching: isFetchingResumo,
    isError: isErrorResumo,
    error: errorResumo,
    refetch: refetchResumo,
  } = useQuery({
    queryKey: ["resumo", filtros, metodoCalculo],
    queryFn: async () => {
      const response = await api.get(`/api/relatorios/resumo?${buildQueryString()}`, {
        timeout: 30000,
      });
      return response.data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // Função para aplicar período predefinido
  const aplicarPeriodoPredefinido = useCallback((periodo) => {
    const hoje = new Date();
    let inicio = new Date();

    switch (periodo) {
      case "ultimaSemana":
        inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - 7);
        break;
      case "ultimoMes":
        inicio = new Date(hoje);
        inicio.setMonth(hoje.getMonth() - 1);
        break;
      case "ultimoTrimestre":
        inicio = new Date(hoje);
        inicio.setMonth(hoje.getMonth() - 3);
        break;
      case "ultimoAno":
        inicio = new Date(hoje);
        inicio.setFullYear(hoje.getFullYear() - 1);
        break;
      case "mesAtual":
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case "anoAtual":
        inicio = new Date(hoje.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    const dataInicioStr = inicio.toISOString().split("T")[0];
    const dataFimStr = hoje.toISOString().split("T")[0];

    setFiltros((prev) => ({
      ...prev,
      dataInicio: dataInicioStr,
      dataFim: dataFimStr,
    }));

    setPeriodoPreDefinido(periodo);
  }, []);

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
      toast.error("Não foi possível carregar as categorias");
    }
  }, []);

  // Carregar subcategorias quando tipo ou categoria mudar
  const carregarSubcategorias = useCallback(
    async (tipo = "", categoria = "") => {
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
        toast.error("Não foi possível carregar as subcategorias");
      }
    },
    []
  );

  // Carregar dados de filtro ao montar o componente
  useEffect(() => {
    const carregarOpcoesFiltro = async () => {
      try {
        const resTipos = await api.get("/api/produtos/tipos");
        setTipos(resTipos.data);

        const tipoSalvo = localStorage.getItem("relatorios_filtros");
        let tipoInicial = "";
        let categoriaInicial = "";
        if (tipoSalvo) {
          try {
            const preferencias = JSON.parse(tipoSalvo);
            tipoInicial = preferencias.tipo || "";
            categoriaInicial = preferencias.categoria || "";
          } catch (e) {
            console.error("Erro ao parsear preferências:", e);
          }
        }

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
        toast.error("Erro ao carregar dados iniciais. Tente novamente.");
      }
    };

    carregarOpcoesFiltro();
  }, [carregarCategorias, carregarSubcategorias]);

  // Efeito para salvar preferências automaticamente
  useEffect(() => {
    localStorage.setItem("relatorios_filtros", JSON.stringify(filtros));
  }, [filtros]);

  // Carregar produtos com estoque crítico
  useEffect(() => {
    const carregarProdutosEstoqueCritico = async () => {
      try {
        const resposta = await api.get("/api/estoque/estoque-critico");
        const produtos = resposta.data;
        setProdutosEstoqueCritico(produtos);

        const esgotados = produtos.filter(
          (p) => p.quantidade === 0 || p.status === "esgotado"
        ).length;
        const criticos = produtos.filter(
          (p) =>
            (p.quantidade > 0 && p.quantidade < 10) || p.status === "critico"
        ).length;
        const baixos = produtos.filter(
          (p) =>
            (p.quantidade >= 10 && p.quantidade < 20) || p.status === "baixo"
        ).length;

        window.estoqueCriticoStats = {
          esgotado: esgotados,
          critico: criticos,
          baixo: baixos,
          total: esgotados + criticos + baixos,
        };
      } catch (error) {
        console.error("Erro ao carregar estoque crítico:", error);
      }
    };

    carregarProdutosEstoqueCritico();
  }, []);

  const gerarRelatorio = (e) => {
    e.preventDefault();
    
    if (!filtros.dataInicio || !filtros.dataFim) {
      toast.error("Por favor, selecione as datas de início e fim.", {
        toastId: 'date-validation-error',
      });
      return;
    }
    
    const dataInicio = new Date(filtros.dataInicio);
    const dataFim = new Date(filtros.dataFim);
    
    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      toast.error("Datas inválidas. Verifique o formato das datas.", {
        toastId: 'invalid-date-error',
      });
      return;
    }
    
    if (dataInicio > dataFim) {
      toast.error("A data inicial não pode ser posterior à data final.", {
        toastId: 'date-range-error',
      });
      return;
    }
    
    const diffTime = Math.abs(dataFim - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      toast.warning("Período muito extenso. O relatório pode demorar para carregar.", {
        toastId: 'long-period-warning',
      });
    }
    
    // Ativar busca - React Query will automatically fetch when enabled becomes true
    // No need for setTimeout since queryKey changes trigger refetch
    setShouldFetch(true);
  };

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

  const handleChangeMetodoCalculo = (e) => {
    setMetodoCalculo(e.target.value);
  };

  const handleChangePeriodo = (e) => {
    const periodo = e.target.value;
    aplicarPeriodoPredefinido(periodo);
  };

  const salvarPreferencias = () => {
    localStorage.setItem("relatorios_filtros", JSON.stringify(filtros));
    setPreferenciaSalva(true);
    toast.success("Preferências de filtro salvas com sucesso!");

    setTimeout(() => {
      setPreferenciaSalva(false);
    }, 3000);
  };

  const handleDownloadRelatorio = async () => {
    try {
      setGerandoPDF(true);

      let query = `dataInicio=${encodeURIComponent(filtros.dataInicio)}&dataFim=${encodeURIComponent(filtros.dataFim)}`;
      if (filtros.tipo) query += `&tipo=${encodeURIComponent(filtros.tipo)}`;
      if (filtros.categoria) query += `&categoria=${encodeURIComponent(filtros.categoria)}`;
      if (filtros.subcategoria)
        query += `&subcategoria=${encodeURIComponent(filtros.subcategoria)}`;
      if (filtros.local) query += `&local=${encodeURIComponent(filtros.local)}`;
      query += `&metodoCalculo=${encodeURIComponent(metodoCalculo)}`;

      const resposta = await api.get(`/api/relatorios/pdf?${query}`, {
        responseType: "blob",
        timeout: 60000,
      });

      const url = window.URL.createObjectURL(new Blob([resposta.data]));
      const link = document.createElement("a");
      link.href = url;

      const dataHoje = new Date()
        .toLocaleDateString("pt-BR")
        .replace(/\//g, "-");
      link.setAttribute("download", `estoque-facil-relatorio-${dataHoje}.pdf`);

      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        toast.error("O relatório está demorando muito. Tente filtrar por um período menor.", {
          toastId: 'pdf-timeout-error',
        });
      } else if (error.response?.status === 404) {
        toast.error("Nenhum dado encontrado para gerar o relatório.", {
          toastId: 'pdf-nodata-error',
        });
      } else if (error.response?.status >= 500) {
        toast.error("Erro no servidor ao gerar PDF. Tente novamente mais tarde.", {
          toastId: 'pdf-server-error',
        });
      } else {
        toast.error("Erro ao gerar PDF. Verifique sua conexão e tente novamente.", {
          toastId: 'pdf-generic-error',
        });
      }
    } finally {
      setGerandoPDF(false);
    }
  };

  const limparFiltros = () => {
    const hoje = new Date();
    const mesAtras = new Date(
      hoje.getFullYear(),
      hoje.getMonth() - 1,
      hoje.getDate()
    );

    setFiltros({
      dataInicio: mesAtras.toISOString().split("T")[0],
      dataFim: hoje.toISOString().split("T")[0],
      tipo: "",
      categoria: "",
      subcategoria: "",
      local: "",
    });

    setPeriodoPreDefinido("personalizado");
    toast.info("Filtros resetados com sucesso!");
  };

  const isLoading = isFetchingStats || isFetchingChartsSales || isFetchingChartsCategories || isFetchingChartsStock || isFetchingTopProdutos || isFetchingResumo;
  const hasData = shouldFetch && (statsData || resumo);

  return (
    <div className="relatorios-container">
      <h1 className="page-title">Relatórios</h1>

      <div className="card filtros-card">
        <h2>
          <FaCalendarAlt /> Período e Filtros
        </h2>

        <form onSubmit={gerarRelatorio}>
          <div className="periodo-metodo-container">
            <div className="periodos-predefinidos">
              <label>
                <FaClock /> Período Predefinido:
              </label>
              <select
                value={periodoPreDefinido}
                onChange={handleChangePeriodo}
                className="periodo-select"
              >
                <option value="personalizado">Personalizado</option>
                <option value="ultimaSemana">Última Semana</option>
                <option value="ultimoMes">Último Mês</option>
                <option value="ultimoTrimestre">Último Trimestre</option>
                <option value="ultimoAno">Último Ano</option>
                <option value="mesAtual">Mês Atual</option>
                <option value="anoAtual">Ano Atual</option>
              </select>
            </div>

            <div className="metodo-calculo">
              <label htmlFor="metodoCalculo">
                <FaExchangeAlt /> Método de Cálculo:
              </label>
              <select
                id="metodoCalculo"
                name="metodoCalculo"
                value={metodoCalculo}
                onChange={handleChangeMetodoCalculo}
              >
                <option value="transacoes">
                  Número de Vendas (Transações)
                </option>
                <option value="quantidade">Quantidade Vendida</option>
              </select>
              <small className="help-text">
                {metodoCalculo === "transacoes"
                  ? "Classifica por número de transações"
                  : "Classifica por quantidade total"}
              </small>
            </div>
          </div>

          <div className="filtros-grid">
            <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-group">
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
          <div className="filtros-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !filtrosCarregados}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner"></span> Gerando...
                </>
              ) : (
                "Gerar Relatório"
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadRelatorio}
              disabled={!hasData || gerandoPDF}
            >
              <FaDownload /> {gerandoPDF ? "Gerando PDF..." : "Baixar PDF"}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={salvarPreferencias}
              title="Salvar estas configurações de filtro"
            >
              <FaSave /> {preferenciaSalva ? "Salvo!" : "Salvar Preferências"}
            </button>

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={limparFiltros}
              title="Resetar todos os filtros"
            >
              <FaTimes /> Limpar
            </button>
          </div>
        </form>
      </div>

      {isErrorResumo && errorResumo && (
        <div className="erro-card">
          <FaExclamationTriangle className="erro-icon" />
          <p>
            {errorResumo?.response?.data?.mensagem || 
             "Erro ao carregar dados. Verifique os filtros e tente novamente."}
          </p>
        </div>
      )}

      {!shouldFetch && !hasData && (
        <div className="relatorio-placeholder">
          <FaFileAlt className="placeholder-icon" />
          <h2>Gere um relatório</h2>
          <p>
            Configure os filtros acima e clique em "Gerar Relatório" para
            visualizar os resultados.
          </p>
        </div>
      )}

      {shouldFetch && (
        <div className="relatorio-resultados">
          <div className="relatorio-header">
            <div>
              <h2>Relatório de Estoque e Vendas</h2>
              <p>
                Período:{" "}
                {new Date(filtros.dataInicio).toLocaleDateString("pt-BR")} a{" "}
                {new Date(filtros.dataFim).toLocaleDateString("pt-BR")}
              </p>
              {filtros.tipo && <p>Tipo: {filtros.tipo}</p>}
              {filtros.categoria && <p>Categoria: {filtros.categoria}</p>}
              {filtros.subcategoria && (
                <p>Subcategoria: {filtros.subcategoria}</p>
              )}
              {filtros.local && <p>Local: {filtros.local}</p>}
              <p>
                Método de cálculo:{" "}
                {metodoCalculo === "transacoes"
                  ? "Número de vendas"
                  : "Quantidade vendida"}
              </p>
            </div>

            <div className="relatorio-sumario">
              {isFetchingStats ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : isErrorStats ? (
                <SectionError 
                  message="Erro ao carregar resumo" 
                  onRetry={() => refetchStats()} 
                />
              ) : (
                <>
                  <div className="sumario-item">
                    <p>Total de Produtos</p>
                    <h3>{statsData?.totalProdutos || resumo?.totalProdutos || 0}</h3>
                  </div>

                  <div className="sumario-item">
                    <p>Total de Vendas</p>
                    <h3>{statsData?.totalVendas || resumo?.totalVendas || 0}</h3>
                  </div>

                  <div className="sumario-item">
                    <p>Estoque Baixo</p>
                    <h3>{statsData?.estoqueBaixo || resumo?.semMovimentacao || 0}</h3>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relatorio-tabs">
            <button
              className={`tab-btn ${activeTab === "geral" ? "active" : ""}`}
              onClick={() => setActiveTab("geral")}
            >
              <FaChartBar /> Visão Geral
            </button>
            <button
              className={`tab-btn ${activeTab === "topProdutos" ? "active" : ""}`}
              onClick={() => setActiveTab("topProdutos")}
            >
              <FaBoxOpen /> Top Produtos
            </button>
            <button
              className={`tab-btn ${activeTab === "semMovimentacao" ? "active" : ""}`}
              onClick={() => setActiveTab("semMovimentacao")}
            >
              <FaExclamationTriangle /> Sem Movimentação
            </button>
            <button
              className={`tab-btn ${activeTab === "estoqueCritico" ? "active" : ""}`}
              onClick={() => setActiveTab("estoqueCritico")}
            >
              <FaExclamationCircle /> Estoque Crítico
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "geral" && (
              <div className="tab-geral">
                <div className="graficos-grid">
                  <div className="grafico-card">
                    <h3>Vendas por Categoria</h3>
                    <div className="grafico">
                      {isFetchingChartsCategories ? (
                        <SkeletonChart />
                      ) : isErrorChartsCategories ? (
                        <SectionError 
                          message="Erro ao carregar gráfico" 
                          onRetry={() => refetchChartsCategories()} 
                        />
                      ) : chartsCategoriesData?.labels?.length > 0 ? (
                        <Bar
                          data={{
                            labels: chartsCategoriesData.labels,
                            datasets: [
                              {
                                label: "Quantidade Vendida",
                                data: chartsCategoriesData.dados,
                                backgroundColor: "rgba(54, 162, 235, 0.6)",
                                borderColor: "rgba(54, 162, 235, 1)",
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                          }}
                        />
                      ) : (
                        <p className="no-data">Sem dados para exibir</p>
                      )}
                    </div>
                  </div>

                  <div className="grafico-card">
                    <h3>Estoque por Local</h3>
                    <div className="grafico">
                      {isFetchingChartsStock ? (
                        <SkeletonChart />
                      ) : isErrorChartsStock ? (
                        <SectionError 
                          message="Erro ao carregar gráfico" 
                          onRetry={() => refetchChartsStock()} 
                        />
                      ) : chartsStockData?.labels?.length > 0 ? (
                        <Pie
                          data={{
                            labels: chartsStockData.labels,
                            datasets: [
                              {
                                data: chartsStockData.dados,
                                backgroundColor: [
                                  "rgba(54, 162, 235, 0.6)",
                                  "rgba(255, 99, 132, 0.6)",
                                  "rgba(255, 206, 86, 0.6)",
                                  "rgba(75, 192, 192, 0.6)",
                                  "rgba(153, 102, 255, 0.6)",
                                  "rgba(255, 159, 64, 0.6)",
                                ],
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{ responsive: true }}
                        />
                      ) : (
                        <p className="no-data">Sem dados para exibir</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="indicadores">
                  <h3>Estatísticas do Período</h3>
                  <div className="indicadores-grid">
                    {isFetchingStats || isFetchingChartsSales ? (
                      <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                      </>
                    ) : (
                      <>
                        <div className="indicador">
                          <p className="indicador-titulo">
                            Média{" "}
                            {metodoCalculo === "transacoes"
                              ? "de Vendas"
                              : "de Itens Vendidos"}{" "}
                            Diária
                          </p>
                          <p className="indicador-valor">
                            {statsData?.mediaVendasDiarias?.toFixed(2) || resumo?.mediaVendasDiarias?.toFixed(2) || "0.00"}
                          </p>
                        </div>

                        <div className="indicador">
                          <p className="indicador-titulo">
                            Total de Itens Vendidos
                          </p>
                          <p className="indicador-valor">
                            {statsData?.totalItensVendidos || resumo?.totalItensVendidos || 0}
                          </p>
                        </div>

                        <div className="indicador">
                          <p className="indicador-titulo">Dia com Maior Venda</p>
                          <p className="indicador-valor">
                            {(chartsSalesData?.diaMaiorVenda || resumo?.diaMaiorVenda)
                              ? (() => {
                                  try {
                                    const diaMaiorVenda = chartsSalesData?.diaMaiorVenda || resumo?.diaMaiorVenda;
                                    const [ano, mes, dia] = diaMaiorVenda.split("-");
                                    return `${dia.padStart(2, "0")}/${mes.padStart(
                                      2,
                                      "0"
                                    )}/${ano}`;
                                  } catch (e) {
                                    return chartsSalesData?.diaMaiorVenda || resumo?.diaMaiorVenda;
                                  }
                                })()
                              : "-"}
                          </p>
                        </div>

                        <div className="indicador">
                          <p className="indicador-titulo">
                            Produtos com Estoque Crítico
                          </p>
                          <p className="indicador-valor estoque-critico">
                            {window.estoqueCriticoStats?.critico +
                              window.estoqueCriticoStats?.esgotado ||
                              resumo?.produtosEstoqueCritico ||
                              0}
                            <span className="indicador-info">
                              {window.estoqueCriticoStats?.esgotado > 0 && (
                                <span className="nivel-badge esgotado">
                                  {window.estoqueCriticoStats.esgotado} esgotados
                                </span>
                              )}
                              {window.estoqueCriticoStats?.critico > 0 && (
                                <span className="nivel-badge critico">
                                  {window.estoqueCriticoStats.critico} críticos
                                </span>
                              )}
                              {!window.estoqueCriticoStats?.esgotado &&
                                !window.estoqueCriticoStats?.critico &&
                                "Menos de 10 unidades"}
                            </span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "topProdutos" && (
              <div className="tab-top-produtos">
                <h3>
                  Top Produtos{" "}
                  {metodoCalculo === "transacoes"
                    ? "por Número de Vendas"
                    : "por Quantidade Vendida"}
                </h3>

                {isFetchingTopProdutos || isFetchingResumo ? (
                  <SkeletonTable rows={10} />
                ) : isErrorTopProdutos && isErrorResumo ? (
                  <SectionError 
                    message="Erro ao carregar produtos" 
                    onRetry={() => {
                      refetchTopProdutos();
                      refetchResumo();
                    }} 
                  />
                ) : (topProdutosData?.topProdutos?.length > 0 || resumo?.topProdutos?.length > 0) ? (
                  <>
                    <div className="table-responsive">
                      <table className="relatorio-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Produto</th>
                            <th>Tipo</th>
                            <th>Categoria</th>
                            <th>Subcategoria</th>
                            <th>
                              {metodoCalculo === "transacoes"
                                ? "Número de Vendas"
                                : "Quantidade Vendida"}
                            </th>
                            <th>% do Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(topProdutosData?.topProdutos || resumo?.topProdutos || []).map((item, index) => (
                            <tr key={index}>
                              <td>{item.id}</td>
                              <td>{item.nome}</td>
                              <td>{item.tipo}</td>
                              <td>{item.categoria}</td>
                              <td>{item.subcategoria || "-"}</td>
                              <td>
                                {metodoCalculo === "transacoes"
                                  ? item.transacoes
                                  : item.quantidade}
                              </td>
                              <td>{item.percentual}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grafico-barra-horizontal">
                      <Bar
                        data={{
                          labels: (topProdutosData?.topProdutos || resumo?.topProdutos || [])
                            .slice(0, 10)
                            .map((item) => item.nome),
                          datasets: [
                            {
                              label:
                                metodoCalculo === "transacoes"
                                  ? "Número de Vendas"
                                  : "Quantidade Vendida",
                              data: (topProdutosData?.topProdutos || resumo?.topProdutos || [])
                                .slice(0, 10)
                                .map((item) =>
                                  metodoCalculo === "transacoes"
                                    ? item.transacoes
                                    : item.quantidade
                                ),
                              backgroundColor: "rgba(54, 162, 235, 0.6)",
                              borderColor: "rgba(54, 162, 235, 1)",
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          indexAxis: "y",
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            title: {
                              display: true,
                              text: `Top 10 Produtos ${
                                metodoCalculo === "transacoes"
                                  ? "por Número de Vendas"
                                  : "por Quantidade Vendida"
                              }`,
                            },
                          },
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="no-data-info-card">
                    <FaInfoCircle className="info-icon" />
                    <p className="no-data-message">
                      Nenhuma venda registrada no período selecionado.
                    </p>
                    <p className="no-data-hint">
                      Tente ajustar o período ou os filtros para ver resultados.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "semMovimentacao" && (
              <div className="tab-sem-movimentacao">
                <h3>Produtos Sem Movimentação</h3>

                {isFetchingResumo ? (
                  <SkeletonTable rows={8} />
                ) : isErrorResumo ? (
                  <SectionError 
                    message="Erro ao carregar dados" 
                    onRetry={() => refetchResumo()} 
                  />
                ) : resumo?.produtosSemMovimentacao?.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <table className="relatorio-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Produto</th>
                            <th>Tipo</th>
                            <th>Categoria</th>
                            <th>Subcategoria</th>
                            <th>Local</th>
                            <th>Estoque</th>
                            <th>Última Movimentação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumo.produtosSemMovimentacao.map((item, index) => (
                            <tr key={index}>
                              <td>{item.id}</td>
                              <td>{item.nome}</td>
                              <td>{item.tipo}</td>
                              <td>{item.categoria}</td>
                              <td>{item.subcategoria || "-"}</td>
                              <td>{item.local}</td>
                              <td>{item.quantidade}</td>
                              <td>
                                {item.ultimaMovimentacao
                                  ? new Date(
                                      item.ultimaMovimentacao
                                    ).toLocaleDateString("pt-BR")
                                  : "Nunca"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {resumo.estoqueSemMovimentacao?.labels?.length > 0 && (
                      <div className="grafico-sem-movimentacao">
                        <h4>
                          Distribuição de Produtos sem Movimentação por Local
                        </h4>
                        <Pie
                          data={{
                            labels: resumo.estoqueSemMovimentacao.labels,
                            datasets: [
                              {
                                data: resumo.estoqueSemMovimentacao.dados,
                                backgroundColor: [
                                  "rgba(255, 99, 132, 0.6)",
                                  "rgba(54, 162, 235, 0.6)",
                                  "rgba(255, 206, 86, 0.6)",
                                  "rgba(75, 192, 192, 0.6)",
                                  "rgba(153, 102, 255, 0.6)",
                                  "rgba(255, 159, 64, 0.6)",
                                ],
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              title: {
                                display: true,
                                text: "Produtos sem Movimentação por Local",
                              },
                            },
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="no-data-message">
                    Todos os produtos tiveram movimentação no período
                    selecionado.
                  </p>
                )}
              </div>
            )}

            {activeTab === "estoqueCritico" && (
              <div className="tab-estoque-critico">
                <h3>Produtos com Estoque Crítico</h3>

                <div className="estoque-status-summary">
                  <div className="estoque-status-card esgotado">
                    <h4>Esgotado</h4>
                    <p className="estoque-count">
                      {
                        produtosEstoqueCritico.filter(
                          (p) => p.quantidade === 0 || p.status === "esgotado"
                        ).length
                      }
                    </p>
                    <p className="estoque-desc">0 unidades</p>
                  </div>
                  <div className="estoque-status-card critico">
                    <h4>Crítico</h4>
                    <p className="estoque-count">
                      {
                        produtosEstoqueCritico.filter(
                          (p) =>
                            (p.quantidade > 0 && p.quantidade < 10) ||
                            p.status === "critico"
                        ).length
                      }
                    </p>
                    <p className="estoque-desc">Menos de 10 unidades</p>
                  </div>
                  <div className="estoque-status-card baixo">
                    <h4>Baixo</h4>
                    <p className="estoque-count">
                      {
                        produtosEstoqueCritico.filter(
                          (p) =>
                            (p.quantidade >= 10 && p.quantidade < 20) ||
                            p.status === "baixo"
                        ).length
                      }
                    </p>
                    <p className="estoque-desc">Entre 10 e 19 unidades</p>
                  </div>
                </div>

                {produtosEstoqueCritico.length > 0 ? (
                  <div className="table-responsive">
                    <table className="relatorio-table">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>Local</th>
                          <th>Estoque Atual</th>
                          <th>Estoque Mínimo</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produtosEstoqueCritico.map((produto, index) => {
                          const nome =
                            produto.produtoNome || produto.nome || "Produto";
                          const local =
                            produto.local || "Local não especificado";
                          const quantidade = produto.quantidade || 0;
                          const estoqueMinimo = produto.estoqueMinimo || 20;

                          let status = produto.status || "";
                          if (!status) {
                            if (quantidade === 0) {
                              status = "esgotado";
                            } else if (quantidade < 10) {
                              status = "critico";
                            } else if (quantidade < 20) {
                              status = "baixo";
                            } else {
                              status = "normal";
                            }
                          }

                          let statusText;
                          switch (status) {
                            case "esgotado":
                              statusText = "Esgotado";
                              break;
                            case "critico":
                              statusText = "Crítico";
                              break;
                            case "baixo":
                              statusText = "Baixo";
                              break;
                            default:
                              statusText = "Normal";
                          }

                          return (
                            <tr key={index}>
                              <td>{nome}</td>
                              <td>{local}</td>
                              <td className={`quantidade ${status}`}>
                                {quantidade}
                              </td>
                              <td>{estoqueMinimo}</td>
                              <td>
                                <span className={`status-badge ${status}`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data-message">
                    {isLoading
                      ? "Carregando dados de estoque..."
                      : "Nenhum produto com estoque crítico encontrado."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
