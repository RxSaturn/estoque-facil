import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaSearch, FaCalendarAlt, FaFilter, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Vendas.css';

const Vendas = () => {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({
    dataInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    produto: '',
    local: ''
  });
  const [filtroAvancado, setFiltroAvancado] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [locais, setLocais] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        
        // Carregar produtos e locais para filtros
        const resProdutos = await api.get('/api/produtos');
        setProdutos(resProdutos.data.produtos);
        
        const resLocais = await api.get('/api/estoque/locais');
        setLocais(resLocais.data);
        
        // Carregar vendas iniciais
        await carregarVendas();
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        toast.error('Erro ao carregar dados. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarVendas = async () => {
    try {
      setCarregando(true);
      
      // Construir query string com filtros
      let query = `dataInicio=${filtros.dataInicio}&dataFim=${filtros.dataFim}`;
      if (filtros.produto) query += `&produto=${filtros.produto}`;
      if (filtros.local) query += `&local=${filtros.local}`;
      
      const resposta = await api.get(`/api/vendas?${query}`);
      setVendas(resposta.data.vendas);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas. Tente novamente.');
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
    carregarVendas();
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      dataFim: new Date().toISOString().split('T')[0],
      produto: '',
      local: ''
    });
    setFiltroAvancado(false);
  };

  if (carregando) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando vendas...</p>
      </div>
    );
  }

  return (
    <div className="vendas-container">
      <h1 className="page-title">
        <FaShoppingCart className="page-icon" /> Histórico de Vendas
      </h1>
      
      <div className="card filtro-card">
        <div className="filtro-header">
          <h2>
            <FaCalendarAlt /> Filtrar Vendas
          </h2>
          <button
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
      
      <div className="vendas-resumo">
        <div className="card resumo-card">
          <h3>Resumo do Período</h3>
          <div className="resumo-info">
            <div className="resumo-item">
              <span>Total de Vendas</span>
              <strong>{vendas.length}</strong>
            </div>
            <div className="resumo-item">
              <span>Produtos Vendidos</span>
              <strong>{vendas.reduce((total, venda) => total + venda.quantidade, 0)}</strong>
            </div>
            <div className="resumo-item">
              <span>Período</span>
              <strong>
                {new Date(filtros.dataInicio).toLocaleDateString('pt-BR')} a {new Date(filtros.dataFim).toLocaleDateString('pt-BR')}
              </strong>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>Histórico Detalhado</h3>
        
        {vendas.length > 0 ? (
          <div className="table-responsive">
            <table className="vendas-table">
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
                {vendas.map(venda => (
                  <tr key={venda._id}>
                    <td>{new Date(venda.dataVenda).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div className="produto-info">
                        <span className="produto-nome">{venda.produto.nome}</span>
                        <span className="produto-id">{venda.produto.id}</span>
                      </div>
                    </td>
                    <td>{venda.quantidade}</td>
                    <td>{venda.local}</td>
                    <td>{venda.registradoPor.nome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data-container">
            <p>Nenhuma venda encontrada para o período selecionado</p>
            {(filtros.produto || filtros.local) && (
              <p className="sub-text">Tente ajustar os filtros para ver mais resultados</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vendas;