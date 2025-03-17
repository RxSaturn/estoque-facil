import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Produtos.css';

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Filtro avançado visível por padrão
  const [filtroAvancado, setFiltroAvancado] = useState(true);
  
  // Arrays para as opções de filtro (extraídos dos próprios produtos)
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  
  // Filtros selecionados
  const [filtros, setFiltros] = useState({
    tipo: '',
    categoria: '',
    subcategoria: ''
  });
  
  // Estado para modal de exclusão avançado
  const [excluirId, setExcluirId] = useState(null);
  const [produtoExcluir, setProdutoExcluir] = useState(null);
  const [excluindoProduto, setExcluindoProduto] = useState(false);
  const [erroExclusao, setErroExclusao] = useState(null);
  const [estoqueZerado, setEstoqueZerado] = useState(false);

  // Função para carregar todos os produtos
  const carregarProdutos = async () => {
    try {
      setCarregando(true);
      toast.dismiss('erro-carregar-produtos');
      
      // Fazer requisição sem filtros para obter todos os produtos
      const resposta = await api.get('/api/produtos');
      
      // Determinar formato correto da resposta
      let dadosProdutos = [];
      if (resposta.data && Array.isArray(resposta.data)) {
        dadosProdutos = resposta.data;
      } else if (resposta.data && resposta.data.produtos && Array.isArray(resposta.data.produtos)) {
        dadosProdutos = resposta.data.produtos;
      }
      
      console.log('Produtos carregados:', dadosProdutos.length);
      setProdutos(dadosProdutos);
      
      // Extrair opções de filtro dos próprios produtos
      extrairOpcoesFiltro(dadosProdutos);
      
      // Aplicar filtros iniciais
      aplicarFiltros(dadosProdutos, filtros, busca);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos. Tente novamente.', {
        toastId: 'erro-carregar-produtos'
      });
      setProdutos([]);
      setProdutosFiltrados([]);
    } finally {
      setCarregando(false);
    }
  };
  
  // Extrair opções de filtro dos produtos carregados
  const extrairOpcoesFiltro = (produtos) => {
    // Usar Set para eliminar duplicatas
    const tiposSet = new Set();
    const categoriasSet = new Set();
    const subcategoriasSet = new Set();
    
    produtos.forEach(produto => {
      if (produto.tipo) tiposSet.add(produto.tipo);
      if (produto.categoria) categoriasSet.add(produto.categoria);
      if (produto.subcategoria) subcategoriasSet.add(produto.subcategoria);
    });
    
    // Converter Sets em Arrays e ordenar alfabeticamente
    setTipos(Array.from(tiposSet).sort());
    setCategorias(Array.from(categoriasSet).sort());
    setSubcategorias(Array.from(subcategoriasSet).sort());
    
    console.log('Opções de filtro extraídas:', {
      tipos: Array.from(tiposSet).length,
      categorias: Array.from(categoriasSet).length,
      subcategorias: Array.from(subcategoriasSet).length
    });
  };
  
  // Aplicar filtros aos produtos
  const aplicarFiltros = (produtosOriginais, filtrosAplicados, termoBusca) => {
    // Guardar os produtos originais ou usar os produtos atuais
    const dadosProdutos = produtosOriginais || produtos;
    
    // Filtragem no cliente
    const resultadosFiltrados = dadosProdutos.filter(produto => {
      // Verificar termo de busca
      const matchBusca = !termoBusca || 
        (produto.nome && produto.nome.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (produto.id && produto.id.toLowerCase().includes(termoBusca.toLowerCase()));
      
      // Verificar filtros de categoria/tipo
      const matchTipo = !filtrosAplicados.tipo || produto.tipo === filtrosAplicados.tipo;
      const matchCategoria = !filtrosAplicados.categoria || produto.categoria === filtrosAplicados.categoria;
      const matchSubcategoria = !filtrosAplicados.subcategoria || produto.subcategoria === filtrosAplicados.subcategoria;
      
      return matchBusca && matchTipo && matchCategoria && matchSubcategoria;
    });
    
    setProdutosFiltrados(resultadosFiltrados);
    console.log('Produtos filtrados:', resultadosFiltrados.length);
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    carregarProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Efeito para aplicar filtros quando mudam
  useEffect(() => {
    aplicarFiltros(produtos, filtros, busca);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // Função para atualizar busca
  const handleBuscaChange = (e) => {
    const novaBusca = e.target.value;
    setBusca(novaBusca);
    
    // Aplicar busca em tempo real
    aplicarFiltros(produtos, filtros, novaBusca);
  };

  // Atualizar filtro
  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    const novosFiltros = { ...filtros, [name]: value };
    setFiltros(novosFiltros);
  };

  // Limpar todos os filtros
  const limparFiltros = () => {
    setBusca('');
    setFiltros({
      tipo: '',
      categoria: '',
      subcategoria: ''
    });
    
    // Resetar para mostrar todos os produtos
    setProdutosFiltrados(produtos);
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
        quantidadeTotal = produto.estoques.reduce((total, estoque) => total + estoque.quantidade, 0);
        temEstoque = quantidadeTotal > 0;
      }
      
      // Armazenar dados do produto para usar no modal
      setProdutoExcluir({
        ...produto,
        temEstoque,
        quantidadeTotal
      });
      
      // Definir ID do produto a ser excluído
      setExcluirId(id);
      
      // Resetar estado do modal
      setEstoqueZerado(false);
      setErroExclusao(null);
    } catch (error) {
      console.error('Erro ao carregar dados do produto para exclusão:', error);
      toast.error('Erro ao preparar exclusão do produto. Tente novamente.');
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
      toast.success('Estoque do produto zerado com sucesso');
      
      // Continuar com exclusão após zerar estoque
      return true;
    } catch (error) {
      console.error('Erro ao zerar estoque do produto:', error);
      setErroExclusao('Não foi possível zerar o estoque do produto. Tente novamente.');
      toast.error('Erro ao zerar estoque do produto');
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
      
      // Atualizar lista de produtos
      setProdutos(prevProdutos => prevProdutos.filter(p => p._id !== excluirId));
      setProdutosFiltrados(prevFiltrados => prevFiltrados.filter(p => p._id !== excluirId));
      
      toast.success('Produto removido com sucesso!');
      
      // Fechar o modal
      cancelarExclusao();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      
      const mensagemErro = error.response?.data?.mensagem || 
                          'Erro ao excluir produto. Tente novamente.';
      
      setErroExclusao(mensagemErro);
      toast.error(mensagemErro, { toastId: 'erro-excluir-produto' });
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
            className={`btn btn-outline filter-btn ${filtroAvancado ? 'active' : ''}`}
            onClick={() => setFiltroAvancado(!filtroAvancado)}
          >
            <FaFilter /> {filtroAvancado ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          {(busca || filtros.tipo || filtros.categoria || filtros.subcategoria) && (
            <button
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
                  <option key={index} value={tipo}>{tipo}</option>
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
                  <option key={index} value={categoria}>{categoria}</option>
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
                  <option key={index} value={subcategoria}>{subcategoria}</option>
                ))}
              </select>
              <div className="filter-count">{subcategorias.length} opções</div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de resultados */}
      <div className="resultados-info">
        Exibindo {produtosFiltrados.length} de {produtos.length} produtos
        {(busca || filtros.tipo || filtros.categoria || filtros.subcategoria) ? ' (filtrados)' : ''}
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
                <div className="produto-card" key={produto._id}>
                  <div className="produto-img">
                    <img 
                      src={produto.imagemUrl || '/placeholder-image.png'} 
                      alt={produto.nome} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                  </div>
                  
                  <div className="produto-info">
                    <h3>{produto.nome}</h3>
                    <p className="produto-id">{produto.id}</p>
                    <div className="produto-detalhes">
                      <span className="badge tipo">{produto.tipo}</span>
                      <span className="badge categoria">{produto.categoria}</span>
                    </div>
                    <p className="produto-subcategoria">{produto.subcategoria}</p>
                  </div>
                  
                  <div className="produto-actions">
                    <Link to={`/produtos/editar/${produto._id}`} className="btn btn-sm btn-secondary">
                      <FaEdit /> Editar
                    </Link>
                    <button 
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
                {(busca || filtros.tipo || filtros.categoria || filtros.subcategoria) ? 
                  'Tente ajustar os filtros ou realizar uma nova busca.' : 
                  'Comece adicionando seu primeiro produto no sistema.'}
              </p>
              {!(busca || filtros.tipo || filtros.categoria || filtros.subcategoria) && (
                <Link to="/produtos/adicionar" className="btn btn-primary">
                  <FaPlus /> Adicionar Produto
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de confirmação de exclusão aprimorado */}
      {excluirId && produtoExcluir && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirmar Exclusão</h3>
            
            <div className="produto-excluir-info">
              <p><strong>Produto:</strong> {produtoExcluir.nome}</p>
              <p><strong>Código:</strong> {produtoExcluir.id}</p>
              
              {produtoExcluir.temEstoque && !estoqueZerado && (
                <div className="estoque-aviso">
                  <FaExclamationTriangle className="aviso-icon" />
                  <p>Este produto possui {produtoExcluir.quantidadeTotal} unidades em estoque.</p>
                  <p>Para prosseguir com a exclusão, o estoque será zerado automaticamente.</p>
                  <p className="aviso-texto">Esta operação não afetará registros históricos ou vendas já realizadas.</p>
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
                className="btn btn-outline"
                onClick={cancelarExclusao}
                disabled={excluindoProduto}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={excluirProduto}
                disabled={excluindoProduto}
              >
                {excluindoProduto ? (
                  <>
                    <span className="spinner-tiny"></span>
                    {estoqueZerado ? 'Excluindo...' : 'Zerando estoque...'}
                  </>
                ) : (
                  'Confirmar Exclusão'
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