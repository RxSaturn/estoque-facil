import React, { useState, useEffect, useCallback } from "react";
import {
  FaShoppingCart,
  FaExchangeAlt,
  FaSearch,
  FaCalendarAlt,
  FaFilter,
  FaTimes,
  FaBoxes,
  FaArrowRight,
  FaExclamationTriangle,
  FaPen,
  FaTrash,
} from "react-icons/fa";
import api from "../services/api";
import { toast } from "react-toastify";
import Paginacao from "../components/Paginacao";
import "./Historico.css";

const Historico = () => {
  // Funções de utilidade para manipulação de datas
  // Função para obter a data de hoje no formato YYYY-MM-DD
  const obterDataHoje = () => {
    const hoje = new Date();
    return hoje.toISOString().split("T")[0];
  };

  // Função para obter a data de um mês atrás no formato YYYY-MM-DD
  const obterDataUmMesAtras = () => {
    const dataAtras = new Date();
    dataAtras.setMonth(dataAtras.getMonth() - 1);
    return dataAtras.toISOString().split("T")[0];
  };

  const [activeTab, setActiveTab] = useState("vendas");
  const [vendas, setVendas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [filtros, setFiltros] = useState({
    dataInicio: obterDataUmMesAtras(),
    dataFim: obterDataHoje(),
    produto: "",
    local: "",
    tipo: "",
  });

  const [filtroAvancado, setFiltroAvancado] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Estado para paginação separado por tipo de visualização
  const [paginacaoVendas, setPaginacaoVendas] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
  });

  const [paginacaoMovimentacoes, setPaginacaoMovimentacoes] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
  });

  // Estados para a exclusão de movimentações
  const [excluirId, setExcluirId] = useState(null);
  const [movimentacaoExcluir, setMovimentacaoExcluir] = useState(null);
  const [excluindoMovimentacao, setExcluindoMovimentacao] = useState(false);
  const [erroExclusao, setErroExclusao] = useState(null);

  const [modalExclusaoEmLote, setModalExclusaoEmLote] = useState(false);
  const [quantidadeExclusaoEmLote, setQuantidadeExclusaoEmLote] = useState(0);
  const [carregandoExclusaoEmLote, setCarregandoExclusaoEmLote] =
    useState(false);

  const tiposMovimentacao = [
    { value: "", label: "Todos os tipos" },
    { value: "entrada", label: "Entrada de Estoque" },
    { value: "saida", label: "Saída de Estoque" },
    { value: "transferencia", label: "Transferência" },
    { value: "venda", label: "Venda" },
    { value: "atualizacao", label: "Atualização de Produto" },
  ];

  // Função para lidar com a mudança de página para vendas com useCallback
  const handleVendasPageChange = useCallback((page) => {
    console.log("Página de vendas alterada para:", page);
    setPaginacaoVendas((prev) => ({ ...prev, currentPage: page }));
  }, []);

  // Função para lidar com a mudança de itens por página para vendas com useCallback
  const handleVendasItemsPerPageChange = useCallback((itemsPerPage) => {
    console.log("Itens por página de vendas alterados para:", itemsPerPage);
    setPaginacaoVendas((prev) => ({ ...prev, itemsPerPage, currentPage: 1 }));
  }, []);

  // Função para lidar com a mudança de página para movimentações com useCallback
  const handleMovimentacoesPageChange = useCallback((page) => {
    console.log("Página de movimentações alterada para:", page);
    setPaginacaoMovimentacoes((prev) => ({ ...prev, currentPage: page }));
  }, []);

  // Função para lidar com a mudança de itens por página para movimentações com useCallback
  const handleMovimentacoesItemsPerPageChange = useCallback((itemsPerPage) => {
    console.log(
      "Itens por página de movimentações alterados para:",
      itemsPerPage
    );
    setPaginacaoMovimentacoes((prev) => ({
      ...prev,
      itemsPerPage,
      currentPage: 1,
    }));
  }, []);

  // Função para calcular a diferença em dias entre duas datas
  const calcularDiferencaDias = (dataString) => {
    const data = new Date(dataString);
    const dataAtual = new Date();

    // Calcular diferença em milissegundos e converter para dias
    const diferencaMilissegundos = dataAtual - data;
    const diferencaDias = Math.floor(
      diferencaMilissegundos / (1000 * 60 * 60 * 24)
    );

    return diferencaDias;
  };

  const getEfeitosExclusao = (mov) => {
    // Verificar se é uma atualização de produto
    const isAtualizacao =
      mov.tipo === "atualizacao" ||
      (mov.tipo === "entrada" &&
        mov.observacao?.includes("Produto atualizado"));

    // Verificar se é uma movimentação de produto potencialmente removido
    const isProdutoRemovido =
      !mov.produto || mov.observacao?.includes("removido");

    // Retornar efeitos específicos baseados no tipo da movimentação
    if (isAtualizacao) {
      return (
        <li>
          Remover este registro de atualização do histórico (sem alterações no
          estoque)
        </li>
      );
    } else if (mov.tipo === "saida") {
      return (
        <li>
          Remover este registro de saída do histórico (sem alterações no
          estoque)
        </li>
      );
    } else if (isProdutoRemovido) {
      return (
        <li>
          Remover este registro do histórico (sem alterações, pois o produto não
          existe mais)
        </li>
      );
    } else if (mov.tipo === "entrada") {
      return (
        <li>
          Retirar {mov.quantidade} unidades do estoque em {mov.localOrigem}
        </li>
      );
    } else if (mov.tipo === "transferencia") {
      return (
        <>
          <li>
            Devolver {mov.quantidade} unidades ao estoque em {mov.localOrigem}
          </li>
          <li>
            Retirar {mov.quantidade} unidades do estoque em {mov.localDestino}
          </li>
        </>
      );
    } else {
      return <li>Remover este registro do histórico</li>;
    }
  };

  // Adicione estas novas funções para a exclusão em lote
  const verificarMovimentacoesProdutosRemovidos = async () => {
    try {
      setCarregandoExclusaoEmLote(true);

      const resposta = await api.delete(
        "/api/movimentacoes/produtos-removidos?preview=true"
      );

      setQuantidadeExclusaoEmLote(resposta.data.quantidade);

      if (resposta.data.quantidade > 0) {
        setModalExclusaoEmLote(true);
      } else {
        toast.info("Não há movimentações de produtos removidos para excluir.");
      }
    } catch (error) {
      console.error("Erro ao verificar movimentações:", error);
      toast.error("Erro ao verificar movimentações de produtos removidos.");
    } finally {
      setCarregandoExclusaoEmLote(false);
    }
  };

  const excluirMovimentacoesProdutosRemovidos = async () => {
    try {
      setCarregandoExclusaoEmLote(true);

      const resposta = await api.delete(
        "/api/movimentacoes/produtos-removidos"
      );

      toast.success(resposta.data.mensagem);
      setModalExclusaoEmLote(false);

      // Recarregar os dados para atualizar a lista
      await carregarHistorico();
    } catch (error) {
      console.error("Erro ao excluir movimentações:", error);
      toast.error("Erro ao excluir movimentações de produtos removidos.");
    } finally {
      setCarregandoExclusaoEmLote(false);
    }
  };

  const fecharModalExclusaoEmLote = () => {
    setModalExclusaoEmLote(false);
  };

  // Funções para exclusão de movimentações
  const confirmarExclusaoMovimentacao = (movimentacao) => {
    setMovimentacaoExcluir(movimentacao);
    setExcluirId(movimentacao._id);
    setErroExclusao(null);
  };

  const cancelarExclusaoMovimentacao = () => {
    setMovimentacaoExcluir(null);
    setExcluirId(null);
    setErroExclusao(null);
    setExcluindoMovimentacao(false);
  };

  const excluirMovimentacao = async () => {
    if (!excluirId) return;

    try {
      setExcluindoMovimentacao(true);

      // Chamar a API para excluir a movimentação
      const response = await api.delete(`/api/movimentacoes/${excluirId}`);

      // Atualizar a lista de movimentações
      await carregarHistorico();

      toast.success(
        response.data.mensagem || "Movimentação excluída com sucesso!"
      );

      // Fechar o modal
      cancelarExclusaoMovimentacao();
    } catch (error) {
      console.error("Erro ao excluir movimentação:", error);

      // Melhorar a exibição do erro com detalhes quando disponíveis
      const mensagemPrincipal =
        error.response?.data?.mensagem ||
        "Erro ao excluir movimentação. Tente novamente.";

      const detalheErro = error.response?.data?.detalhe;

      setErroExclusao(
        <div>
          <p>{mensagemPrincipal}</p>
          {detalheErro && <p className="erro-detalhe">{detalheErro}</p>}
        </div>
      );

      toast.error(mensagemPrincipal);
      setExcluindoMovimentacao(false);
    }
  };

  // Funções auxiliares para lidar com dados possivelmente nulos
  const getProdutoNome = (mov) => {
    // Identificar movimentações de produto novo
    if (
      !mov.produto &&
      mov.tipo === "entrada" &&
      mov.observacao?.includes("Registro inicial de produto")
    ) {
      return "Produto Novo Adicionado";
    }

    // Identificar movimentações de remoção de produto
    if (
      !mov.produto &&
      (mov.tipo === "saida" || mov.observacao?.includes("removido"))
    ) {
      return "Produto Removido";
    }

    return mov?.produto?.nome || "Produto não disponível";
  };

  const getProdutoId = (mov) => {
    return mov?.produto?.id || "";
  };

  // Função melhorada para obter o nome do usuário
  const getNomeUsuario = (realizadoPor) => {
    // Verificar se realizadoPor é um objeto com nome
    if (realizadoPor && typeof realizadoPor === "object" && realizadoPor.nome) {
      return realizadoPor.nome;
    }

    // Verificar se é um ID e buscar no array de usuários
    if (realizadoPor && typeof realizadoPor === "string") {
      const usuario = usuarios.find((u) => u._id === realizadoPor);
      if (usuario) return usuario.nome;
    }

    return "Usuário";
  };

  // Efeito para garantir que as datas estejam sempre definidas
  useEffect(() => {
    // Verifica se as datas estão indefinidas e define valores padrão se necessário
    const valoresAtualizados = {};
    let precisaAtualizar = false;

    if (!filtros.dataInicio) {
      valoresAtualizados.dataInicio = obterDataUmMesAtras();
      precisaAtualizar = true;
    }

    if (!filtros.dataFim) {
      valoresAtualizados.dataFim = obterDataHoje();
      precisaAtualizar = true;
    }

    if (precisaAtualizar) {
      console.log("Definindo valores padrão para datas:", valoresAtualizados);
      setFiltros((prev) => ({ ...prev, ...valoresAtualizados }));
    }
  }, [filtros.dataInicio, filtros.dataFim]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        setErro(null);

        // Carregar produtos e locais para filtros
        const resProdutos = await api.get("/api/produtos");
        setProdutos(resProdutos.data.produtos || []);

        const resLocais = await api.get("/api/estoque/locais");
        setLocais(resLocais.data || []);

        try {
          const resUsuarios = await api.get("/api/usuarios");
          console.log("Usuários carregados:", resUsuarios.data);
          setUsuarios(resUsuarios.data || []);
        } catch (err) {
          console.warn("Não foi possível carregar usuários:", err);
          setUsuarios([]);
        }

        // Carregar vendas e movimentações iniciais
        await carregarHistorico();
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast.error("Erro ao carregar dados. Tente novamente.");
        setErro("Falha ao carregar dados iniciais");
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efeito para recarregar quando a paginação mudar
  useEffect(() => {
    if (!carregando && activeTab === "vendas") {
      carregarHistorico();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginacaoVendas.currentPage, paginacaoVendas.itemsPerPage]);

  // Efeito para recarregar quando a paginação mudar
  useEffect(() => {
    if (!carregando && activeTab === "movimentacoes") {
      carregarHistorico();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginacaoMovimentacoes.currentPage, paginacaoMovimentacoes.itemsPerPage]);

  // Modificar a função carregarHistorico para tratar datas corretamente e usar paginação
  const carregarHistorico = async () => {
    try {
      setCarregando(true);
      setErro(null);

      // Converter datas para objetos Date com hora explícita para evitar problemas de fuso horário
      const dataInicio = new Date(`${filtros.dataInicio}T00:00:00.000Z`);
      const dataFim = new Date(`${filtros.dataFim}T23:59:59.999Z`);

      // Carregar vendas quando a aba vendas estiver ativa ou for a primeira carga
      if (activeTab === "vendas" || vendas.length === 0) {
        try {
          // Construir query string com filtros e paginação
          let queryVendas = `dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`;
          if (filtros.produto) queryVendas += `&produto=${filtros.produto}`;
          if (filtros.local) queryVendas += `&local=${filtros.local}`;

          // Adicionar parâmetros de paginação
          queryVendas += `&page=${paginacaoVendas.currentPage}&limit=${paginacaoVendas.itemsPerPage}`;

          const resVendas = await api.get(
            `/api/vendas/historico?${queryVendas}`
          );
          console.log("Resposta de vendas:", resVendas.data);

          // Atualizar total de itens para paginação
          if (resVendas.data && Array.isArray(resVendas.data)) {
            setVendas(resVendas.data);
            setPaginacaoVendas((prev) => ({
              ...prev,
              totalItems: resVendas.data.length,
            }));
          } else if (resVendas.data && Array.isArray(resVendas.data.vendas)) {
            setVendas(resVendas.data.vendas);
            setPaginacaoVendas((prev) => ({
              ...prev,
              totalItems: resVendas.data.total || resVendas.data.vendas.length,
            }));
          } else {
            console.warn(
              "Formato da resposta de vendas inesperado:",
              resVendas.data
            );
            setVendas([]);
          }
        } catch (err) {
          console.error("Erro ao carregar vendas:", err);
          setVendas([]);
          if (activeTab === "vendas") {
            toast.error("Erro ao carregar histórico de vendas");
          }
        }
      }

      // Carregar movimentações quando a aba movimentações estiver ativa ou for a primeira carga
      if (activeTab === "movimentacoes" || movimentacoes.length === 0) {
        try {
          // Construir query para movimentações
          let queryMovimentacoes = `dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`;
          if (filtros.produto)
            queryMovimentacoes += `&produto=${filtros.produto}`;
          if (filtros.local)
            queryMovimentacoes += `&localOrigem=${filtros.local}`;
          if (filtros.tipo) queryMovimentacoes += `&tipo=${filtros.tipo}`;

          // Adicionar parâmetros de paginação
          queryMovimentacoes += `&page=${paginacaoMovimentacoes.currentPage}&limit=${paginacaoMovimentacoes.itemsPerPage}`;

          const resMovimentacoes = await api.get(
            `/api/movimentacoes/historico?${queryMovimentacoes}`
          );
          const movs = resMovimentacoes.data.movimentacoes || [];

          // Log para debug das primeiras movimentações
          console.log(
            "Movimentações carregadas (primeiras 2):",
            movs.slice(0, 2)
          );

          // Aceitar todas as movimentações, mesmo com produto nulo
          setMovimentacoes(movs);

          // Atualizar total de itens para paginação
          setPaginacaoMovimentacoes((prev) => ({
            ...prev,
            totalItems:
              resMovimentacoes.data.total || resMovimentacoes.data.contagem,
          }));

          console.log(
            `Carregadas ${
              resMovimentacoes.data.movimentacoes?.length || 0
            } movimentações de um total de ${
              resMovimentacoes.data.total || "desconhecido"
            }`
          );
        } catch (err) {
          console.error("Erro ao carregar movimentações:", err);
          setMovimentacoes([]);
          if (activeTab === "movimentacoes") {
            toast.error("Erro ao carregar histórico de movimentações");
            setErro("Falha ao carregar histórico de movimentações");
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast.error("Erro ao carregar histórico. Tente novamente.");
      setErro("Falha ao carregar dados de histórico");
    } finally {
      setCarregando(false);
    }
  };

  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = (e) => {
    e.preventDefault();

    // Resetar paginação ao aplicar novos filtros
    if (activeTab === "vendas") {
      setPaginacaoVendas((prev) => ({ ...prev, currentPage: 1 }));
    } else {
      setPaginacaoMovimentacoes((prev) => ({ ...prev, currentPage: 1 }));
    }

    carregarHistorico();
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: obterDataUmMesAtras(),
      dataFim: obterDataHoje(),
      produto: "",
      local: "",
      tipo: "",
    });

    // Resetar paginação ao limpar filtros
    if (activeTab === "vendas") {
      setPaginacaoVendas((prev) => ({ ...prev, currentPage: 1 }));
    } else {
      setPaginacaoMovimentacoes((prev) => ({ ...prev, currentPage: 1 }));
    }

    setFiltroAvancado(false);
    carregarHistorico();
  };

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      // Recarregar os dados para garantir que estejam atualizados para a aba selecionada
      setTimeout(() => carregarHistorico(), 0);
    }
  };

  // Função melhorada para formatar data no padrão brasileiro dd/mm/yyyy
  const formatarData = (dataString) => {
    try {
      // Para datas no formato YYYY-MM-DD (sem hora), adicionar T00:00:00 para evitar problemas de fuso
      const dataFormatada = dataString.includes("T")
        ? dataString
        : `${dataString}T00:00:00`;
      const data = new Date(dataFormatada);

      // Formatação explícita para DD/MM/YYYY
      const dia = data.getUTCDate().toString().padStart(2, "0");
      const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
      const ano = data.getUTCFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      console.error("Erro ao formatar data:", e, dataString);
      return dataString || "Data não disponível";
    }
  };

  // Função para exibir data formatada para o resumo de período
  const formatarDataResumo = (dataString) => {
    try {
      // Pegar apenas a parte da data (YYYY-MM-DD)
      const dataPura = dataString.split("T")[0];

      // Dividir em ano, mês e dia
      const [ano, mes, dia] = dataPura.split("-");

      // Retornar no formato DD/MM/YYYY
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      console.error("Erro ao formatar data para resumo:", e, dataString);
      return dataString || "Data não disponível";
    }
  };

  // Função atualizada para renderizar o ícone de tipo de movimentação
  const renderIconeTipo = (mov) => {
    // Detectar atualizações pela observação
    if (
      mov.tipo === "entrada" &&
      mov.observacao &&
      mov.observacao.includes("Produto atualizado")
    ) {
      return <FaPen className="icon-atualizacao" />;
    }

    switch (mov.tipo) {
      case "entrada":
        return <FaBoxes className="icon-entrada" />;
      case "saida":
        return <FaBoxes className="icon-saida" />;
      case "transferencia":
        return <FaExchangeAlt className="icon-transferencia" />;
      case "venda":
        return <FaShoppingCart className="icon-venda" />;
      case "atualizacao":
        return <FaPen className="icon-atualizacao" />;
      case "exclusao":
        return <FaTrash className="icon-exclusao" />;
      default:
        return <FaBoxes />;
    }
  };

  // Função atualizada para obter descrição legível do tipo
  const getDescricaoTipo = (mov) => {
    // Se for entrada mas a observação contém "Produto atualizado", é uma atualização
    if (
      mov.tipo === "entrada" &&
      mov.observacao &&
      mov.observacao.includes("Produto atualizado")
    ) {
      return "Atualização de Produto";
    }

    const tipos = {
      entrada: "Entrada de Estoque",
      saida: "Saída de Estoque",
      transferencia: "Transferência",
      venda: "Venda",
      atualizacao: "Atualização de Produto",
      exclusao: "Exclusão de Movimentação",
    };
    return tipos[mov.tipo] || mov.tipo || "Tipo não disponível";
  };

  if (carregando && !vendas.length && !movimentacoes.length) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="historico-container">
      <h1 className="page-title">
        <FaExchangeAlt className="page-icon" /> Histórico do Sistema
      </h1>

      {/* Mensagem de erro */}
      {erro && (
        <div className="error-message">
          <FaExclamationTriangle /> {erro}
        </div>
      )}

      {/* Tabs de navegação */}
      <div className="historico-tabs">
        <button
          className={`tab-button ${activeTab === "vendas" ? "active" : ""}`}
          onClick={() => handleTabChange("vendas")}
        >
          <FaShoppingCart /> Vendas
        </button>
        <button
          className={`tab-button ${
            activeTab === "movimentacoes" ? "active" : ""
          }`}
          onClick={() => handleTabChange("movimentacoes")}
        >
          <FaExchangeAlt /> Movimentações
        </button>
      </div>

      {/* Card de filtro */}
      <div className="card filtro-card">
        <div className="filtro-header">
          <h2>
            <FaCalendarAlt /> Filtrar{" "}
            {activeTab === "vendas" ? "Vendas" : "Movimentações"}
          </h2>
          <button
            type="button"
            className={`btn btn-outline filter-btn ${
              filtroAvancado ? "active" : ""
            }`}
            onClick={() => setFiltroAvancado(!filtroAvancado)}
          >
            <FaFilter /> Filtros Avançados
          </button>
        </div>

        <form onSubmit={aplicarFiltros}>
          <div className="filtro-basico">
            <div className="form-group">
              <label htmlFor="dataInicio">Data Inicial</label>
              <input
                type="date"
                id="dataInicio"
                name="dataInicio"
                value={filtros.dataInicio}
                onChange={handleChangeFiltro}
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
              />
            </div>

            <button type="submit" className="btn btn-primary">
              <FaSearch /> Buscar
            </button>
          </div>

          {filtroAvancado && (
            <div className="filtro-avancado">
              <div className="form-group">
                <label htmlFor="produto">Produto</label>
                <select
                  id="produto"
                  name="produto"
                  value={filtros.produto}
                  onChange={handleChangeFiltro}
                >
                  <option value="">Todos</option>
                  {produtos.map((produto) => (
                    <option key={produto._id} value={produto._id}>
                      {produto.id} - {produto.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="local">Local</label>
                <select
                  id="local"
                  name="local"
                  value={filtros.local}
                  onChange={handleChangeFiltro}
                >
                  <option value="">Todos</option>
                  {locais.map((local, index) => (
                    <option key={index} value={local}>
                      {local}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === "movimentacoes" && (
                <div className="form-group">
                  <label htmlFor="tipo">Tipo de Movimentação</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={filtros.tipo}
                    onChange={handleChangeFiltro}
                  >
                    {tiposMovimentacao.map((tipo, index) => (
                      <option key={index} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                className="btn btn-outline"
                onClick={limparFiltros}
              >
                <FaTimes /> Limpar Filtros
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Resumo das informações */}
      <div className="resumo-container">
        {activeTab === "vendas" ? (
          /* Resumo de vendas */
          <div className="card resumo-card">
            <h3>Resumo do Período</h3>
            <div className="resumo-info">
              <div className="resumo-item">
                <span>Total de Vendas</span>
                <strong>{paginacaoVendas.totalItems}</strong>
              </div>
              <div className="resumo-item">
                <span>Produtos Vendidos (na página)</span>
                <strong>
                  {vendas.reduce(
                    (total, venda) => total + (venda.quantidade || 0),
                    0
                  )}
                </strong>
              </div>
              <div className="resumo-item">
                <span>Período</span>
                <strong>
                  {formatarDataResumo(filtros.dataInicio)} a{" "}
                  {formatarDataResumo(filtros.dataFim)}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          /* Resumo de movimentações */
          <div className="card resumo-card">
            <h3>Resumo do Período</h3>
            <div className="resumo-info">
              <div className="resumo-item">
                <span>Total de Movimentações</span>
                <strong>{paginacaoMovimentacoes.totalItems}</strong>
              </div>
              <div className="resumo-item">
                <span>Itens Movimentados (na página)</span>
                <strong>
                  {movimentacoes.reduce(
                    (total, mov) => total + (mov.quantidade || 0),
                    0
                  )}
                </strong>
              </div>
              <div className="resumo-item">
                <span>Período</span>
                <strong>
                  {formatarDataResumo(filtros.dataInicio)} a{" "}
                  {formatarDataResumo(filtros.dataFim)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo da tab ativa */}
      <div className="tab-content">
        {activeTab === "vendas" ? (
          /* Conteúdo de Vendas */
          <div className="card">
            <h3>Histórico de Vendas</h3>

            {vendas.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="historico-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Local</th>
                        <th>Registrado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.map((venda, index) => (
                        <tr key={venda._id || index}>
                          <td>{formatarData(venda.dataVenda)}</td>
                          <td>
                            {venda.produto ? (
                              <div className="produto-info">
                                <span className="produto-nome">
                                  {venda.produto.nome}
                                </span>
                                <span className="produto-id">
                                  {venda.produto.id}
                                </span>
                              </div>
                            ) : (
                              <div className="produto-info">
                                <span className="produto-nome">
                                  Produto não disponível
                                </span>
                              </div>
                            )}
                          </td>
                          <td>{venda.quantidade || 0}</td>
                          <td>{venda.local || "Local não especificado"}</td>
                          <td>{getNomeUsuario(venda.registradoPor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Componente de Paginação para Vendas */}
                <Paginacao
                  totalItems={paginacaoVendas.totalItems}
                  onPageChange={handleVendasPageChange}
                  onItemsPerPageChange={handleVendasItemsPerPageChange}
                  pageName="historico_vendas"
                />
              </>
            ) : (
              <div className="empty-state">
                <FaShoppingCart className="icon" />
                <h4>Nenhuma venda encontrada</h4>
                <p className="sub-text">
                  {filtros.produto || filtros.local
                    ? "Tente ajustar os filtros para ver mais resultados"
                    : "Não há vendas registradas no período selecionado"}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Conteúdo de Movimentações */
          <div className="card">
            <h3>Histórico de Movimentações</h3>

            {movimentacoes.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="historico-table movimentacao-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Locais</th>
                        <th>Realizado por</th>
                        <th>Ações</th> {/* Nova coluna para ações */}
                      </tr>
                    </thead>
                    <tbody>
                      {movimentacoes.map((mov, index) => {
                        // Determinar se é uma atualização baseado na observação
                        const isAtualizacao =
                          mov.tipo === "atualizacao" ||
                          (mov.tipo === "entrada" &&
                            mov.observacao &&
                            mov.observacao.includes("Produto atualizado"));
                        const rowClass = isAtualizacao
                          ? "atualizacao"
                          : mov.tipo || "sem-tipo";

                        // Calcular diferença de dias para determinar se pode ser excluída
                        const diferencaDias = calcularDiferencaDias(mov.data);

                        return (
                          <tr
                            key={mov._id || index}
                            className={`movimentacao-row ${rowClass}`}
                          >
                            <td>{formatarData(mov.data)}</td>
                            <td>
                              <div className="tipo-movimentacao">
                                {renderIconeTipo(mov)}
                                <span>{getDescricaoTipo(mov)}</span>
                              </div>
                            </td>
                            <td>
                              <div className="produto-info">
                                <span className="produto-nome">
                                  {getProdutoNome(mov)}
                                </span>
                                {mov.produto ? (
                                  <span className="produto-id">
                                    {getProdutoId(mov)}
                                  </span>
                                ) : (
                                  <span className="produto-observacao">
                                    {mov.observacao}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{isAtualizacao ? "-" : mov.quantidade || 0}</td>
                            <td>
                              <div className="locais-info">
                                <span>
                                  {mov.localOrigem || "Local não especificado"}
                                </span>
                                {mov.tipo === "transferencia" &&
                                  mov.localDestino && (
                                    <>
                                      <FaArrowRight className="arrow-icon" />
                                      <span>{mov.localDestino}</span>
                                    </>
                                  )}
                              </div>
                            </td>
                            <td>{getNomeUsuario(mov.realizadoPor)}</td>
                            {/* Nova célula para ações */}
                            <td className="acoes-cell">
                              {mov.tipo !== "exclusao" &&
                                diferencaDias <= 10 && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      confirmarExclusaoMovimentacao(mov)
                                    }
                                    title="Excluir movimentação"
                                  >
                                    <FaTrash /> Excluir
                                  </button>
                                )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Botão de exclusão em lote - NOVO LOCAL */}
                <div className="acoes-lote-container">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={verificarMovimentacoesProdutosRemovidos}
                    disabled={carregandoExclusaoEmLote}
                  >
                    {carregandoExclusaoEmLote ? (
                      <>
                        <span className="spinner-tiny"></span> Verificando...
                      </>
                    ) : (
                      <>
                        <FaTrash /> Remover Movimentações de Produtos Excluídos
                      </>
                    )}
                  </button>
                </div>
                {/* Componente de Paginação para Movimentações */}
                <Paginacao
                  totalItems={paginacaoMovimentacoes.totalItems}
                  onPageChange={handleMovimentacoesPageChange}
                  onItemsPerPageChange={handleMovimentacoesItemsPerPageChange}
                  pageName="historico_movimentacoes"
                />
              </>
            ) : (
              <div className="empty-state">
                <FaExchangeAlt className="icon" />
                <h4>Nenhuma movimentação encontrada</h4>
                <p className="sub-text">
                  {filtros.produto || filtros.local || filtros.tipo
                    ? "Tente ajustar os filtros para ver mais resultados"
                    : "Não há movimentações registradas no período selecionado"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {excluirId && movimentacaoExcluir && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirmar Exclusão</h3>

            <div className="movimentacao-excluir-info">
              <p>
                <strong>Tipo:</strong> {getDescricaoTipo(movimentacaoExcluir)}
              </p>

              <p>
                <strong>Produto:</strong>{" "}
                {movimentacaoExcluir.produto?.nome ||
                  getProdutoNome(movimentacaoExcluir)}
              </p>

              <p>
                <strong>Quantidade:</strong> {movimentacaoExcluir.quantidade}
              </p>

              <p>
                <strong>Data:</strong> {formatarData(movimentacaoExcluir.data)}
              </p>

              <div className="exclusao-aviso">
                <FaExclamationTriangle className="aviso-icon" />
                <p>Esta ação irá:</p>
                <ul>{getEfeitosExclusao(movimentacaoExcluir)}</ul>
                <p className="aviso-texto">
                  Esta operação não pode ser desfeita.
                </p>
              </div>

              {erroExclusao && (
                <div className="erro-exclusao">
                  {typeof erroExclusao === "string" ? (
                    <p>{erroExclusao}</p>
                  ) : (
                    erroExclusao
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={cancelarExclusaoMovimentacao}
                disabled={excluindoMovimentacao}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={excluirMovimentacao}
                disabled={excluindoMovimentacao}
              >
                {excluindoMovimentacao ? (
                  <>
                    <span className="spinner-tiny"></span>
                    Excluindo...
                  </>
                ) : (
                  "Confirmar Exclusão"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação para exclusão em lote */}
      {modalExclusaoEmLote && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirmar Exclusão em Lote</h3>

            <div className="exclusao-lote-info">
              <FaExclamationTriangle className="aviso-icon" />
              <p>
                Você está prestes a remover{" "}
                <strong>{quantidadeExclusaoEmLote} movimentações</strong>{" "}
                associadas a produtos que já foram excluídos do sistema.
              </p>

              <div className="exclusao-aviso">
                <p>Esta ação irá:</p>
                <ul>
                  <li>
                    Remover permanentemente todas as movimentações de produtos
                    que não existem mais no sistema
                  </li>
                  <li>
                    Limpar o histórico para mostrar apenas movimentações de
                    produtos ativos
                  </li>
                </ul>
                <p className="aviso-texto">
                  Esta operação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={fecharModalExclusaoEmLote}
                disabled={carregandoExclusaoEmLote}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={excluirMovimentacoesProdutosRemovidos}
                disabled={carregandoExclusaoEmLote}
              >
                {carregandoExclusaoEmLote ? (
                  <>
                    <span className="spinner-tiny"></span>
                    Excluindo {quantidadeExclusaoEmLote} movimentações...
                  </>
                ) : (
                  `Confirmar Exclusão de ${quantidadeExclusaoEmLote} Movimentações`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historico;
