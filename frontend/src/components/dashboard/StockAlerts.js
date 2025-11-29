/**
 * StockAlerts - Componente de alertas de estoque baixo
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import SkeletonCard from './SkeletonCard';
import './StockAlerts.css';

const getStatusLabel = (status) => {
  switch (status) {
    case 'esgotado':
      return 'Esgotado';
    case 'critico':
      return 'Crítico';
    case 'baixo':
      return 'Baixo';
    default:
      return 'Normal';
  }
};

const StockAlerts = memo(({ 
  produtos = [], 
  loading = false, 
  error = null,
  onRefresh
}) => {
  if (loading) {
    return <SkeletonCard variant="table" />;
  }

  if (error) {
    return (
      <div className="stock-alerts-card stock-alerts-error">
        <div className="stock-alerts-header">
          <h2>
            <FaExclamationTriangle className="header-icon" />
            Alertas de Estoque
          </h2>
        </div>
        <div className="stock-alerts-error-content">
          <p>Erro ao carregar alertas de estoque</p>
          {onRefresh && (
            <button onClick={onRefresh} className="btn-retry">
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="stock-alerts-card">
      <div className="stock-alerts-header">
        <h2>
          <FaExclamationTriangle className="header-icon" />
          Alertas de Estoque
        </h2>
        <Link to="/movimentacao" className="btn-add">
          <FaPlus /> Repor
        </Link>
      </div>

      {produtos.length === 0 ? (
        <div className="stock-alerts-empty">
          <p>Nenhum produto com estoque baixo no momento.</p>
        </div>
      ) : (
        <>
          <div className="stock-alerts-table-wrapper">
            <table className="stock-alerts-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Local</th>
                  <th>Qtd</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto, index) => (
                  <tr key={produto.id || index}>
                    <td className="produto-nome" title={produto.nome}>
                      {produto.nome}
                    </td>
                    <td className="produto-local">{produto.local}</td>
                    <td className="produto-quantidade">{produto.estoqueAtual || produto.quantidade}</td>
                    <td>
                      <span className={`status-badge ${produto.status}`}>
                        {getStatusLabel(produto.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Link to="/produtos" className="stock-alerts-footer-link">
            Ver todos os produtos
          </Link>
        </>
      )}
    </div>
  );
});

StockAlerts.displayName = 'StockAlerts';

export default StockAlerts;
