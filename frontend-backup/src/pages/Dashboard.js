import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBoxOpen,
  FaExchangeAlt,
  FaChartLine,
  FaShoppingCart,
  FaExclamationTriangle,
  FaPlus,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import AuthContext from '../contexts/AuthContext';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { usuario } = useContext(AuthContext);
  const [resumo, setResumo] = useState({
    totalProdutos: 0,
    totalEstoque: 0,
    movimentacoesRecentes: 0,
    vendasRecentes: 0,
    alertasEstoque: 0
  });
  
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDadosDashboard = async () => {
      try {
        setCarregando(true);
        
        // Em uma implementação real, você teria um endpoint específico para o dashboard
        // Aqui estamos simulando com chamadas separadas
        const [resProdutos, resMovimentacoes] = await Promise.all([
          api.get('/api/produtos'),
          api.get('/api/vendas')
        ]);
        
        // Simular dados de resumo
        setResumo({
          totalProdutos: resProdutos.data.contagem || 0,
          totalEstoque: 250, // Dados simulados
          movimentacoesRecentes: 35, // Dados simulados
          vendasRecentes: 18, // Dados simulados
          alertasEstoque: 5 // Dados simulados
        });
        
        // Produtos com estoque baixo (simulado)
        setProdutos(resProdutos.data.produtos?.slice(0, 5) || []);
        
        // Movimentações recentes (simulado)
        setMovimentacoes([
          { 
            _id: '1', 
            tipo: 'transferencia', 
            quantidade: 10, 
            data: new Date(), 
            localOrigem: 'Depósito A',
            localDestino: 'Loja Central',
            produto: { nome: 'Coca-Cola 2L' }
          },
          { 
            _id: '2', 
            tipo: 'venda', 
            quantidade: 5, 
            data: new Date(Date.now() - 86400000),
            localOrigem: 'Loja Central',
            produto: { nome: 'Arroz Integral 1kg' }
          },
          { 
            _id: '3', 
            tipo: 'transferencia', 
            quantidade: 20, 
            data: new Date(Date.now() - 172800000),
            localOrigem: 'Depósito B',
            localDestino: 'Depósito A',
            produto: { nome: 'Feijão Preto 1kg' }
          },
          { 
            _id: '4', 
            tipo: 'venda', 
            quantidade: 8, 
            data: new Date(Date.now() - 259200000),
            localOrigem: 'Filial 1',
            produto: { nome: 'Detergente' }
          },
        ]);
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDadosDashboard();
  }, []);

  if (carregando) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h1>Bem-vindo, {usuario.nome}!</h1>
        <p>Aqui está um resumo do seu estoque atual.</p>
      </div>
      
      <div className="cards-grid">
        <div className="stat-card">
          <div className="card-icon produtos">
            <FaBoxOpen />
          </div>
          <div className="card-content">
            <h3>Total de Produtos</h3>
            <p className="card-value">{resumo.totalProdutos}</p>
            <Link to="/produtos" className="card-link">Ver todos</Link>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="card-icon estoque">
            <FaExchangeAlt />
          </div>
          <div className="card-content">
            <h3>Estoque Total</h3>
            <p className="card-value">{resumo.totalEstoque} itens</p>
            <Link to="/movimentacao" className="card-link">Gerenciar</Link>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="card-icon movimentacoes">
            <FaChartLine />
          </div>
          <div className="card-content">
            <h3>Movimentações</h3>
            <p className="card-value">{resumo.movimentacoesRecentes} recentes</p>
            <Link to="/relatorios" className="card-link">Relatórios</Link>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="card-icon vendas">
            <FaShoppingCart />
          </div>
          <div className="card-content">
            <h3>Vendas</h3>
            <p className="card-value">{resumo.vendasRecentes} hoje</p>
            <Link to="/vendas" className="card-link">Detalhes</Link>
          </div>
        </div>
        
        <div className="stat-card alertas">
          <div className="card-icon alertas">
            <FaExclamationTriangle />
          </div>
          <div className="card-content">
            <h3>Alertas</h3>
            <p className="card-value">{resumo.alertasEstoque} estoque baixo</p>
            <Link to="/relatorios" className="card-link">Ver alertas</Link>
          </div>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Produtos com Estoque Baixo</h2>
            <Link to="/produtos" className="btn-sm">
              <FaPlus /> Adicionar Produto
            </Link>
          </div>
          
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Local</th>
                  <th>Estoque</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {produtos.length > 0 ? (
                  produtos.map((produto, index) => (
                    <tr key={produto._id || index}>
                      <td>{produto.nome}</td>
                      <td>Depósito Principal</td>
                      <td>
                        {/* Simulando estoque baixo */}
                        {index === 0 ? 2 : index === 1 ? 3 : 5}
                      </td>
                      <td>
                        <span className={`status-badge ${index < 2 ? 'critico' : 'baixo'}`}>
                          {index < 2 ? 'Crítico' : 'Baixo'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">
                      Nenhum produto com estoque baixo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Movimentações Recentes</h2>
            <Link to="/movimentacao" className="btn-sm">
              <FaExchangeAlt /> Nova Movimentação
            </Link>
          </div>
          
          <div className="movimentacoes-list">
            {movimentacoes.map((mov, index) => (
              <div className="movimentacao-item" key={mov._id || index}>
                <div className={`movimentacao-tipo ${mov.tipo}`}>
                  {mov.tipo === 'transferencia' ? (
                    <FaExchangeAlt />
                  ) : mov.tipo === 'venda' ? (
                    <FaArrowUp />
                  ) : (
                    <FaArrowDown />
                  )}
                </div>
                
                <div className="movimentacao-info">
                  <h4>
                    {mov.tipo === 'transferencia' 
                      ? 'Transferência' 
                      : mov.tipo === 'venda' 
                        ? 'Venda' 
                        : 'Entrada'
                    }
                  </h4>
                  <p className="produto">{mov.produto.nome}</p>
                  <p className="detalhes">
                    {mov.tipo === 'transferencia' 
                      ? `${mov.localOrigem} → ${mov.localDestino}` 
                      : `${mov.localOrigem}`
                    }
                  </p>
                </div>
                
                <div className="movimentacao-quantidade">
                  <span className="quantidade">{mov.quantidade}</span>
                  <span className="data">
                    {new Date(mov.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <Link to="/vendas" className="ver-tudo-link">
            Ver todas as movimentações
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;