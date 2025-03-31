import React, { useState, useEffect, useCallback } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaWarehouse,
  FaBoxOpen,
  FaToggleOn,
  FaToggleOff,
  FaFilter,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import api from "../../services/api";
import { toast } from "react-toastify";
import Paginacao from "../Paginacao";
import "./LocaisTab.css";
import "./shared-styles.css";

const LocaisTab = () => {
  const [locais, setLocais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroAvancado, setFiltroAvancado] = useState(false);
  const [tiposLocais, setTiposLocais] = useState([]);
  const [filtroProdutos, setFiltroProdutos] = useState("");
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);

  // Estado para paginação
  const [paginacao, setPaginacao] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
  });

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    tipo: "",
    status: "",
  });

  // Estados para modal de formulário
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "outro",
    ativo: true,
  });
  const [modoEdicao, setModoEdicao] = useState(false);
  const [localAtual, setLocalAtual] = useState(null);

  // Estados para modal de produtos
  const [modalProdutosAberto, setModalProdutosAberto] = useState(false);
  const [produtosLocal, setProdutosLocal] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [paginacaoProdutos, setPaginacaoProdutos] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });

  // Estado para modal de confirmação de exclusão
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [localExcluir, setLocalExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState(null);

  // Função para carregar tipos de locais
  const carregarTiposLocais = useCallback(async () => {
    try {
      const response = await api.get("/api/locais/tipos");

      // Verificar formato da resposta e normalizar se necessário
      if (response.data.tipos) {
        // Formato normal { sucesso: true, tipos: [...] }
        setTiposLocais(response.data.tipos);
      } else if (Array.isArray(response.data)) {
        // Formato alternativo - array direto
        setTiposLocais(
          response.data.map((tipo) => {
            // Se já for um objeto { id, nome }, usar diretamente
            if (tipo.id && tipo.nome) return tipo;
            // Se for string, converter para objeto
            return { id: tipo.toLowerCase(), nome: tipo };
          })
        );
      } else {
        // Fallback para tipos padrão se a resposta for inesperada
        setTiposLocais([
          { id: "deposito", nome: "Depósito" },
          { id: "prateleira", nome: "Prateleira" },
          { id: "vitrine", nome: "Vitrine" },
          { id: "reserva", nome: "Reserva" },
          { id: "outro", nome: "Outro" },
        ]);
      }
    } catch (error) {
      console.error("Erro ao carregar tipos de locais:", error);
      toast.error("Não foi possível carregar os tipos de locais");

      // Usar valores padrão em caso de erro
      setTiposLocais([
        { id: "deposito", nome: "Depósito" },
        { id: "prateleira", nome: "Prateleira" },
        { id: "vitrine", nome: "Vitrine" },
        { id: "reserva", nome: "Reserva" },
        { id: "outro", nome: "Outro" },
      ]);
    }
  }, []);

  // Função para carregar lista de locais
  const carregarLocais = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      // Construir parâmetros de consulta
      const params = {
        page: paginacao.currentPage,
        limit: paginacao.itemsPerPage,
        busca: busca || undefined,
        tipo: filtros.tipo || undefined,
        status: filtros.status || undefined,
      };

      const response = await api.get("/api/locais", { params });

      setLocais(response.data.locais);
      setPaginacao((prev) => ({
        ...prev,
        totalItems: response.data.total,
      }));
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
      setErro("Não foi possível carregar a lista de locais");
      toast.error("Erro ao carregar locais. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [paginacao.currentPage, paginacao.itemsPerPage, busca, filtros]);

  // Função para filtrar produtos no modal
  const filtrarProdutos = useCallback(() => {
    if (!filtroProdutos.trim()) {
      setProdutosFiltrados(produtosLocal);
      return;
    }

    const termoLower = filtroProdutos.toLowerCase();
    const filtrados = produtosLocal.filter(
      (item) =>
        (item.produto?.nome &&
          item.produto.nome.toLowerCase().includes(termoLower)) ||
        (item.produto?.id &&
          item.produto.id.toLowerCase().includes(termoLower)) ||
        (item.produto?.categoria &&
          item.produto.categoria.toLowerCase().includes(termoLower)) ||
        (item.produto?.subcategoria &&
          item.produto.subcategoria.toLowerCase().includes(termoLower))
    );

    setProdutosFiltrados(filtrados);
  }, [filtroProdutos, produtosLocal]);

  // Carregar locais na montagem e quando os filtros mudarem
  useEffect(() => {
    carregarLocais();
  }, [carregarLocais]);

  // Carregar tipos de locais na montagem
  useEffect(() => {
    carregarTiposLocais();
  }, [carregarTiposLocais]);

  // Atualizar produtos filtrados quando os produtos mudam ou o filtro muda
  useEffect(() => {
    filtrarProdutos();
  }, [filtrarProdutos, produtosLocal]);

  // Funções de paginação
  const handlePageChange = useCallback((page) => {
    setPaginacao((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const handleItemsPerPageChange = useCallback((itemsPerPage) => {
    setPaginacao((prev) => ({ ...prev, itemsPerPage, currentPage: 1 }));
  }, []);

  // Funções de paginação para produtos
  const handleProdutosPageChange = useCallback((page) => {
    setPaginacaoProdutos((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const handleProdutosItemsPerPageChange = useCallback((itemsPerPage) => {
    setPaginacaoProdutos((prev) => ({ ...prev, itemsPerPage, currentPage: 1 }));
  }, []);

  // Funções de busca e filtro
  const handleBuscaChange = (e) => {
    setBusca(e.target.value);
  };

  const aplicarBusca = () => {
    setPaginacao((prev) => ({ ...prev, currentPage: 1 }));
    carregarLocais();
  };

  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
    setPaginacao((prev) => ({ ...prev, currentPage: 1 }));
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltros({
      tipo: "",
      status: "",
    });
    setPaginacao((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Funções para o modal de formulário
  const abrirModalCriarLocal = () => {
    setFormData({
      nome: "",
      descricao: "",
      tipo: "outro",
      ativo: true,
    });
    setModoEdicao(false);
    setLocalAtual(null);
    setModalAberto(true);
  };

  const abrirModalEditarLocal = (local) => {
    setFormData({
      nome: local.nome,
      descricao: local.descricao || "",
      tipo: local.tipo,
      ativo: local.ativo,
    });
    setModoEdicao(true);
    setLocalAtual(local);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFormData({
      nome: "",
      descricao: "",
      tipo: "outro",
      ativo: true,
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Validar campos
    if (!formData.nome.trim()) {
      toast.error("O nome do local é obrigatório");
      return;
    }

    try {
      setCarregando(true);

      if (modoEdicao && localAtual) {
        // Atualizar local existente
        await api.put(`/api/locais/${localAtual._id}`, formData);
        toast.success("Local atualizado com sucesso!");
      } else {
        // Criar novo local
        await api.post("/api/locais", formData);
        toast.success("Local criado com sucesso!");
      }

      // Fechar modal e recarregar dados
      fecharModal();
      carregarLocais();
    } catch (error) {
      console.error("Erro ao salvar local:", error);
      toast.error(error.response?.data?.mensagem || "Erro ao salvar local");
    } finally {
      setCarregando(false);
    }
  };

  // Funções para visualização de produtos no local
  const abrirModalProdutos = async (local) => {
    setLocalSelecionado(local);
    setModalProdutosAberto(true);
    setCarregandoProdutos(true);
    setFiltroProdutos(""); // Limpar filtro anterior

    try {
      const response = await api.get(`/api/locais/${local._id}/produtos`, {
        params: {
          page: paginacaoProdutos.currentPage,
          limit: paginacaoProdutos.itemsPerPage,
        },
      });

      setProdutosLocal(response.data.produtos);
      setProdutosFiltrados(response.data.produtos); // Inicializar produtos filtrados
      setPaginacaoProdutos((prev) => ({
        ...prev,
        totalItems: response.data.total,
      }));
    } catch (error) {
      console.error("Erro ao carregar produtos do local:", error);
      toast.error("Erro ao carregar produtos do local");
    } finally {
      setCarregandoProdutos(false);
    }
  };

  const fecharModalProdutos = () => {
    setModalProdutosAberto(false);
    setLocalSelecionado(null);
    setProdutosLocal([]);
    setProdutosFiltrados([]);
    setFiltroProdutos("");
  };

  // Funções para alternar status (ativar/desativar)
  const alternarStatusLocal = async (local) => {
    try {
      const novoStatus = !local.ativo;

      await api.put(`/api/locais/${local._id}`, {
        ativo: novoStatus,
      });

      toast.success(
        `Local ${novoStatus ? "ativado" : "desativado"} com sucesso!`
      );
      carregarLocais();
    } catch (error) {
      console.error("Erro ao alternar status do local:", error);
      toast.error("Erro ao modificar status do local");
    }
  };

  // Funções para exclusão de local
  const confirmarExclusao = (local) => {
    setLocalExcluir(local);
    setModalExclusaoAberto(true);
    setErroExclusao(null);
  };

  const cancelarExclusao = () => {
    setLocalExcluir(null);
    setModalExclusaoAberto(false);
    setErroExclusao(null);
    setExcluindo(false);
  };

  const excluirLocal = async () => {
    if (!localExcluir) return;

    try {
      setExcluindo(true);

      await api.delete(`/api/locais/${localExcluir._id}`);

      toast.success("Local removido com sucesso!");
      cancelarExclusao();
      carregarLocais();
    } catch (error) {
      console.error("Erro ao excluir local:", error);

      // Mensagem de erro melhorada
      const mensagemErro =
        error.response?.data?.mensagem || "Erro ao excluir local";
      setErroExclusao(mensagemErro);
      toast.error(mensagemErro);
    } finally {
      setExcluindo(false);
    }
  };

  // Função para obter o nome formatado do tipo de local
  const getNomeTipoLocal = (tipoId) => {
    const tipo = tiposLocais.find((t) => t.id === tipoId);
    return tipo ? tipo.nome : tipoId;
  };

  return (
    <div className="locais-tab">
      <div className="tab-header">
        <h2>Gerenciamento de Locais</h2>
        <button className="btn btn-primary" onClick={abrirModalCriarLocal}>
          <FaPlus /> Novo Local
        </button>
      </div>

      {/* Barra de busca e filtros */}
      <div className="search-filter-container">
        <div className="search-box">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Buscar locais..."
              value={busca}
              onChange={handleBuscaChange}
              onKeyPress={(e) => e.key === "Enter" && aplicarBusca()}
            />
            <button className="search-button" onClick={aplicarBusca}>
              <FaSearch />
            </button>
          </div>
        </div>

        <div className="filter-controls">
          <button
            type="button"
            className={`btn btn-outline filter-btn ${
              filtroAvancado ? "active" : ""
            }`}
            onClick={() => setFiltroAvancado(!filtroAvancado)}
          >
            <FaFilter />{" "}
            {filtroAvancado ? "Ocultar Filtros" : "Mostrar Filtros"}
          </button>

          {(busca || filtros.tipo || filtros.status) && (
            <button
              type="button"
              className="btn btn-outline clear-btn"
              onClick={limparFiltros}
            >
              <FaTimes /> Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Filtros avançados */}
      {filtroAvancado && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Tipo de Local</label>
              <select
                name="tipo"
                value={filtros.tipo}
                onChange={handleChangeFiltro}
              >
                <option value="">Todos</option>
                {tiposLocais.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                name="status"
                value={filtros.status}
                onChange={handleChangeFiltro}
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de locais */}
      {carregando && locais.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando locais...</p>
        </div>
      ) : erro ? (
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <p>{erro}</p>
        </div>
      ) : locais.length === 0 ? (
        <div className="empty-state">
          <FaWarehouse className="empty-icon" />
          <h3>Nenhum local encontrado</h3>
          <p>
            {busca || filtros.tipo || filtros.status
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Comece adicionando um novo local de armazenamento."}
          </p>
          <button className="btn btn-primary" onClick={abrirModalCriarLocal}>
            <FaPlus /> Adicionar Local
          </button>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table locais-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {locais.map((local) => (
                  <tr
                    key={local._id}
                    className={!local.ativo ? "inactive-row" : ""}
                  >
                    <td className="nome-local">{local.nome}</td>
                    <td>{getNomeTipoLocal(local.tipo)}</td>
                    <td className="descricao-cell">{local.descricao || "-"}</td>
                    <td className="status-cell">
                      <span
                        className={`status-badge ${
                          local.ativo ? "ativo" : "inativo"
                        }`}
                      >
                        {local.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="acoes-cell">
                      <div className="acoes-cell-container">
                        <button
                          onClick={() => abrirModalProdutos(local)}
                          className="btn btn-sm btn-outline"
                          title="Ver produtos neste local"
                        >
                          <FaBoxOpen />
                        </button>
                        <button
                          onClick={() => abrirModalEditarLocal(local)}
                          className="btn btn-sm btn-secondary"
                          title="Editar local"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => alternarStatusLocal(local)}
                          className={`btn btn-sm ${
                            local.ativo ? "btn-warning" : "btn-success"
                          }`}
                          title={
                            local.ativo ? "Desativar local" : "Ativar local"
                          }
                        >
                          {local.ativo ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button
                          onClick={() => confirmarExclusao(local)}
                          className="btn btn-sm btn-danger"
                          title="Excluir local"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Componente de Paginação */}
          <Paginacao
            totalItems={paginacao.totalItems}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageName="gerenciamento_locais"
          />
        </>
      )}

      {/* Modal para criar/editar local */}
      {modalAberto && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{modoEdicao ? "Editar Local" : "Novo Local"}</h3>

            <form onSubmit={handleSubmitForm}>
              <div className="form-group">
                <label htmlFor="nome">Nome do Local *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleFormChange}
                  required
                  placeholder="Ex: Depósito Principal"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipo">Tipo de Local *</label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleFormChange}
                  required
                >
                  {tiposLocais.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleFormChange}
                  placeholder="Descrição opcional do local"
                  rows="3"
                />
              </div>

              {modoEdicao && (
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="ativo"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleFormChange}
                  />
                  <label htmlFor="ativo">Local ativo</label>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={carregando}
                >
                  {carregando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para exibir produtos em um local */}
      {modalProdutosAberto && localSelecionado && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <h3>Produtos em {localSelecionado.nome}</h3>

            {/* Campo de busca para produtos */}
            <div className="filter-produtos-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Filtrar produtos..."
                  value={filtroProdutos}
                  onChange={(e) => setFiltroProdutos(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && filtrarProdutos()}
                />
                <button className="search-button" onClick={filtrarProdutos}>
                  <FaSearch />
                </button>
              </div>
            </div>

            {carregandoProdutos ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Carregando produtos...</p>
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="empty-state compact">
                <FaBoxOpen className="empty-icon" />
                <p>
                  {filtroProdutos.trim()
                    ? "Nenhum produto corresponde ao filtro aplicado."
                    : "Não há produtos armazenados neste local."}
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="data-table produtos-local-table">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Código</th>
                        <th>Categoria</th>
                        <th>Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosFiltrados.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="produto-cell-container">
                              {item.produto?.imagemUrl && (
                                <img
                                  src={item.produto.imagemUrl}
                                  alt={item.produto.nome}
                                  className="produto-thumbnail"
                                />
                              )}
                              <div className="produto-text-container">
                                <div className="produto-nome">
                                  {item.produto?.nome ||
                                    "Produto não disponível"}
                                </div>
                                {item.produto?.subcategoria && (
                                  <div className="produto-info">
                                    {item.produto.subcategoria}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="cell-truncate">
                            {item.produto?.id || "-"}
                          </td>
                          <td className="cell-truncate">
                            {item.produto?.categoria || "-"}
                          </td>
                          <td>{item.estoque?.quantidade || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação para produtos - só mostrar se não estiver filtrando */}
                {!filtroProdutos && (
                  <Paginacao
                    totalItems={paginacaoProdutos.totalItems}
                    onPageChange={handleProdutosPageChange}
                    onItemsPerPageChange={handleProdutosItemsPerPageChange}
                    pageName={`produtos_local_${localSelecionado._id}`}
                  />
                )}
              </>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={fecharModalProdutos}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {modalExclusaoAberto && localExcluir && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirmar Exclusão</h3>

            <div className="exclusao-info">
              <p>
                <strong>Local:</strong> {localExcluir.nome}
              </p>
              <p>
                <strong>Tipo:</strong> {getNomeTipoLocal(localExcluir.tipo)}
              </p>

              <div className="exclusao-aviso">
                <FaExclamationTriangle className="aviso-icon" />
                <p>
                  Esta ação não poderá ser desfeita. A exclusão só é possível se
                  não houver produtos ou histórico associados a este local.
                </p>

                {erroExclusao && (
                  <div className="erro-exclusao">
                    <p>{erroExclusao}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={cancelarExclusao}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={excluirLocal}
                disabled={excluindo}
              >
                {excluindo ? (
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
    </div>
  );
};

export default LocaisTab;
