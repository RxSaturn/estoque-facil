import React, { useState, useEffect } from 'react';
import { 
  FaSave, 
  FaExchangeAlt, 
  FaBoxOpen, 
  FaArrowRight, 
  FaSearch, 
  FaPlus, 
  FaTrash, 
  FaShoppingCart 
} from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Movimentacao.css';

const Movimentacao = () => {
  const [tipoMovimentacao, setTipoMovimentacao] = useState('transferencia');
  const [formData, setFormData] = useState({
    produto: '',
    localOrigem: '',
    localDestino: '',
    quantidade: 1,
    data: new Date().toISOString().split('T')[0],
    observacao: ''
  });
  
  const [produtoBusca, setProdutoBusca] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [locais, setLocais] = useState([]);
  const [estoqueOrigem, setEstoqueOrigem] = useState(0);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  
  // Para vendas múltiplas
  const [carrinhoProdutos, setCarrinhoProdutos] = useState([]);
  
  // Carregar produtos e locais ao montar o componente
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        
        // Carregar produtos
        const resProdutos = await api.get('/api/produtos');
        setProdutos(resProdutos.data.produtos);
        setProdutosFiltrados(resProdutos.data.produtos);
        
        // Carregar locais
        const resLocais = await api.get('/api/estoque/locais');
        setLocais(resLocais.data);
        
        setCarregando(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados. Tente novamente.');
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, []);
  
  // Filtrar produtos quando o termo de busca mudar
  useEffect(() => {
    if (produtoBusca) {
      const filtrados = produtos.filter(produto => 
        produto.nome.toLowerCase().includes(produtoBusca.toLowerCase()) ||
        produto.id.toLowerCase().includes(produtoBusca.toLowerCase()) ||
        produto.categoria.toLowerCase().includes(produtoBusca.toLowerCase())
      );
      setProdutosFiltrados(filtrados);
    } else {
      setProdutosFiltrados(produtos);
    }
  }, [produtoBusca, produtos]);
  
  // Verificar estoque ao selecionar produto e local origem
  useEffect(() => {
    const verificarEstoque = async () => {
      if (formData.produto && formData.localOrigem) {
        try {
          const resposta = await api.get(`/api/estoque/verificar?produto=${formData.produto}&local=${formData.localOrigem}`);
          setEstoqueOrigem(resposta.data.quantidade || 0);
          
          // Buscar dados do produto selecionado
          const produtoInfo = produtos.find(p => p._id === formData.produto);
          setProdutoSelecionado(produtoInfo);
        } catch (error) {
          console.error('Erro ao verificar estoque:', error);
          setEstoqueOrigem(0);
        }
      } else {
        setEstoqueOrigem(0);
        setProdutoSelecionado(null);
      }
    };
    
    verificarEstoque();
  }, [formData.produto, formData.localOrigem, produtos]);
  
  const handleChangeMovimentacao = (tipo) => {
    setTipoMovimentacao(tipo);
    
    // Limpar o carrinho se mudar para transferência
    if (tipo === 'transferencia') {
      setCarrinhoProdutos([]);
    }
    
    // Reiniciar campos da movimentação
    setFormData(prev => ({
      ...prev,
      produto: '',
      localOrigem: '',
      localDestino: '',
      quantidade: 1
    }));
    setEstoqueOrigem(0);
    setProdutoSelecionado(null);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscaProduto = (e) => {
    setProdutoBusca(e.target.value);
  };
  
  const adicionarAoCarrinho = () => {
    // Validar produto e quantidade
    if (!formData.produto) {
      toast.error('Selecione um produto');
      return;
    }
    
    if (!formData.localOrigem) {
      toast.error('Selecione o local de origem');
      return;
    }
    
    if (formData.quantidade <= 0) {
      toast.error('A quantidade deve ser maior que zero');
      return;
    }
    
    if (formData.quantidade > estoqueOrigem) {
      toast.error(`Quantidade insuficiente. Estoque disponível: ${estoqueOrigem}`);
      return;
    }
    
    // Verificar se o produto já está no carrinho
    const produtoExistente = carrinhoProdutos.find(
      item => item.produto === formData.produto && item.localOrigem === formData.localOrigem
    );
    
    if (produtoExistente) {
      toast.error('Este produto já está no carrinho. Remova-o e adicione novamente se deseja alterar.');
      return;
    }
    
    // Adicionar ao carrinho
    const novoProdutoCarrinho = {
      produto: formData.produto,
      produtoNome: produtoSelecionado.nome,
      produtoId: produtoSelecionado.id,
      localOrigem: formData.localOrigem,
      quantidade: parseInt(formData.quantidade),
      estoqueDisponivel: estoqueOrigem
    };
    
    setCarrinhoProdutos([...carrinhoProdutos, novoProdutoCarrinho]);
    
    // Limpar formulário para adicionar novo produto
    setFormData(prev => ({
      ...prev,
      produto: '',
      quantidade: 1
    }));
    
    setProdutoSelecionado(null);
    setEstoqueOrigem(0);
    
    toast.success('Produto adicionado ao carrinho');
  };
  
  const removerDoCarrinho = (index) => {
    const novoCarrinho = [...carrinhoProdutos];
    novoCarrinho.splice(index, 1);
    setCarrinhoProdutos(novoCarrinho);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (tipoMovimentacao === 'transferencia') {
      // Validações básicas para transferência
      if (!formData.produto) {
        toast.error('Selecione um produto');
        return;
      }
      
      if (!formData.localOrigem) {
        toast.error('Selecione o local de origem');
        return;
      }
      
      if (!formData.localDestino) {
        toast.error('Selecione o local de destino');
        return;
      }
      
      if (tipoMovimentacao === 'transferencia' && formData.localOrigem === formData.localDestino) {
        toast.error('Os locais de origem e destino não podem ser iguais');
        return;
      }
      
      if (formData.quantidade <= 0) {
        toast.error('A quantidade deve ser maior que zero');
        return;
      }
      
      if (formData.quantidade > estoqueOrigem) {
        toast.error(`Quantidade insuficiente. Estoque disponível: ${estoqueOrigem}`);
        return;
      }
      
      try {
        setEnviando(true);
        
        const resposta = await api.post('/api/estoque/transferir', formData);
        
        if (resposta.data.sucesso) {
          toast.success('Transferência realizada com sucesso!');
          
          // Resetar formulário
          setFormData({
            produto: '',
            localOrigem: '',
            localDestino: '',
            quantidade: 1,
            data: new Date().toISOString().split('T')[0],
            observacao: ''
          });
          setEstoqueOrigem(0);
          setProdutoSelecionado(null);
        } else {
          toast.error(resposta.data.mensagem || 'Erro ao processar operação');
        }
      } catch (error) {
        console.error('Erro na operação:', error);
        toast.error(error.response?.data?.mensagem || 'Erro ao processar operação. Tente novamente.');
      } finally {
        setEnviando(false);
      }
    } else {
      // Validações para venda múltipla
      if (carrinhoProdutos.length === 0) {
        toast.error('Adicione ao menos um produto ao carrinho');
        return;
      }
      
      try {
        setEnviando(true);
        
        // Processar cada produto do carrinho
        const vendasPromises = carrinhoProdutos.map(item => 
          api.post('/api/vendas', {
            produto: item.produto,
            localOrigem: item.localOrigem,
            quantidade: item.quantidade,
            data: formData.data,
            observacao: formData.observacao
          })
        );
        
        // Executar todas as vendas em paralelo
        const resultados = await Promise.all(vendasPromises);
        
        // Verificar se todas foram bem-sucedidas
        const todasSucesso = resultados.every(res => res.data.sucesso);
        
        if (todasSucesso) {
          toast.success(`${resultados.length} produtos vendidos com sucesso!`);
          
          // Limpar carrinho e formulário
          setCarrinhoProdutos([]);
          setFormData({
            produto: '',
            localOrigem: '',
            localDestino: '',
            quantidade: 1,
            data: new Date().toISOString().split('T')[0],
            observacao: ''
          });
        } else {
          toast.warning('Algumas vendas podem não ter sido registradas corretamente');
        }
      } catch (error) {
        console.error('Erro na operação de venda:', error);
        toast.error(error.response?.data?.mensagem || 'Erro ao processar vendas. Tente novamente.');
      } finally {
        setEnviando(false);
      }
    }
  };

  if (carregando) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="movimentacao-container">
      <h1 className="page-title">Movimentação de Estoque</h1>
      
      <div className="tipo-movimentacao">
        <button 
          className={`tipo-btn ${tipoMovimentacao === 'transferencia' ? 'active' : ''}`}
          onClick={() => handleChangeMovimentacao('transferencia')}
        >
          <FaExchangeAlt />
          <span>Transferência entre Locais</span>
        </button>
        
        <button 
          className={`tipo-btn ${tipoMovimentacao === 'venda' ? 'active' : ''}`}
          onClick={() => handleChangeMovimentacao('venda')}
        >
          <FaBoxOpen />
          <span>Registrar Venda</span>
        </button>
      </div>
      
      <div className="card movimentacao-card">
        <h2>
          {tipoMovimentacao === 'transferencia' ? 'Transferir Produto' : 'Registrar Venda'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Seleção de Produto com Busca */}
          <div className="produto-selecao">
            <h3>Seleção de Produto</h3>
            
            <div className="busca-produto">
              <div className="search-input">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome, ID ou categoria..."
                  value={produtoBusca}
                  onChange={handleBuscaProduto}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="produto">Produto *</label>
                <select 
                  id="produto"
                  name="produto"
                  value={formData.produto}
                  onChange={handleChange}
                  required={tipoMovimentacao === 'transferencia'}
                >
                  <option value="">Selecione um produto</option>
                  {produtosFiltrados.map(produto => (
                    <option key={produto._id} value={produto._id}>
                      {produto.id} - {produto.nome} ({produto.categoria})
                    </option>
                  ))}
                </select>
                <small>
                  {produtosFiltrados.length === produtos.length 
                    ? `Mostrando todos os ${produtos.length} produtos` 
                    : `Mostrando ${produtosFiltrados.length} de ${produtos.length} produtos`}
                </small>
              </div>
              
              {produtoSelecionado && (
                <div className="produto-selecionado">
                  <div className="produto-info">
                    <img 
                      src={produtoSelecionado.imagemUrl} 
                      alt={produtoSelecionado.nome}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                    <div className="detalhes">
                      <h4>{produtoSelecionado.nome}</h4>
                      <p>
                        {produtoSelecionado.tipo} - {produtoSelecionado.categoria} - 
                        {produtoSelecionado.subcategoria}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="localOrigem">Local de Origem *</label>
              <select 
                id="localOrigem"
                name="localOrigem"
                value={formData.localOrigem}
                onChange={handleChange}
                required
              >
                <option value="">Selecione o local</option>
                {locais.map((local, index) => (
                  <option key={index} value={local}>{local}</option>
                ))}
              </select>
            </div>
            
            {tipoMovimentacao === 'transferencia' && (
              <div className="form-group">
                <label htmlFor="localDestino">Local de Destino *</label>
                <select 
                  id="localDestino"
                  name="localDestino"
                  value={formData.localDestino}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione o local</option>
                  {locais.map((local, index) => (
                    <option 
                      key={index} 
                      value={local}
                      disabled={local === formData.localOrigem}
                    >
                      {local}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantidade">Quantidade *</label>
              <input 
                type="number"
                id="quantidade"
                name="quantidade"
                value={formData.quantidade}
                onChange={handleChange}
                min="1"
                max={estoqueOrigem || undefined}
                required
              />
              {estoqueOrigem > 0 && (
                <small>Estoque disponível: {estoqueOrigem}</small>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="data">Data *</label>
              <input 
                type="date"
                id="data"
                name="data"
                value={formData.data}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="observacao">Observação</label>
            <textarea 
              id="observacao"
              name="observacao"
              value={formData.observacao}
              onChange={handleChange}
              rows="3"
              placeholder="Adicione uma observação (opcional)"
            />
          </div>
          
          {/* Botão para adicionar ao carrinho (apenas modo venda) */}
          {tipoMovimentacao === 'venda' && (
            <div className="add-to-cart">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={adicionarAoCarrinho}
                disabled={!formData.produto || !formData.localOrigem || formData.quantidade <= 0}
              >
                <FaPlus /> Adicionar Produto ao Carrinho
              </button>
            </div>
          )}
          
          {/* Carrinho de produtos (apenas modo venda) */}
          {tipoMovimentacao === 'venda' && (
            <div className="carrinho-container">
              <h3><FaShoppingCart /> Produtos para Venda</h3>
              
              {carrinhoProdutos.length > 0 ? (
                <div className="carrinho-tabela">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Produto</th>
                        <th>Local</th>
                        <th>Qtd</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrinhoProdutos.map((item, index) => (
                        <tr key={index}>
                          <td>{item.produtoId}</td>
                          <td>{item.produtoNome}</td>
                          <td>{item.localOrigem}</td>
                          <td>{item.quantidade}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-icon btn-delete"
                              onClick={() => removerDoCarrinho(index)}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="carrinho-sumario">
                    <p>Total de produtos: <strong>{carrinhoProdutos.length}</strong></p>
                    <p>Total de itens: <strong>
                      {carrinhoProdutos.reduce((sum, item) => sum + item.quantidade, 0)}
                    </strong></p>
                  </div>
                </div>
              ) : (
                <div className="carrinho-vazio">
                  <p>Nenhum produto adicionado ao carrinho</p>
                  <small>Adicione produtos para registrar a venda</small>
                </div>
              )}
            </div>
          )}
          
          {/* Resumo da movimentação e botão de envio */}
          <div className="movimentacao-resumo">
            {tipoMovimentacao === 'transferencia' && formData.produto && formData.localOrigem && produtoSelecionado && (
              <div className="resumo-card">
                <h3>Resumo da Transferência</h3>
                
                <div className="resumo-detalhes">
                  <p><strong>Produto:</strong> {produtoSelecionado.nome}</p>
                  <p><strong>Quantidade:</strong> {formData.quantidade}</p>
                  
                  <div className="movimentacao-fluxo">
                    <div className="local-box">
                      <strong>Origem</strong>
                      <p>{formData.localOrigem}</p>
                    </div>
                    
                    <FaArrowRight className="fluxo-seta" />
                    
                    <div className="local-box">
                      <strong>Destino</strong>
                      <p>{formData.localDestino}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={enviando || (tipoMovimentacao === 'venda' && carrinhoProdutos.length === 0)}
            >
              {enviando ? 'Processando...' : (
                <>
                  <FaSave /> {tipoMovimentacao === 'transferencia' ? 'Concluir Transferência' : 'Registrar Venda'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Movimentacao;