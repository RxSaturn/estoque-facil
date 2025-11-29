/**
 * SalesChart - Componente de gráfico de vendas
 */

import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaChartLine, FaTrophy } from 'react-icons/fa';
import SkeletonCard from './SkeletonCard';
import './SalesChart.css';

const SalesChart = memo(({ 
  topProdutos = [], 
  loading = false, 
  error = null 
}) => {
  // Encontrar o máximo para calcular barras proporcionais
  const maxVendas = useMemo(() => {
    if (topProdutos.length === 0) return 0;
    return Math.max(...topProdutos.map(p => p.quantidadeVendas || 0));
  }, [topProdutos]);

  const getRankClass = (index) => {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return '';
  };

  if (loading) {
    return <SkeletonCard variant="table" />;
  }

  if (error) {
    return (
      <div className="sales-chart-card sales-chart-error">
        <div className="sales-chart-header">
          <h2>
            <FaTrophy className="header-icon" />
            Produtos Mais Vendidos
          </h2>
        </div>
        <div className="sales-chart-error-content">
          <p>Erro ao carregar dados de vendas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-chart-card">
      <div className="sales-chart-header">
        <h2>
          <FaTrophy className="header-icon" />
          Produtos Mais Vendidos
        </h2>
        <Link to="/relatorios" className="btn-ver-relatorio">
          <FaChartLine /> Relatórios
        </Link>
      </div>

      {topProdutos.length === 0 ? (
        <div className="sales-chart-empty">
          <p>Nenhuma venda registrada nos últimos 3 meses.</p>
        </div>
      ) : (
        <div className="sales-chart-content">
          {topProdutos.slice(0, 5).map((produto, index) => {
            const barWidth = maxVendas > 0 
              ? ((produto.quantidadeVendas || 0) / maxVendas) * 100 
              : 0;

            return (
              <div key={produto.id || index} className="sales-item">
                <div className="sales-rank">
                  <span className={`rank-badge ${getRankClass(index)}`}>
                    {index + 1}º
                  </span>
                </div>
                <div className="sales-info">
                  <h4 className="sales-produto-nome" title={produto.nome}>
                    {produto.nome}
                  </h4>
                  <div className="sales-bar-container">
                    <div 
                      className={`sales-bar ${getRankClass(index)}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                <div className="sales-count">
                  <span className="sales-number">{produto.quantidadeVendas || 0}</span>
                  <span className="sales-label">vendas</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

SalesChart.displayName = 'SalesChart';

export default SalesChart;
