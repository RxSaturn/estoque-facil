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
  FaExclamationCircle,
  FaInfoCircle,
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
  const [carregando, setCarregando] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [activeTab, setActiveTab] = useState("geral");
  const [erroCarregamento, setErroCarregamento] = useState(null);
  const [preferenciaSalva, setPreferenciaSalva] = useState(false);
  const [produtosEstoqueCritico, setProdutosEstoqueCritico] = useState([]);

  // Novo estado para selecionar o tipo de cálculo
  const [metodoCalculo, setMetodoCalculo] = useState("transacoes");

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

    // Converter para string no formato ISO (YYYY-MM-DD) sem manipulações adicionais
    const dataInicioStr = inicio.toISOString().split("T")[0];
    const dataFimStr = hoje.toISOString().split("T")[0];

    console.log("Período predefinido:", {
      periodo,
      dataInicio: dataInicioStr,
      dataFim: dataFimStr,
    });

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

  // IMPORTANTE: carregarResumo deve ser declarado ANTES do useEffect que o utiliza
  const carregarResumo = useCallback(async () => {
    try {
      setCarregando(true);
      setErroCarregamento(null);

      // Log para depuração
      console.log("Enviando datas:", {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
      });

      // Garantir que estamos usando o formato ISO (YYYY-MM-DD) diretamente
      // Construir query string com os valores exatos dos inputs, sem manipulação
      let query = `dataInicio=${encodeURIComponent(filtros.dataInicio)}&dataFim=${encodeURIComponent(filtros.dataFim)}`;

      if (filtros.tipo) query += `&tipo=${encodeURIComponent(filtros.tipo)}`;
      if (filtros.categoria) query += `&categoria=${encodeURIComponent(filtros.categoria)}`;
      if (filtros.subcategoria)
        query += `&subcategoria=${encodeURIComponent(filtros.subcategoria)}`;
      if (filtros.local) query += `&local=${encodeURIComponent(filtros.local)}`;
      query += `&metodoCalculo=${encodeURIComponent(metodoCalculo)}`;

      // Adicionar flag para indicar que queremos usar as datas exatas
      query += `&useExactDates=true`;

      // Resto do código para buscar produtos e resumo...
      // Timeout aumentado para 30s para operações demoradas de relatório
      const resposta = await api.get(`/api/relatorios/resumo?${query}`, {
        timeout: 30000
      });
      
      // Verificar se a resposta contém dados válidos
      if (resposta.data) {
        setResumo(resposta.data);
        setErroCarregamento(null);
        
        // Verificar se o período não tem vendas e informar o usuário
        if (resposta.data.totalVendas === 0) {
          toast.info("Nenhuma venda encontrada no período selecionado.", {
            toastId: 'no-sales-info',
            autoClose: 5000,
          });
        }
      }

      // Buscar produtos com estoque crítico...
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
      
      // Verificar se é um erro de conexão REAL (flag do interceptor)
      const isConnectionError = error.isConnectionError || 
        error.code === "ECONNREFUSED" || 
        error.code === "ERR_NETWORK" || 
        error.message === "Network Error";
      
      // Tratamento específico para diferentes tipos de erro
      if (isConnectionError && !error.response) {
        setErroCarregamento(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
        // Não mostrar toast aqui, o interceptor já mostra
      } else if (error.response?.status === 400) {
        setErroCarregamento(
          "Parâmetros inválidos. Verifique as datas e filtros selecionados."
        );
        toast.error("Parâmetros inválidos. Verifique os filtros.", {
          toastId: 'params-error',
        });
      } else if (error.response && error.response.status >= 500) {
        // Erro do servidor - NÃO é erro de conexão
        setErroCarregamento(
          "Erro no servidor ao processar a requisição. Tente novamente em alguns instantes."
        );
        toast.error("Erro no servidor. Tente novamente.", {
          toastId: 'server-error',
        });
      } else if (error.response) {
        // Outros erros HTTP com resposta
        setErroCarregamento(
          `Erro ao gerar relatório: ${error.response.data?.mensagem || 'Erro desconhecido'}`
        );
        toast.error("Erro ao gerar relatório. Tente novamente.", {
          toastId: 'report-error',
        });
      } else {
        // Erro genérico
        setErroCarregamento(
          "Não foi possível gerar o relatório. Verifique os filtros e tente novamente."
        );
        toast.error("Erro ao gerar relatório. Tente novamente.", {
          toastId: 'generic-error',
        });
      }
    } finally {
      setCarregando(false);
    }
  }, [filtros.dataInicio, filtros.dataFim, filtros.tipo, filtros.categoria, filtros.subcategoria, filtros.local, metodoCalculo]);

  // Carregar dados de filtro ao montar o componente
  // IMPORTANTE: Removido carregarResumo das dependências para evitar loops infinitos
  // O relatório será gerado apenas quando o usuário clicar em "Gerar Relatório"
  useEffect(() => {
    const carregarOpcoesFiltro = async () => {
      try {
        setErroCarregamento(null);
        setCarregando(true);

        // Carregar tipos de produto
        const resTipos = await api.get("/api/produtos/tipos");
        setTipos(resTipos.data);

        // Carregar categorias iniciais
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

        // Carregar subcategorias iniciais
        if (tipoInicial || categoriaInicial) {
          await carregarSubcategorias(tipoInicial, categoriaInicial);
        }

        // Carregar locais
        const resLocais = await api.get("/api/estoque/locais");
        setLocais(resLocais.data);

        // NÃO chamar carregarResumo aqui automaticamente
        // O usuário deve clicar em "Gerar Relatório"
      } catch (error) {
        console.error("Erro ao carregar opções de filtro:", error);
        setErroCarregamento(
          "Não foi possível carregar os dados iniciais. Verifique sua conexão e tente novamente."
        );
        toast.error("Erro ao carregar dados iniciais. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    };

    carregarOpcoesFiltro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas na montagem

  // Efeito para salvar preferências automaticamente
  useEffect(() => {
    localStorage.setItem("relatorios_filtros", JSON.stringify(filtros));
  }, [filtros]);

  // Adicione este useEffect logo depois dos outros useEffect existentes
  useEffect(() => {
    const carregarProdutosEstoqueCritico = async () => {
      try {
        const resposta = await api.get("/api/estoque/estoque-critico");

        // Organizar dados por status
        const produtos = resposta.data;
        setProdutosEstoqueCritico(produtos);

        // Calcular estatísticas para uso global
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

        // Salvar estatísticas na variável global para uso em diferentes componentes
        window.estoqueCriticoStats = {
          esgotado: esgotados,
          critico: criticos,
          baixo: baixos,
          total: esgotados + criticos + baixos,
        };

        console.log("Estoque crítico carregado:", window.estoqueCriticoStats);
      } catch (error) {
        console.error("Erro ao carregar estoque crítico:", error);
      }
    };

    carregarProdutosEstoqueCritico();
  }, []);

  const gerarRelatorio = (e) => {
    e.preventDefault();
    
    // Validação de datas antes de gerar o relatório
    if (!filtros.dataInicio || !filtros.dataFim) {
      toast.error("Por favor, selecione as datas de início e fim.", {
        toastId: 'date-validation-error',
      });
      return;
    }
    
    const dataInicio = new Date(filtros.dataInicio);
    const dataFim = new Date(filtros.dataFim);
    
    // Verificar se as datas são válidas
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
    
    // Verificar se o período é muito grande (mais de 1 ano pode ser lento)
    const diffTime = Math.abs(dataFim - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      toast.warning("Período muito extenso. O relatório pode demorar para carregar.", {
        toastId: 'long-period-warning',
      });
    }
    
    carregarResumo();
  };

  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;

    // Resetar subcategoria ao mudar tipo
    if (name === "tipo") {
      carregarCategorias(value);
      setFiltros((prev) => ({
        ...prev,
        tipo: value,
        categoria: "",
        subcategoria: "",
      }));
    }
    // Resetar subcategoria ao mudar categoria
    else if (name === "categoria") {
      carregarSubcategorias(filtros.tipo, value);
      setFiltros((prev) => ({ ...prev, categoria: value, subcategoria: "" }));
    }
    // Para outros filtros, apenas atualizar o valor
    else {
      setFiltros((prev) => ({ ...prev, [name]: value }));
    }

    // Se mudar manualmente as datas, resetar o período predefinido
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

    // Resetar a confirmação após 3 segundos
    setTimeout(() => {
      setPreferenciaSalva(false);
    }, 3000);
  };

  const handleDownloadRelatorio = async () => {
    try {
      setGerandoPDF(true);

      // Construir query string com filtros
      let query = `dataInicio=${encodeURIComponent(filtros.dataInicio)}&dataFim=${encodeURIComponent(filtros.dataFim)}`;
      if (filtros.tipo) query += `&tipo=${encodeURIComponent(filtros.tipo)}`;
      if (filtros.categoria) query += `&categoria=${encodeURIComponent(filtros.categoria)}`;
      if (filtros.subcategoria)
        query += `&subcategoria=${encodeURIComponent(filtros.subcategoria)}`;
      if (filtros.local) query += `&local=${encodeURIComponent(filtros.local)}`;
      query += `&metodoCalculo=${encodeURIComponent(metodoCalculo)}`;

      const resposta = await api.get(`/api/relatorios/pdf?${query}`, {
        responseType: "blob",
        timeout: 60000, // 60 segundos para PDFs grandes
      });

      // Criar objeto URL para o blob
      const url = window.URL.createObjectURL(new Blob([resposta.data]));

      // Criar elemento de link e simular clique para download
      const link = document.createElement("a");
      link.href = url;

      // Nome do arquivo para download
      const dataHoje = new Date()
        .toLocaleDateString("pt-BR")
        .replace(/\//g, "-");
      link.setAttribute("download", `estoque-facil-relatorio-${dataHoje}.pdf`);

      document.body.appendChild(link);
      link.click();

      // Limpar após download
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      
      // Tratamento de erros específicos para download de PDF
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

    // Resetar para valores padrão
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

  return (
    <div className="relatorios-container">
      <h1 className="page-title">Relatórios</h1>

      <div className="card filtros-card">
        <h2>
          <FaCalendarAlt /> Período e Filtros
        </h2>

        <form onSubmit={gerarRelatorio}>
          {/* Container flexível para período + método de cálculo */}
          <div className="periodo-metodo-container">
            {/* Períodos predefinidos */}
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

            {/* Método de cálculo reposicionado para ficar ao lado */}
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
                onChange={(e) => {
                  console.log("Data inicial selecionada:", e.target.value);
                  handleChangeFiltro(e);
                }}
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
                onChange={(e) => {
                  console.log("Data final selecionada:", e.target.value);
                  handleChangeFiltro(e);
                }}
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
              disabled={carregando}
            >
              {carregando ? "Gerando..." : "Gerar Relatório"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadRelatorio}
              disabled={!resumo || gerandoPDF}
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

      {erroCarregamento && (
        <div className="erro-card">
          <FaExclamationTriangle className="erro-icon" />
          <p>{erroCarregamento}</p>
        </div>
      )}

      {carregando ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Gerando relatório...</p>
        </div>
      ) : resumo ? (
        <div className="relatorio-resultados">
          {/* Cabeçalho do relatório */}
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
              <div className="sumario-item">
                <p>Total de Produtos</p>
                <h3>{resumo.totalProdutos}</h3>
              </div>

              <div className="sumario-item">
                <p>Total de Vendas</p>
                <h3>{resumo.totalVendas}</h3>
              </div>

              <div className="sumario-item">
                <p>Itens Sem Movimentação</p>
                <h3>{resumo.semMovimentacao}</h3>
              </div>
            </div>
          </div>

          {/* Tabs para visualização de diferentes relatórios */}
          <div className="relatorio-tabs">
            <button
              className={`tab-btn ${activeTab === "geral" ? "active" : ""}`}
              onClick={() => setActiveTab("geral")}
            >
              <FaChartBar /> Visão Geral
            </button>
            <button
              className={`tab-btn ${
                activeTab === "topProdutos" ? "active" : ""
              }`}
              onClick={() => setActiveTab("topProdutos")}
            >
              <FaBoxOpen /> Top Produtos
            </button>
            <button
              className={`tab-btn ${
                activeTab === "semMovimentacao" ? "active" : ""
              }`}
              onClick={() => setActiveTab("semMovimentacao")}
            >
              <FaExclamationTriangle /> Sem Movimentação
            </button>
            <button
              className={`tab-btn ${
                activeTab === "estoqueCritico" ? "active" : ""
              }`}
              onClick={() => setActiveTab("estoqueCritico")}
            >
              <FaExclamationCircle /> Estoque Crítico
            </button>
          </div>

          {/* Conteúdo da tab selecionada */}
          <div className="tab-content">
            {activeTab === "geral" && (
              <div className="tab-geral">
                <div className="graficos-grid">
                  <div className="grafico-card">
                    <h3>Vendas por Categoria</h3>
                    <div className="grafico">
                      {resumo.vendasPorCategoria.labels.length > 0 ? (
                        <Bar
                          data={{
                            labels: resumo.vendasPorCategoria.labels,
                            datasets: [
                              {
                                label: "Quantidade Vendida",
                                data: resumo.vendasPorCategoria.dados,
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
                      {resumo.estoquePorLocal.labels.length > 0 ? (
                        <Pie
                          data={{
                            labels: resumo.estoquePorLocal.labels,
                            datasets: [
                              {
                                data: resumo.estoquePorLocal.dados,
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
                    <div className="indicador">
                      <p className="indicador-titulo">
                        Média{" "}
                        {metodoCalculo === "transacoes"
                          ? "de Vendas"
                          : "de Itens Vendidos"}{" "}
                        Diária
                      </p>
                      <p className="indicador-valor">
                        {resumo.mediaVendasDiarias.toFixed(2)}
                      </p>
                    </div>

                    <div className="indicador">
                      <p className="indicador-titulo">
                        Total de Itens Vendidos
                      </p>
                      <p className="indicador-valor">
                        {resumo.totalItensVendidos}
                      </p>
                    </div>

                    <div className="indicador">
                      <p className="indicador-titulo">Dia com Maior Venda</p>
                      <p className="indicador-valor">
                        {resumo.diaMaiorVenda
                          ? (() => {
                              try {
                                // CORREÇÃO: Adicionar método que evita problemas de fuso horário
                                // Usando uma abordagem que preserva a data exata
                                const [ano, mes, dia] =
                                  resumo.diaMaiorVenda.split("-");

                                // IMPORTANTE: Usar essa sintaxe para evitar problemas de fuso horário
                                // Mês no formato MM e não zero-indexed
                                return `${dia.padStart(2, "0")}/${mes.padStart(
                                  2,
                                  "0"
                                )}/${ano}`;
                              } catch (e) {
                                console.error(
                                  "Erro ao formatar data:",
                                  e,
                                  resumo.diaMaiorVenda
                                );
                                return resumo.diaMaiorVenda;
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
                          resumo.produtosEstoqueCritico ||
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

                {resumo.topProdutos.length > 0 ? (
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
                        {resumo.topProdutos.map((item, index) => (
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

                {resumo.topProdutos.length > 0 && (
                  <div className="grafico-barra-horizontal">
                    <Bar
                      data={{
                        labels: resumo.topProdutos
                          .slice(0, 10)
                          .map((item) => item.nome),
                        datasets: [
                          {
                            label:
                              metodoCalculo === "transacoes"
                                ? "Número de Vendas"
                                : "Quantidade Vendida",
                            data: resumo.topProdutos
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
                )}
              </div>
            )}

            {activeTab === "semMovimentacao" && (
              <div className="tab-sem-movimentacao">
                <h3>Produtos Sem Movimentação</h3>

                {resumo.produtosSemMovimentacao.length > 0 ? (
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
                ) : (
                  <p className="no-data-message">
                    Todos os produtos tiveram movimentação no período
                    selecionado.
                  </p>
                )}

                {resumo.produtosSemMovimentacao.length > 0 &&
                  resumo.estoqueSemMovimentacao.labels.length > 0 && (
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
                          // Normalizar campos
                          const nome =
                            produto.produtoNome || produto.nome || "Produto";
                          const local =
                            produto.local || "Local não especificado";
                          const quantidade = produto.quantidade || 0;
                          const estoqueMinimo = produto.estoqueMinimo || 20;

                          // Determinar status
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

                          // Determinar texto do status
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
                    {carregando
                      ? "Carregando dados de estoque..."
                      : "Nenhum produto com estoque crítico encontrado."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relatorio-placeholder">
          <FaFileAlt className="placeholder-icon" />
          <h2>Gere um relatório</h2>
          <p>
            Configure os filtros acima e clique em "Gerar Relatório" para
            visualizar os resultados.
          </p>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
