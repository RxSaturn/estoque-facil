import React, { useState, useEffect } from 'react';
import { 
  FaFileAlt, 
  FaDownload, 
  FaChartBar, 
  FaCalendarAlt, 
  FaExclamationTriangle, 
  FaBoxOpen
} from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import './Relatorios.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Relatorios = () => {
  const [filtros, setFiltros] = useState({
    dataInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    tipo: '',
    categoria: '',
    local: ''
  });
  
  const [carregando, setCarregando] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [activeTab, setActiveTab] = useState('geral');
  
  // Carregar dados de filtro ao montar o componente
  useEffect(() => {
    const carregarOpcoesFiltro = async () => {
      try {
        // Carregar tipos de produto
        const resTipos = await api.get('/api/produtos/tipos');
        setTipos(resTipos.data);
        
        // Carregar categorias de produto
        const resCategorias = await api.get('/api/produtos/categorias');
        setCategorias(resCategorias.data);
        
        // Carregar locais
        const resLocais = await api.get('/api/estoque/locais');
        setLocais(resLocais.data);
        
        // Carregar dados do relatório inicial
        carregarResumo();
      } catch (error) {
        console.error('Erro ao carregar opções de filtro:', error);
        toast.error('Erro ao carregar dados iniciais. Tente novamente.');
      }
    };
    
    carregarOpcoesFiltro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const carregarResumo = async () => {
    try {
      setCarregando(true);
      
      // Construir query string com filtros
      let query = `dataInicio=${filtros.dataInicio}&dataFim=${filtros.dataFim}`;
      if (filtros.tipo) query += `&tipo=${filtros.tipo}`;
      if (filtros.categoria) query += `&categoria=${filtros.categoria}`;
      if (filtros.local) query += `&local=${filtros.local}`;
      
      const resposta = await api.get(`/api/relatorios/resumo?${query}`);
      setResumo(resposta.data);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };
  
  const gerarRelatorio = (e) => {
    e.preventDefault();
    carregarResumo();
  };
  
  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDownloadRelatorio = async () => {
    try {
      setGerandoPDF(true);
      
      // Construir query string com filtros
      let query = `dataInicio=${filtros.dataInicio}&dataFim=${filtros.dataFim}`;
      if (filtros.tipo) query += `&tipo=${filtros.tipo}`;
      if (filtros.categoria) query += `&categoria=${filtros.categoria}`;
      if (filtros.local) query += `&local=${filtros.local}`;
      
      const resposta = await api.get(`/api/relatorios/pdf?${query}`, {
        responseType: 'blob'
      });
      
      // Criar objeto URL para o blob
      const url = window.URL.createObjectURL(new Blob([resposta.data]));
      
      // Criar elemento de link e simular clique para download
      const link = document.createElement('a');
      link.href = url;
      
      // Nome do arquivo para download
      const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.setAttribute('download', `estoque-facil-relatorio-${dataHoje}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      
      // Limpar após download
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGerandoPDF(false);
    }
  };

  return (
    <div className="relatorios-container">
      <h1 className="page-title">Relatórios</h1>
      
      <div className="card filtros-card">
        <h2>
          <FaCalendarAlt /> Período e Filtros
        </h2>
        
        <form onSubmit={gerarRelatorio}>
          <div className="filtros-grid">
            <div className="form-group">
              <label htmlFor="dataInicio">Data Inicial</label>
              <input
                type="date"
                id="dataInicio"
                name="dataInicio"
                value={filtros.dataInicio}
                onChange={handleChangeFiltro}
                required
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
                required
                min={filtros.dataInicio}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tipo">Tipo de Produto</label>
              <select
                id="tipo"
                name="tipo"
                value={filtros.tipo}
                onChange={handleChangeFiltro}
              >
                <option value="">Todos</option>
                {tipos.map((tipo, index) => (
                  <option key={index} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="categoria">Categoria</label>
              <select
                id="categoria"
                name="categoria"
                value={filtros.categoria}
                onChange={handleChangeFiltro}
              >
                <option value="">Todas</option>
                {categorias.map((categoria, index) => (
                  <option key={index} value={categoria}>{categoria}</option>
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
          </div>
          
          <div className="filtros-actions">
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={carregando}
            >
              {carregando ? 'Gerando...' : 'Gerar Relatório'}
            </button>
            
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadRelatorio}
              disabled={!resumo || gerandoPDF}
            >
              <FaDownload /> {gerandoPDF ? 'Gerando PDF...' : 'Baixar PDF'}
            </button>
          </div>
        </form>
      </div>
      
      {carregando ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Gerando relatório...</p>
        </div>
      ) : resumo ? (
        <div className="relatorio-resultados">
          {/* Cabeçalho do relatório */}
          <div className="relatorio-header">
            <div>
              <h2>Relatório de Estoque e Vendas</h2>
              <p>
                Período: {new Date(filtros.dataInicio).toLocaleDateString('pt-BR')} a {new Date(filtros.dataFim).toLocaleDateString('pt-BR')}
              </p>
              {filtros.tipo && <p>Tipo: {filtros.tipo}</p>}
              {filtros.categoria && <p>Categoria: {filtros.categoria}</p>}
              {filtros.local && <p>Local: {filtros.local}</p>}
            </div>
            
            <div className="relatorio-sumario">
              <div className="sumario-item">
                <p>Total de Produtos</p>
                <h3>{resumo.totalProdutos}</h3>
              </div>
              
              <div className="sumario-item">
                <p>Total de Vendas</p>
                <h3>{resumo.totalVendas}</h3>
              </div>
              
              <div className="sumario-item">
                <p>Itens Sem Movimentação</p>
                <h3>{resumo.semMovimentacao}</h3>
              </div>
            </div>
          </div>
          
          {/* Tabs para visualização de diferentes relatórios */}
          <div className="relatorio-tabs">
            <button 
              className={`tab-btn ${activeTab === 'geral' ? 'active' : ''}`}
              onClick={() => setActiveTab('geral')}
            >
              <FaChartBar /> Visão Geral
            </button>
            <button 
              className={`tab-btn ${activeTab === 'topProdutos' ? 'active' : ''}`}
              onClick={() => setActiveTab('topProdutos')}
            >
              <FaBoxOpen /> Top Produtos
            </button>
            <button 
              className={`tab-btn ${activeTab === 'semMovimentacao' ? 'active' : ''}`}
              onClick={() => setActiveTab('semMovimentacao')}
            >
              <FaExclamationTriangle /> Sem Movimentação
            </button>
          </div>
          
          {/* Conteúdo da tab selecionada */}
          <div className="tab-content">
            {activeTab === 'geral' && (
              <div className="tab-geral">
                <div className="graficos-grid">
                  <div className="grafico-card">
                    <h3>Vendas por Categoria</h3>
                    <div className="grafico">
                      {resumo.vendasPorCategoria.labels.length > 0 ? (
                        <Bar 
                          data={{
                            labels: resumo.vendasPorCategoria.labels,
                            datasets: [
                              {
                                label: 'Quantidade Vendida',
                                data: resumo.vendasPorCategoria.dados,
                                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 1
                              }
                            ]
                          }}
                          options={{ 
                            responsive: true,
                            plugins: {
                              legend: {
                                display: false
                              }
                            }
                          }}
                        />
                      ) : (
                        <p className="no-data">Sem dados para exibir</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grafico-card">
                    <h3>Estoque por Local</h3>
                    <div className="grafico">
                      {resumo.estoquePorLocal.labels.length > 0 ? (
                        <Pie 
                          data={{
                            labels: resumo.estoquePorLocal.labels,
                            datasets: [
                              {
                                data: resumo.estoquePorLocal.dados,
                                backgroundColor: [
                                  'rgba(54, 162, 235, 0.6)',
                                  'rgba(255, 99, 132, 0.6)',
                                  'rgba(255, 206, 86, 0.6)',
                                  'rgba(75, 192, 192, 0.6)',
                                  'rgba(153, 102, 255, 0.6)',
                                  'rgba(255, 159, 64, 0.6)'
                                ],
                                borderWidth: 1
                              }
                            ]
                          }}
                          options={{ responsive: true }}
                        />
                      ) : (
                        <p className="no-data">Sem dados para exibir</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="indicadores">
                  <div className="indicador-card">
                    <h3>Estatísticas do Período</h3>
                    <div className="indicadores-grid">
                      <div className="indicador">
                        <p className="indicador-titulo">Média de Vendas Diárias</p>
                        <p className="indicador-valor">{resumo.mediaVendasDiarias.toFixed(2)}</p>
                      </div>
                      
                      <div className="indicador">
                        <p className="indicador-titulo">Total de Itens Vendidos</p>
                        <p className="indicador-valor">{resumo.totalItensVendidos}</p>
                      </div>
                      
                      <div className="indicador">
                        <p className="indicador-titulo">Dia com Maior Venda</p>
                        <p className="indicador-valor">{resumo.diaMaiorVenda ? new Date(resumo.diaMaiorVenda).toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                      
                      <div className="indicador">
                        <p className="indicador-titulo">Produtos com Estoque Crítico</p>
                        <p className="indicador-valor">{resumo.produtosEstoqueCritico}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'topProdutos' && (
              <div className="tab-top-produtos">
                <h3>Top Produtos Vendidos</h3>
                
                {resumo.topProdutos.length > 0 ? (
                  <div className="table-responsive">
                    <table className="relatorio-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Produto</th>
                          <th>Tipo</th>
                          <th>Categoria</th>
                          <th>Quantidade Vendida</th>
                          <th>% do Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumo.topProdutos.map((item, index) => (
                          <tr key={index}>
                            <td>{item.id}</td>
                            <td>{item.nome}</td>
                            <td>{item.tipo}</td>
                            <td>{item.categoria}</td>
                            <td>{item.quantidade}</td>
                            <td>{item.percentual}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data-message">Nenhuma venda registrada no período selecionado.</p>
                )}
                
                {resumo.topProdutos.length > 0 && (
                  <div className="grafico-barra-horizontal">
                    <Bar 
                      data={{
                        labels: resumo.topProdutos.slice(0, 10).map(item => item.nome),
                        datasets: [
                          {
                            label: 'Quantidade Vendida',
                            data: resumo.topProdutos.slice(0, 10).map(item => item.quantidade),
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                          }
                        ]
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: true,
                            text: 'Top 10 Produtos Vendidos'
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'semMovimentacao' && (
              <div className="tab-sem-movimentacao">
                <h3>Produtos Sem Movimentação</h3>
                
                {resumo.produtosSemMovimentacao.length > 0 ? (
                  <div className="table-responsive">
                    <table className="relatorio-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Produto</th>
                          <th>Tipo</th>
                          <th>Categoria</th>
                          <th>Local</th>
                          <th>Estoque</th>
                          <th>Última Movimentação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumo.produtosSemMovimentacao.map((item, index) => (
                          <tr key={index}>
                            <td>{item.id}</td>
                            <td>{item.nome}</td>
                            <td>{item.tipo}</td>
                            <td>{item.categoria}</td>
                            <td>{item.local}</td>
                            <td>{item.quantidade}</td>
                            <td>{item.ultimaMovimentacao ? new Date(item.ultimaMovimentacao).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data-message">Todos os produtos tiveram movimentação no período selecionado.</p>
                )}
                
                {resumo.produtosSemMovimentacao.length > 0 && resumo.estoqueSemMovimentacao.labels.length > 0 && (
                  <div className="grafico-sem-movimentacao">
                    <h4>Distribuição de Produtos sem Movimentação por Local</h4>
                    <Pie 
                      data={{
                        labels: resumo.estoqueSemMovimentacao.labels,
                        datasets: [
                          {
                            data: resumo.estoqueSemMovimentacao.dados,
                            backgroundColor: [
                              'rgba(255, 99, 132, 0.6)',
                              'rgba(54, 162, 235, 0.6)',
                              'rgba(255, 206, 86, 0.6)',
                              'rgba(75, 192, 192, 0.6)',
                              'rgba(153, 102, 255, 0.6)',
                              'rgba(255, 159, 64, 0.6)'
                            ],
                            borderWidth: 1
                          }
                        ]
                      }}
                      options={{ 
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Produtos sem Movimentação por Local'
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relatorio-placeholder">
          <FaFileAlt className="placeholder-icon" />
          <h2>Gere um relatório</h2>
          <p>Configure os filtros acima e clique em "Gerar Relatório" para visualizar os resultados.</p>
        </div>
      )}
    </div>
  );
};

export default Relatorios;