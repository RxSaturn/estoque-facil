import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaExchangeAlt, FaSearch, FaCalendarAlt, FaFilter, FaTimes, FaBoxes, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Historico.css';

const Historico = () => {
  const [activeTab, setActiveTab] = useState('vendas');
  const [vendas, setVendas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  
  const [filtros, setFiltros] = useState({
    dataInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    produto: '',
    local: '',
    tipo: ''
  });
  
  const [filtroAvancado, setFiltroAvancado] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  const tiposMovimentacao = [
    { value: '', label: 'Todos os tipos' },
    { value: 'entrada', label: 'Entrada de Estoque' },
    { value: 'saida', label: 'Saída de Estoque' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'venda', label: 'Venda' }
  ];

  // Funções auxiliares para lidar com dados possivelmente nulos
  const getProdutoNome = (mov) => {
    return mov?.produto?.nome || 'Produto não disponível';
  };

  const getProdutoId = (mov) => {
    return mov?.produto?.id || '';
  };
  
  const getNomeUsuario = (userId) => {
    if (!userId) return 'Usuário';
    const usuario = usuarios.find(u => u._id === userId);
    return usuario ? usuario.nome : 'Usuário';
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        setErro(null);
        
        // Carregar produtos e locais para filtros
        const resProdutos = await api.get('/api/produtos');
        setProdutos(resProdutos.data.produtos || []);
        
        const resLocais = await api.get('/api/estoque/locais');
        setLocais(resLocais.data || []);
        
        try {
          const resUsuarios = await api.get('/api/usuarios');
          setUsuarios(resUsuarios.data || []);
        } catch (err) {
          console.warn('Não foi possível carregar usuários:', err);
          setUsuarios([]);
        }
        
        // Carregar vendas e movimentações iniciais
        await carregarHistorico();
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        toast.error('Erro ao carregar dados. Tente novamente.');
        setErro('Falha ao carregar dados iniciais');
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Modificar a função carregarHistorico para carregar ambos os tipos de dados
  const carregarHistorico = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      // Garantir que as datas estejam no formato correto
      const dataInicio = new Date(filtros.dataInicio);
      const dataFim = new Date(filtros.dataFim);
      
      // Ajustar dataFim para incluir todo o dia
      dataFim.setHours(23, 59, 59, 999);
      
      // Construir query string com filtros para vendas
      let queryVendas = `dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`;
      if (filtros.produto) queryVendas += `&produto=${filtros.produto}`;
      if (filtros.local) queryVendas += `&local=${filtros.local}`;
      
      // Carregar vendas sempre (não apenas quando a aba vendas estiver ativa)
      try {
        const resVendas = await api.get(`/api/vendas?${queryVendas}`);
        setVendas(resVendas.data.vendas || []);
      } catch (err) {
        console.error('Erro ao carregar vendas:', err);
        setVendas([]);
        if (activeTab === 'vendas') {
          toast.error('Erro ao carregar histórico de vendas');
        }
      }
      
      // Carregar movimentações sempre (não apenas quando a aba movimentações estiver ativa)
      try {
        // Construir query para movimentações
        let queryMovimentacoes = `dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`;
        if (filtros.produto) queryMovimentacoes += `&produto=${filtros.produto}`;
        if (filtros.local) queryMovimentacoes += `&localOrigem=${filtros.local}`;
        if (filtros.tipo) queryMovimentacoes += `&tipo=${filtros.tipo}`;
        
        const resMovimentacoes = await api.get(`/api/movimentacoes/historico?${queryMovimentacoes}`);
        const movsRecebidas = resMovimentacoes.data.movimentacoes || [];
        
        // Filtrar movimentações para garantir que não temos produtos nulos
        const movsFiltradas = movsRecebidas.filter(m => m.produto !== null);
        setMovimentacoes(movsFiltradas);
        
        // Avisar se algumas movimentações foram filtradas
        if (movsRecebidas.length !== movsFiltradas.length) {
          console.warn(`Filtradas ${movsRecebidas.length - movsFiltradas.length} movimentações com produtos inválidos`);
        }
      } catch (err) {
        console.error('Erro ao carregar movimentações:', err);
        setMovimentacoes([]);
        if (activeTab === 'movimentacoes') {
          toast.error('Erro ao carregar histórico de movimentações');
          setErro('Falha ao carregar histórico de movimentações');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico. Tente novamente.');
      setErro('Falha ao carregar dados de histórico');
    } finally {
      setCarregando(false);
    }
  };

  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = (e) => {
    e.preventDefault();
    carregarHistorico();
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      dataFim: new Date().toISOString().split('T')[0],
      produto: '',
      local: '',
      tipo: ''
    });
    setFiltroAvancado(false);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Função para formatar data
  const formatarData = (dataString) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (e) {
      return dataString || 'Data não disponível';
    }
  };
  
  // Função para renderizar o ícone de tipo de movimentação
  const renderIconeTipo = (tipo) => {
    switch (tipo) {
      case 'entrada':
        return <FaBoxes className="icon-entrada" />;
      case 'saida':
        return <FaBoxes className="icon-saida" />;
      case 'transferencia':
        return <FaExchangeAlt className="icon-transferencia" />;
      case 'venda':
        return <FaShoppingCart className="icon-venda" />;
      default:
        return <FaBoxes />;
    }
  };
  
  // Função para obter descrição legível do tipo
  const getDescricaoTipo = (tipo) => {
    const tipos = {
      'entrada': 'Entrada de Estoque',
      'saida': 'Saída de Estoque',
      'transferencia': 'Transferência',
      'venda': 'Venda'
    };
    return tipos[tipo] || tipo || 'Tipo não disponível';
  };

  if (carregando && (!vendas.length && !movimentacoes.length)) {
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
          className={`tab-button ${activeTab === 'vendas' ? 'active' : ''}`}
          onClick={() => handleTabChange('vendas')}
        >
          <FaShoppingCart /> Vendas
        </button>
        <button 
          className={`tab-button ${activeTab === 'movimentacoes' ? 'active' : ''}`}
          onClick={() => handleTabChange('movimentacoes')}
        >
          <FaExchangeAlt /> Movimentações
        </button>
      </div>
      
      {/* Card de filtro */}
      <div className="card filtro-card">
        <div className="filtro-header">
          <h2>
            <FaCalendarAlt /> Filtrar {activeTab === 'vendas' ? 'Vendas' : 'Movimentações'}
          </h2>
          <button
            type="button"
            className={`btn btn-outline filter-btn ${filtroAvancado ? 'active' : ''}`}
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
                  {produtos.map(produto => (
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
                    <option key={index} value={local}>{local}</option>
                  ))}
                </select>
              </div>
              
              {activeTab === 'movimentacoes' && (
                <div className="form-group">
                  <label htmlFor="tipo">Tipo de Movimentação</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={filtros.tipo}
                    onChange={handleChangeFiltro}
                  >
                    {tiposMovimentacao.map((tipo, index) => (
                      <option key={index} value={tipo.value}>{tipo.label}</option>
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
        <div className="card resumo-card">
          <h3>Resumo do Período</h3>
          
          {activeTab === 'vendas' ? (
            /* Resumo de vendas */
            <div className="resumo-info">
              <div className="resumo-item">
                <span>Total de Vendas</span>
                <strong>{vendas.length}</strong>
              </div>
              <div className="resumo-item">
                <span>Produtos Vendidos</span>
                <strong>{vendas.reduce((total, venda) => total + (venda.quantidade || 0), 0)}</strong>
              </div>
              <div className="resumo-item">
                <span>Período</span>
                <strong>
                  {new Date(filtros.dataInicio).toLocaleDateString('pt-BR')} a {new Date(filtros.dataFim).toLocaleDateString('pt-BR')}
                </strong>
              </div>
            </div>
          ) : (
            /* Resumo de movimentações */
            <div className="resumo-info">
              <div className="resumo-item">
                <span>Total de Movimentações</span>
                <strong>{movimentacoes.length}</strong>
              </div>
              <div className="resumo-item">
                <span>Itens Movimentados</span>
                <strong>{movimentacoes.reduce((total, mov) => total + (mov.quantidade || 0), 0)}</strong>
              </div>
              <div className="resumo-item">
                <span>Período</span>
                <strong>
                  {new Date(filtros.dataInicio).toLocaleDateString('pt-BR')} a {new Date(filtros.dataFim).toLocaleDateString('pt-BR')}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Conteúdo da tab ativa */}
      <div className="tab-content">
        {activeTab === 'vendas' ? (
          /* Conteúdo de Vendas */
          <div className="card">
            <h3>Histórico de Vendas</h3>
            
            {vendas.length > 0 ? (
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
                              <span className="produto-nome">{venda.produto.nome}</span>
                              <span className="produto-id">{venda.produto.id}</span>
                            </div>
                          ) : (
                            <div className="produto-info">
                              <span className="produto-nome">Produto não disponível</span>
                            </div>
                          )}
                        </td>
                        <td>{venda.quantidade || 0}</td>
                        <td>{venda.local || 'Local não especificado'}</td>
                        <td>{venda.registradoPor?.nome || 'Usuário'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <FaShoppingCart className="icon" />
                <h4>Nenhuma venda encontrada</h4>
                <p className="sub-text">
                  {(filtros.produto || filtros.local) 
                    ? 'Tente ajustar os filtros para ver mais resultados' 
                    : 'Não há vendas registradas no período selecionado'}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Conteúdo de Movimentações */
          <div className="card">
            <h3>Histórico de Movimentações</h3>
            
            {movimentacoes.length > 0 ? (
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
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacoes.map((mov, index) => (
                      <tr key={mov._id || index} className={`movimentacao-row ${mov.tipo || 'sem-tipo'}`}>
                        <td>{formatarData(mov.data)}</td>
                        <td>
                          <div className="tipo-movimentacao">
                            {renderIconeTipo(mov.tipo)}
                            <span>{getDescricaoTipo(mov.tipo)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="produto-info">
                            <span className="produto-nome">{getProdutoNome(mov)}</span>
                            <span className="produto-id">{getProdutoId(mov)}</span>
                          </div>
                        </td>
                        <td>{mov.quantidade || 0}</td>
                        <td>
                          <div className="locais-info">
                            <span>{mov.localOrigem || 'Local não especificado'}</span>
                            {mov.tipo === 'transferencia' && mov.localDestino && (
                              <>
                                <FaArrowRight className="arrow-icon" />
                                <span>{mov.localDestino}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td>{getNomeUsuario(mov.realizadoPor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <FaExchangeAlt className="icon" />
                <h4>Nenhuma movimentação encontrada</h4>
                <p className="sub-text">
                  {(filtros.produto || filtros.local || filtros.tipo) 
                    ? 'Tente ajustar os filtros para ver mais resultados' 
                    : 'Não há movimentações registradas no período selecionado'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historico;
