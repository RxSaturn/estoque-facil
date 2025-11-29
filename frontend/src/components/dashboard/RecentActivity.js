/**
 * RecentActivity - Componente de atividades/movimentações recentes
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHistory, 
  FaExchangeAlt, 
  FaShoppingCart, 
  FaArrowDown, 
  FaArrowUp 
} from 'react-icons/fa';
import SkeletonCard from './SkeletonCard';
import './RecentActivity.css';

const getMovementIcon = (tipo) => {
  switch (tipo) {
    case 'transferencia':
      return { icon: FaExchangeAlt, className: 'transferencia' };
    case 'venda':
      return { icon: FaShoppingCart, className: 'venda' };
    case 'entrada':
      return { icon: FaArrowDown, className: 'entrada' };
    case 'saida':
      return { icon: FaArrowUp, className: 'saida' };
    default:
      return { icon: FaHistory, className: 'outro' };
  }
};

const getMovementLabel = (tipo) => {
  switch (tipo) {
    case 'transferencia':
      return 'Transferência';
    case 'venda':
      return 'Venda';
    case 'entrada':
      return 'Entrada';
    case 'saida':
      return 'Saída';
    default:
      return tipo;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RecentActivity = memo(({ 
  movimentacoes = [], 
  loading = false, 
  error = null,
  onRefresh 
}) => {
  if (loading) {
    return <SkeletonCard variant="list" />;
  }

  if (error) {
    return (
      <div className="recent-activity-card recent-activity-error">
        <div className="recent-activity-header">
          <h2>
            <FaHistory className="header-icon" />
            Movimentações Recentes
          </h2>
        </div>
        <div className="recent-activity-error-content">
          <p>Erro ao carregar movimentações</p>
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
    <div className="recent-activity-card">
      <div className="recent-activity-header">
        <h2>
          <FaHistory className="header-icon" />
          Movimentações Recentes
        </h2>
      </div>

      {movimentacoes.length === 0 ? (
        <div className="recent-activity-empty">
          <p>Nenhuma movimentação recente.</p>
        </div>
      ) : (
        <>
          <div className="recent-activity-list">
            {movimentacoes.map((mov, index) => {
              const { icon: IconComponent, className } = getMovementIcon(mov.tipo);
              return (
                <div key={mov.id || index} className="activity-item">
                  <div className={`activity-icon ${className}`}>
                    <IconComponent />
                  </div>
                  <div className="activity-info">
                    <h4>{getMovementLabel(mov.tipo)}</h4>
                    <p className="activity-produto">
                      {mov.produtoNome || mov.produto?.nome || 'Produto'}
                    </p>
                    <p className="activity-local">
                      {mov.localOrigem}
                      {mov.localDestino && ` → ${mov.localDestino}`}
                    </p>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-quantidade">
                      {mov.tipo === 'entrada' ? '+' : mov.tipo === 'saida' || mov.tipo === 'venda' ? '-' : ''}
                      {mov.quantidade}
                    </span>
                    <span className="activity-data">{formatDate(mov.data)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <Link to="/historico" className="recent-activity-footer-link">
            Ver histórico completo
          </Link>
        </>
      )}
    </div>
  );
});

RecentActivity.displayName = 'RecentActivity';

export default RecentActivity;
