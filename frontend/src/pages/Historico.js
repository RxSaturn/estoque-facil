import React, { useState, useEffect } from 'react';
import {
  FaShoppingCart, FaExchangeAlt, FaSearch,
  FaCalendarAlt, FaFilter, FaTimes, FaBoxes,
  FaArrowRight, FaExclamationTriangle, FaPen
} from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Historico.css';

const Historico = () => {
  // Funções de utilidade para manipulação de datas
  // Função para obter a data de hoje no formato YYYY-MM-DD
  const obterDataHoje = () => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  };

  // Função para obter a data de um mês atrás no formato YYYY-MM-DD
  const obterDataUmMesAtras = () => {
    const dataAtras = new Date();
    dataAtras.setMonth(dataAtras.getMonth() - 1);
    return dataAtras.toISOString().split('T')[0];
  };

  const [activeTab, setActiveTab] = useState('vendas');
  const [vendas, setVendas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  
  const [filtros, setFiltros] = useState({
    dataInicio: obterDataUmMesAtras(),
    dataFim: obterDataHoje(),
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
    { value: 'venda', label: 'Venda' },
    { value: 'atualizacao', label: 'Atualização de Produto' }
  ];

  // Funções auxiliares para lidar com dados possivelmente nulos
  const getProdutoNome = (mov) => {
    // Identificar movimentações de produto novo
    if (!mov.produto && mov.tipo === 'entrada' && mov.observacao?.includes('Registro inicial de produto')) {
      return 'Produto Novo Adicionado';
    }
    
    // Identificar movimentações de remoção de produto
    if (!mov.produto && (mov.tipo === 'saida' || mov.observacao?.includes('removido'))) {
      return 'Produto Removido';
    }
    
    return mov?.produto?.nome || 'Produto não disponível';
  };

  const getProdutoId = (mov) => {
    return mov?.produto?.id || '';
  };
  
  // Função melhorada para obter o nome do usuário
  const getNomeUsuario = (realizadoPor) => {
    // Verificar se realizadoPor é um objeto com nome
    if (realizadoPor && typeof realizadoPor === 'object' && realizadoPor.nome) {
      return realizadoPor.nome;
    }
    
    // Verificar se é um ID e buscar no array de usuários
    if (realizadoPor && typeof realizadoPor === 'string') {
      const usuario = usuarios.find(u => u._id === realizadoPor);
      if (usuario) return usuario.nome;
    }
    
    return 'Usuário';
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
          console.log('Usuários carregados:', resUsuarios.data);
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
  
  // Modificar a função carregarHistorico para tratar datas corretamente
  const carregarHistorico = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      // Converter datas para objetos Date com hora explícita para evitar problemas de fuso horário
      const dataInicio = new Date(`${filtros.dataInicio}T00:00:00.000Z`);
      const dataFim = new Date(`${filtros.dataFim}T23:59:59.999Z`);
      
      console.log('Datas selecionadas:', {
        dataInicioSelecionada: filtros.dataInicio,
        dataFimSelecionada: filtros.dataFim,
        dataInicioObjeto: dataInicio.toISOString(),
        dataFimObjeto: dataFim.toISOString()
      });
      
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
        const movs = resMovimentacoes.data.movimentacoes || [];
        
        // Log para debug das primeiras movimentações
        console.log('Movimentações carregadas (primeiras 2):', movs.slice(0, 2));
        
        // Aceitar todas as movimentações, mesmo com produto nulo
        setMovimentacoes(movs);
        
        console.log(`Carregadas ${resMovimentacoes.data.movimentacoes?.length || 0} movimentações`);
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
      dataInicio: obterDataUmMesAtras(),
      dataFim: obterDataHoje(),
      produto: '',
      local: '',
      tipo: ''
    });
    setFiltroAvancado(false);
    carregarHistorico();
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Não precisamos recarregar os dados já que eles são carregados para ambas as abas
  };
  
  // Função melhorada para formatar data no padrão brasileiro dd/mm/yyyy
  const formatarData = (dataString) => {
    try {
      // Para datas no formato YYYY-MM-DD (sem hora), adicionar T00:00:00 para evitar problemas de fuso
      const dataFormatada = dataString.includes('T') ? dataString : `${dataString}T00:00:00`;
      const data = new Date(dataFormatada);
      
      // Formatação explícita para DD/MM/YYYY
      const dia = data.getUTCDate().toString().padStart(2, '0');
      const mes = (data.getUTCMonth() + 1).toString().padStart(2, '0');
      const ano = data.getUTCFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      console.error('Erro ao formatar data:', e, dataString);
      return dataString || 'Data não disponível';
    }
  };
  
  // Função para exibir data formatada para o resumo de período
  const formatarDataResumo = (dataString) => {
    try {
      // Pegar apenas a parte da data (YYYY-MM-DD)
      const dataPura = dataString.split('T')[0];
      
      // Dividir em ano, mês e dia
      const [ano, mes, dia] = dataPura.split('-');
      
      // Retornar no formato DD/MM/YYYY
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      console.error('Erro ao formatar data para resumo:', e, dataString);
      return dataString || 'Data não disponível';
    }
  };
  
  // Função atualizada para renderizar o ícone de tipo de movimentação
  const renderIconeTipo = (mov) => {
    // Detectar atualizações pela observação
    if (mov.tipo === 'entrada' && mov.observacao && mov.observacao.includes('Produto atualizado')) {
      return <FaPen className="icon-atualizacao" />;
    }
    
    switch (mov.tipo) {
      case 'entrada':
        return <FaBoxes className="icon-entrada" />;
      case 'saida':
        return <FaBoxes className="icon-saida" />;
      case 'transferencia':
        return <FaExchangeAlt className="icon-transferencia" />;
      case 'venda':
        return <FaShoppingCart className="icon-venda" />;
      case 'atualizacao':
        return <FaPen className="icon-atualizacao" />;
      default:
        return <FaBoxes />;
    }
  };
  
  // Função atualizada para obter descrição legível do tipo
  const getDescricaoTipo = (mov) => {
    // Se for entrada mas a observação contém "Produto atualizado", é uma atualização
    if (mov.tipo === 'entrada' && mov.observacao && mov.observacao.includes('Produto atualizado')) {
      return 'Atualização de Produto';
    }
    
    const tipos = {
      'entrada': 'Entrada de Estoque',
      'saida': 'Saída de Estoque',
      'transferencia': 'Transferência',
      'venda': 'Venda',
      'atualizacao': 'Atualização de Produto'
    };
    return tipos[mov.tipo] || mov.tipo || 'Tipo não disponível';
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
                  {formatarDataResumo(filtros.dataInicio)} a {formatarDataResumo(filtros.dataFim)}
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
                  {formatarDataResumo(filtros.dataInicio)} a {formatarDataResumo(filtros.dataFim)}
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
                        <td>{getNomeUsuario(venda.registradoPor)}</td>
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
                    {movimentacoes.map((mov, index) => {
                      // Determinar se é uma atualização baseado na observação
                      const isAtualizacao = mov.tipo === 'entrada' && mov.observacao && mov.observacao.includes('Produto atualizado');
                      const rowClass = isAtualizacao ? 'atualizacao' : mov.tipo || 'sem-tipo';
                      
                      return (
                        <tr key={mov._id || index} className={`movimentacao-row ${rowClass}`}>
                          <td>{formatarData(mov.data)}</td>
                          <td>
                            <div className="tipo-movimentacao">
                              {renderIconeTipo(mov)}
                              <span>{getDescricaoTipo(mov)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="produto-info">
                              <span className="produto-nome">{getProdutoNome(mov)}</span>
                              {mov.produto ? (
                                <span className="produto-id">{getProdutoId(mov)}</span>
                              ) : (
                                <span className="produto-observacao">{mov.observacao}</span>
                              )}
                            </div>
                          </td>
                          <td>{isAtualizacao ? '-' : mov.quantidade || 0}</td>
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
                      );
                    })}
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
