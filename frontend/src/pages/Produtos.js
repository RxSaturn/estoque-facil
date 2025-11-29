import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaTimes,
  FaExclamationTriangle,
  FaBoxOpen,
} from "react-icons/fa";
import api from "../services/api";
import { toast } from "react-toastify";
import Paginacao from "../components/Paginacao";
import PaginacaoCompacta from "../components/PaginacaoCompacta";
import "./Produtos.css";

const Produtos = () => {
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [imagensComErro, setImagensComErro] = useState({});

  // Filtro avançado visível por padrão
  const [filtroAvancado, setFiltroAvancado] = useState(true);

  // Arrays para as opções de filtro (extraídos dos próprios produtos)
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  // Filtros selecionados
  const [filtros, setFiltros] = useState({
    tipo: "",
    categoria: "",
    subcategoria: "",
  });

  // Estado para modal de exclusão avançado
  const [excluirId, setExcluirId] = useState(null);
  const [produtoExcluir, setProdutoExcluir] = useState(null);
  const [excluindoProduto, setExcluindoProduto] = useState(false);
  const [erroExclusao, setErroExclusao] = useState(null);
  const [estoqueZerado, setEstoqueZerado] = useState(false);

  // Estado unificado para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce para busca - atualiza buscaDebounced após 500ms
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [busca]);

  // Função para carregar produtos
  const carregarProdutos = useCallback(async () => {
    setCarregando(true);

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        tipo: filtros.tipo || undefined,
        categoria: filtros.categoria || undefined,
        subcategoria: filtros.subcategoria || undefined,
        busca: buscaDebounced || undefined,
      };

      console.log("Buscando produtos com params:", params);

      const resposta = await api.get("/api/produtos", { params });

      console.log("Resposta recebida:", resposta.data);

      let dadosProdutos = [];

      if (resposta.data && Array.isArray(resposta.data)) {
        dadosProdutos = resposta.data;
      } else if (
        resposta.data &&
        resposta.data.produtos &&
        Array.isArray(resposta.data.produtos)
      ) {
        dadosProdutos = resposta.data.produtos;
      }

      setProdutosFiltrados(dadosProdutos);

      if (resposta.data.total !== undefined) {
        setTotalItems(resposta.data.total);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos. Tente novamente.", {
        toastId: "erro-carregar-produtos",
      });
      setProdutosFiltrados([]);
    } finally {
      setCarregando(false);
    }
  }, [currentPage, itemsPerPage, filtros, buscaDebounced]);

  // Função para carregar opções de filtros de endpoints dedicados
  const carregarOpcoesFiltroDedicado = useCallback(async () => {
    try {
      // Carregar tipos, categorias e subcategorias de endpoints dedicados
      const [tiposRes, categoriasRes, subcategoriasRes] = await Promise.all([
        api.get("/api/produtos/tipos"),
        api.get("/api/produtos/categorias"),
        api.get("/api/produtos/subcategorias"),
      ]);

      // Atualizar estados com as opções retornadas
      if (Array.isArray(tiposRes.data)) {
        setTipos(tiposRes.data.sort());
      }
      if (Array.isArray(categoriasRes.data)) {
        setCategorias(categoriasRes.data.sort());
      }
      if (Array.isArray(subcategoriasRes.data)) {
        setSubcategorias(subcategoriasRes.data.sort());
      }
    } catch (error) {
      console.error("Erro ao carregar opções de filtro:", error);
      // Não mostrar toast para não poluir a UI - filtros podem ficar vazios
    }
  }, []);

  // Handler de mudança de página
  const handlePageChange = useCallback((page) => {
    console.log(`Mudando para página ${page}`);
    setCurrentPage(page);
  }, []);

  // Handler de mudança de itens por página
  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    console.log(`Mudando para ${newItemsPerPage} itens por página`);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset para primeira página ao mudar itens por página
  }, []);

  // Efeito para carregar produtos quando dependências mudam
  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  // Efeito para carregar opções de filtro na montagem
  useEffect(() => {
    carregarOpcoesFiltroDedicado();
  }, [carregarOpcoesFiltroDedicado]);

  // Reset para primeira página quando filtros ou busca mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filtros, buscaDebounced]);

  // Função para atualizar busca
  const handleBuscaChange = (e) => {
    const novaBusca = e.target.value;
    setBusca(novaBusca);
  };

  // Atualizar filtro
  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  // Limpar todos os filtros
  const limparFiltros = () => {
    setFiltros({
      tipo: "",
      categoria: "",
      subcategoria: "",
    });
    setBusca("");
  };

  // Função para confirmar exclusão (agora com carregamento dos dados do produto)
  const confirmarExclusao = async (id) => {
    try {
      // Carregar dados do produto para verificar estoque
      const response = await api.get(`/api/produtos/${id}`);
      const produto = response.data;

      // Verificar se tem estoque e se já foi calculado
      let temEstoque = false;
      let quantidadeTotal = 0;

      if (produto.estoques && produto.estoques.length > 0) {
        quantidadeTotal = produto.estoques.reduce(
          (total, estoque) => total + estoque.quantidade,
          0
        );
        temEstoque = quantidadeTotal > 0;
      }

      // Armazenar dados do produto para usar no modal
      setProdutoExcluir({
        ...produto,
        temEstoque,
        quantidadeTotal,
      });

      // Definir ID do produto a ser excluído
      setExcluirId(id);

      // Resetar estado do modal
      setEstoqueZerado(false);
      setErroExclusao(null);
    } catch (error) {
      console.error("Erro ao carregar dados do produto para exclusão:", error);
      toast.error("Erro ao preparar exclusão do produto. Tente novamente.");
    }
  };

  const cancelarExclusao = () => {
    setExcluirId(null);
    setProdutoExcluir(null);
    setEstoqueZerado(false);
    setErroExclusao(null);
    setExcluindoProduto(false);
  };

  // Zerar estoque do produto
  const zerarEstoque = async (produtoId) => {
    try {
      setExcluindoProduto(true);
      setErroExclusao(null);

      // Chamar API para zerar estoque
      await api.post(`/api/produtos/${produtoId}/zerar-estoque`);

      setEstoqueZerado(true);
      toast.success("Estoque do produto zerado com sucesso");

      // Continuar com exclusão após zerar estoque
      return true;
    } catch (error) {
      console.error("Erro ao zerar estoque do produto:", error);
      setErroExclusao(
        "Não foi possível zerar o estoque do produto. Tente novamente."
      );
      toast.error("Erro ao zerar estoque do produto");
      setExcluindoProduto(false);
      return false;
    }
  };

  // Função para excluir o produto
  const excluirProduto = async () => {
    if (!excluirId || !produtoExcluir) return;

    try {
      setExcluindoProduto(true);

      // Se produto tem estoque e ainda não foi zerado, zerar primeiro
      if (produtoExcluir.temEstoque && !estoqueZerado) {
        const estoqueZeradoComSucesso = await zerarEstoque(excluirId);
        if (!estoqueZeradoComSucesso) return;
      }

      // Agora tenta excluir o produto
      await api.delete(`/api/produtos/${excluirId}`);

      // Atualizar lista de produtos recarregando os dados
      carregarProdutos();

      toast.success("Produto removido com sucesso!");

      // Fechar o modal
      cancelarExclusao();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);

      const mensagemErro =
        error.response?.data?.mensagem ||
        "Erro ao excluir produto. Tente novamente.";

      setErroExclusao(mensagemErro);
      toast.error(mensagemErro, { toastId: "erro-excluir-produto" });
      setExcluindoProduto(false);
    }
  };

  return (
    <div className="produtos-container">
      <div className="page-header">
        <h1>Produtos</h1>
        <Link to="/produtos/adicionar" className="btn btn-primary">
          <FaPlus /> Adicionar Produto
        </Link>
      </div>

      {/* Barra de busca e controles */}
      <div className="search-filter-container">
        <div className="search-box">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={busca}
              onChange={handleBuscaChange}
            />
            <div className="search-button">
              <FaSearch />
            </div>
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

          {(busca ||
            filtros.tipo ||
            filtros.categoria ||
            filtros.subcategoria) && (
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

      {/* Filtros avançados - visíveis por padrão */}
      {filtroAvancado && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Tipo</label>
              <select
                name="tipo"
                value={filtros.tipo}
                onChange={handleChangeFiltro}
              >
                <option value="">Todos</option>
                {tipos.map((tipo, index) => (
                  <option key={index} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              <div className="filter-count">{tipos.length} opções</div>
            </div>

            <div className="filter-group">
              <label>Categoria</label>
              <select
                name="categoria"
                value={filtros.categoria}
                onChange={handleChangeFiltro}
              >
                <option value="">Todas</option>
                {categorias.map((categoria, index) => (
                  <option key={index} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
              <div className="filter-count">{categorias.length} opções</div>
            </div>

            <div className="filter-group">
              <label>Subcategoria</label>
              <select
                name="subcategoria"
                value={filtros.subcategoria}
                onChange={handleChangeFiltro}
              >
                <option value="">Todas</option>
                {subcategorias.map((subcategoria, index) => (
                  <option key={index} value={subcategoria}>
                    {subcategoria}
                  </option>
                ))}
              </select>
              <div className="filter-count">{subcategorias.length} opções</div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de resultados e paginação compacta no topo */}
      <div className="resultados-header">
        <div className="resultados-info">
          Exibindo {produtosFiltrados.length} de {totalItems} produtos
          {busca || filtros.tipo || filtros.categoria || filtros.subcategoria
            ? " (filtrados)"
            : ""}
        </div>
        
        {produtosFiltrados.length > 0 && totalItems > itemsPerPage && (
          <PaginacaoCompacta
            totalItems={totalItems}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            pageName="produtos"
            pagina={currentPage}
          />
        )}
      </div>

      {/* Componente de Paginação no topo */}
      {!carregando && produtosFiltrados.length > 0 && (
        <Paginacao
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          pageName="produtos_top"
          pagina={currentPage}
        />
      )}

      {/* Indicador de carregamento */}
      {carregando ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando produtos...</p>
        </div>
      ) : (
        <>
          {/* Lista de produtos em grid */}
          {produtosFiltrados.length > 0 ? (
            <div className="produtos-grid">
              {produtosFiltrados.map((produto) => (
                <div className="produto-card" key={produto._id}>
                  <div className={`produto-img ${imagensComErro[produto._id] ? 'placeholder-container' : ''}`}>
                    {produto.imagemUrl && !imagensComErro[produto._id] ? (
                      <img
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        onError={() => {
                          setImagensComErro((prev) => ({ ...prev, [produto._id]: true }));
                        }}
                      />
                    ) : (
                      <div className="placeholder-image">
                        <FaBoxOpen className="placeholder-icon" />
                        <span>Sem imagem</span>
                      </div>
                    )}
                  </div>

                  <div className="produto-info">
                    <h3 title={produto.nome}>{produto.nome}</h3>
                    <p className="produto-id">{produto.id}</p>
                    <div className="produto-detalhes">
                      <span className="badge tipo">{produto.tipo}</span>
                      <span className="badge categoria">
                        {produto.categoria}
                      </span>
                    </div>
                    <p className="produto-subcategoria">
                      {produto.subcategoria}
                    </p>
                  </div>

                  <div className="produto-actions">
                    <Link
                      to={`/produtos/editar/${produto._id}`}
                      className="btn btn-sm btn-secondary"
                    >
                      <FaEdit /> Editar
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => confirmarExclusao(produto._id)}
                    >
                      <FaTrash /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-container">
              <p>Nenhum produto encontrado</p>
              <p className="sub-text">
                {busca ||
                filtros.tipo ||
                filtros.categoria ||
                filtros.subcategoria
                  ? "Tente ajustar os filtros ou realizar uma nova busca."
                  : "Comece adicionando seu primeiro produto no sistema."}
              </p>
              {!(
                busca ||
                filtros.tipo ||
                filtros.categoria ||
                filtros.subcategoria
              ) && (
                <Link to="/produtos/adicionar" className="btn btn-primary">
                  <FaPlus /> Adicionar Produto
                </Link>
              )}
            </div>
          )}

          {/* Componente de Paginação no final */}
          {produtosFiltrados.length > 0 && (
            <Paginacao
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              pageName="produtos"
              pagina={currentPage}
            />
          )}
        </>
      )}

      {/* Modal de confirmação de exclusão aprimorado */}
      {excluirId && produtoExcluir && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirmar Exclusão</h3>

            <div className="produto-excluir-info">
              <p>
                <strong>Produto:</strong> {produtoExcluir.nome}
              </p>
              <p>
                <strong>Código:</strong> {produtoExcluir.id}
              </p>

              {produtoExcluir.temEstoque && !estoqueZerado && (
                <div className="estoque-aviso">
                  <FaExclamationTriangle className="aviso-icon" />
                  <p>
                    Este produto possui {produtoExcluir.quantidadeTotal}{" "}
                    unidades em estoque.
                  </p>
                  <p>
                    Para prosseguir com a exclusão, o estoque será zerado
                    automaticamente.
                  </p>
                  <p className="aviso-texto">
                    Esta operação não afetará registros históricos ou vendas já
                    realizadas.
                  </p>
                </div>
              )}

              {estoqueZerado && (
                <div className="sucesso-estoque">
                  <p>✓ Estoque zerado com sucesso</p>
                </div>
              )}

              {erroExclusao && (
                <div className="erro-exclusao">
                  <p>{erroExclusao}</p>
                </div>
              )}

              <p className="warning-text">Esta ação não poderá ser desfeita.</p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={cancelarExclusao}
                disabled={excluindoProduto}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={excluirProduto}
                disabled={excluindoProduto}
              >
                {excluindoProduto ? (
                  <>
                    <span className="spinner-tiny"></span>
                    {estoqueZerado ? "Excluindo..." : "Zerando estoque..."}
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

export default Produtos;
