import React, { useState, useEffect, useCallback, useRef } from "react";
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

// Componente de card do produto com tratamento de imagem via state
const ProdutoCard = ({ produto, onDelete }) => {
  const [imagemFalhou, setImagemFalhou] = useState(false);

  const handleImageError = () => {
    setImagemFalhou(true);
  };

  return (
    <div className="produto-card">
      <div className="produto-img">
        {produto.imagemUrl && !imagemFalhou ? (
          <img
            src={produto.imagemUrl}
            alt={produto.nome}
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="produto-placeholder">
            <FaBoxOpen className="placeholder-icon" />
            <span className="placeholder-text">
              {produto.nome.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="produto-info">
        <h3 title={produto.nome}>{produto.nome}</h3>
        <p className="produto-id">{produto.id}</p>
        <div className="produto-detalhes">
          <span className="badge tipo">{produto.tipo}</span>
          <span className="badge categoria">{produto.categoria}</span>
        </div>
        <p className="produto-subcategoria">{produto.subcategoria}</p>
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
          onClick={() => onDelete(produto._id)}
        >
          <FaTrash /> Excluir
        </button>
      </div>
    </div>
  );
};

const Produtos = () => {
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

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

  // Estado para paginação
  const [paginacao, setPaginacao] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
  });

  // Refs para controlar carregamentos e evitar ciclos
  const shouldFetchData = useRef(true);
  const fetchRequested = useRef(false);
  const requestInProgress = useRef(false);

  // Controle avançado de estados de paginação
  const paginacaoRef = useRef({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
  });

  // Referência aos filtros atuais para evitar ciclos
  const filtrosRef = useRef({
    tipo: "",
    categoria: "",
    subcategoria: "",
    busca: "",
  });

  // Função para carregar produtos sem depender de estados
  const carregarProdutosFn = useCallback(async (params = {}) => {
    // Se já existe uma requisição em andamento, marcar que nova requisição foi solicitada
    if (requestInProgress.current) {
      fetchRequested.current = true;
      return;
    }

    requestInProgress.current = true;
    setCarregando(true);

    try {
      const mergedParams = {
        page: paginacaoRef.current.currentPage,
        limit: paginacaoRef.current.itemsPerPage,
        tipo: filtrosRef.current.tipo,
        categoria: filtrosRef.current.categoria,
        subcategoria: filtrosRef.current.subcategoria,
        busca: filtrosRef.current.busca || undefined,
        ...params,
      };

      console.log("Buscando produtos com params:", mergedParams);

      const resposta = await api.get("/api/produtos", { params: mergedParams });

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

      // Atualizar dados sem disparar ciclos de renderização
      setProdutosFiltrados(dadosProdutos);

      // Atualizar total sem causar renderização em cascata
      if (resposta.data.total) {
        paginacaoRef.current.totalItems = resposta.data.total;
        setPaginacao((prev) => ({
          ...prev,
          totalItems: resposta.data.total,
        }));
      }

      // Extrair opções de filtro
      const tiposSet = new Set();
      const categoriasSet = new Set();
      const subcategoriasSet = new Set();

      dadosProdutos.forEach((produto) => {
        if (produto.tipo) tiposSet.add(produto.tipo);
        if (produto.categoria) categoriasSet.add(produto.categoria);
        if (produto.subcategoria) subcategoriasSet.add(produto.subcategoria);
      });

      setTipos(Array.from(tiposSet).sort());
      setCategorias(Array.from(categoriasSet).sort());
      setSubcategorias(Array.from(subcategoriasSet).sort());
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos. Tente novamente.", {
        toastId: "erro-carregar-produtos",
      });
      setProdutosFiltrados([]);
    } finally {
      setCarregando(false);
      requestInProgress.current = false;

      // Se uma nova requisição foi solicitada durante esta, executar após um pequeno delay
      if (fetchRequested.current) {
        fetchRequested.current = false;
        setTimeout(() => {
          carregarProdutosFn();
        }, 100);
      }
    }
  }, []);

  // Handler de mudança de página - versão segura
  const handlePageChange = useCallback(
    (page) => {
      console.log(`Mudando para página ${page}`);

      if (page === paginacaoRef.current.currentPage) return;

      // Atualizar ref antes do estado
      paginacaoRef.current.currentPage = page;

      // Atualizar estado
      setPaginacao((prev) => ({ ...prev, currentPage: page }));

      // Carregar novos dados com a página atualizada
      carregarProdutosFn({ page });
    },
    [carregarProdutosFn]
  );

  // Handler de mudança de itens por página - versão segura
  const handleItemsPerPageChange = useCallback(
    (itemsPerPage) => {
      console.log(`Mudando para ${itemsPerPage} itens por página`);

      if (itemsPerPage === paginacaoRef.current.itemsPerPage) return;

      // Atualizar ref antes do estado
      paginacaoRef.current.itemsPerPage = itemsPerPage;
      paginacaoRef.current.currentPage = 1;

      // Atualizar estado
      setPaginacao((prev) => ({
        ...prev,
        itemsPerPage,
        currentPage: 1,
      }));

      // Carregar novos dados com os parâmetros atualizados
      carregarProdutosFn({ limit: itemsPerPage, page: 1 });
    },
    [carregarProdutosFn]
  );

  // Efeito para carregar dados iniciais - executado apenas UMA vez
  useEffect(() => {
    console.log("Montagem inicial do componente - carregando dados");

    // Garantir que as refs estão sincronizadas com os estados iniciais
    paginacaoRef.current = { ...paginacao };
    filtrosRef.current = { ...filtros, busca };

    // Carregar produtos apenas uma vez na montagem
    carregarProdutosFn();

    // Cleanup function
    return () => {
      shouldFetchData.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para aplicar filtros sem causar loops
  const aplicarFiltros = useCallback(
    (novosFiltros, novaBusca) => {
      console.log("Aplicando filtros:", novosFiltros, novaBusca);

      // Atualizar refs primeiro
      filtrosRef.current = {
        ...novosFiltros,
        busca: novaBusca,
      };

      paginacaoRef.current.currentPage = 1;

      // Atualizar estados
      setFiltros(novosFiltros);
      setBusca(novaBusca);
      setPaginacao((prev) => ({ ...prev, currentPage: 1 }));

      // Carregar dados com novos filtros
      carregarProdutosFn({
        ...novosFiltros,
        busca: novaBusca || undefined,
        page: 1,
      });
    },
    [carregarProdutosFn]
  );

  // Função para atualizar busca
  const handleBuscaChange = (e) => {
    const novaBusca = e.target.value;
    setBusca(novaBusca);
  };

  // Aplicar busca após digitar
  const aplicarBusca = useCallback(() => {
    aplicarFiltros(filtros, busca);
  }, [aplicarFiltros, filtros, busca]);

  // Efeito para aplicar busca apenas quando o usuário parar de digitar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busca !== filtrosRef.current.busca) {
        aplicarBusca();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [busca, aplicarBusca]);

  // Atualizar filtro
  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    const novosFiltros = { ...filtros, [name]: value };
    aplicarFiltros(novosFiltros, busca);
  };

  // Limpar todos os filtros
  const limparFiltros = () => {
    const novosFiltros = {
      tipo: "",
      categoria: "",
      subcategoria: "",
    };

    aplicarFiltros(novosFiltros, "");
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
      carregarProdutosFn();

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
          Exibindo {produtosFiltrados.length} de {paginacao.totalItems} produtos
          {busca || filtros.tipo || filtros.categoria || filtros.subcategoria
            ? " (filtrados)"
            : ""}
        </div>
        
        {produtosFiltrados.length > 0 && paginacao.totalItems > paginacao.itemsPerPage && (
          <PaginacaoCompacta
            totalItems={paginacao.totalItems}
            onPageChange={handlePageChange}
            itemsPerPage={paginacao.itemsPerPage}
            pageName="produtos"
          />
        )}
      </div>

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
                <ProdutoCard key={produto._id} produto={produto} onDelete={confirmarExclusao} />
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

          {/* Componente de Paginação */}
          {produtosFiltrados.length > 0 && (
            <Paginacao
              totalItems={paginacao.totalItems}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              pageName="produtos"
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
