/**
 * ReportPreview - Componente de prévia dos dados do relatório
 */

import React, { memo, useMemo } from 'react';
import { 
  FaBox, 
  FaShoppingCart, 
  FaChartBar, 
  FaCalendarDay,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import Skeleton from '../ui/Skeleton';
import './ReportPreview.css';

const ReportPreview = memo(({ 
  data, 
  loading = false, 
  error = null 
}) => {
  // Ordenar top produtos
  const topProdutosOrdenados = useMemo(() => {
    if (!data?.topProdutos) return [];
    return [...data.topProdutos].sort((a, b) => 
      (b.transacoes || b.quantidade || 0) - (a.transacoes || a.quantidade || 0)
    ).slice(0, 10);
  }, [data?.topProdutos]);

  if (loading) {
    return (
      <div className="report-preview">
        <div className="preview-header">
          <h3>Prévia do Relatório</h3>
        </div>
        <div className="preview-content">
          <div className="preview-stats">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="preview-stat-card">
                <Skeleton variant="circular" width="40px" height="40px" />
                <div className="stat-info">
                  <Skeleton width="60%" height="14px" />
                  <Skeleton width="40%" height="20px" />
                </div>
              </div>
            ))}
          </div>
          <div className="preview-section">
            <Skeleton width="150px" height="20px" />
            <div style={{ marginTop: '15px' }}>
              <Skeleton count={5} height="40px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-preview report-preview-error">
        <div className="preview-header">
          <h3>Prévia do Relatório</h3>
        </div>
        <div className="preview-error-content">
          <p>Erro ao carregar prévia do relatório</p>
          <p className="error-detail">{error.message || 'Tente novamente'}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="report-preview report-preview-empty">
        <div className="preview-header">
          <h3>Prévia do Relatório</h3>
        </div>
        <div className="preview-empty-content">
          <FaChartBar className="empty-icon" />
          <p>Selecione os filtros e gere o relatório para ver a prévia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-preview">
      <div className="preview-header">
        <h3>Prévia do Relatório</h3>
        <span className="preview-badge">
          {data.totalVendas || 0} vendas no período
        </span>
      </div>

      <div className="preview-content">
        {/* Cards de estatísticas */}
        <div className="preview-stats">
          <div className="preview-stat-card">
            <div className="stat-icon stat-icon-blue">
              <FaBox />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total de Produtos</span>
              <span className="stat-value">{data.totalProdutos || 0}</span>
            </div>
          </div>

          <div className="preview-stat-card">
            <div className="stat-icon stat-icon-green">
              <FaShoppingCart />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total de Vendas</span>
              <span className="stat-value">{data.totalVendas || 0}</span>
            </div>
          </div>

          <div className="preview-stat-card">
            <div className="stat-icon stat-icon-orange">
              <FaChartBar />
            </div>
            <div className="stat-info">
              <span className="stat-label">Média Diária</span>
              <span className="stat-value">
                {(data.mediaVendasDiarias || 0).toFixed(1)}
              </span>
            </div>
          </div>

          <div className="preview-stat-card">
            <div className="stat-icon stat-icon-purple">
              <FaCalendarDay />
            </div>
            <div className="stat-info">
              <span className="stat-label">Dia de Maior Venda</span>
              <span className="stat-value">
                {(() => {
                  if (!data.diaMaiorVenda) return '-';
                  const date = new Date(data.diaMaiorVenda);
                  // Verificar se a data é válida
                  if (isNaN(date.getTime())) return '-';
                  return date.toLocaleDateString('pt-BR');
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Top produtos */}
        {topProdutosOrdenados.length > 0 && (
          <div className="preview-section">
            <h4>Top Produtos</h4>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Vendas</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {topProdutosOrdenados.map((produto, index) => (
                    <tr key={produto.id || index}>
                      <td className="td-rank">
                        <span className={`rank-badge ${index < 3 ? `rank-${index + 1}` : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="td-nome" title={produto.nome}>
                        {produto.nome}
                      </td>
                      <td className="td-categoria">{produto.categoria || '-'}</td>
                      <td className="td-vendas">
                        {produto.transacoes || produto.quantidade || 0}
                      </td>
                      <td className="td-percent">
                        {(produto.percentual || 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vendas por categoria */}
        {data.vendasPorCategoria?.labels?.length > 0 && (
          <div className="preview-section">
            <h4>Vendas por Categoria</h4>
            <div className="category-bars">
              {data.vendasPorCategoria.labels.map((label, index) => {
                const valor = data.vendasPorCategoria.dados[index] || 0;
                const total = data.vendasPorCategoria.dados.reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (valor / total) * 100 : 0;
                
                return (
                  <div key={label} className="category-bar-item">
                    <div className="category-bar-info">
                      <span className="category-bar-label">{label}</span>
                      <span className="category-bar-value">{valor}</span>
                    </div>
                    <div className="category-bar-container">
                      <div 
                        className="category-bar-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ReportPreview.displayName = 'ReportPreview';

export default ReportPreview;
