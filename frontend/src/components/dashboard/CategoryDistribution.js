/**
 * CategoryDistribution - Componente de distribuição por categorias
 */

import React, { memo } from 'react';
import { FaTags } from 'react-icons/fa';
import SkeletonCard from './SkeletonCard';
import './CategoryDistribution.css';

// Cores para as categorias
const CATEGORY_COLORS = [
  '#2563EB', // Azul
  '#10B981', // Verde
  '#F59E0B', // Amarelo
  '#EF4444', // Vermelho
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
  '#14B8A6', // Teal
  '#F97316', // Laranja
];

const CategoryDistribution = memo(({ 
  categorias = [], 
  loading = false, 
  error = null 
}) => {
  if (loading) {
    return <SkeletonCard variant="chart" />;
  }

  if (error) {
    return (
      <div className="category-distribution-card category-distribution-error">
        <div className="category-distribution-header">
          <h2>
            <FaTags className="header-icon" />
            Distribuição por Categoria
          </h2>
        </div>
        <div className="category-distribution-error-content">
          <p>Erro ao carregar categorias</p>
        </div>
      </div>
    );
  }

  // Calcular total para percentuais
  const total = categorias.reduce((sum, cat) => sum + cat.quantidade, 0);

  return (
    <div className="category-distribution-card">
      <div className="category-distribution-header">
        <h2>
          <FaTags className="header-icon" />
          Distribuição por Categoria
        </h2>
      </div>

      {categorias.length === 0 ? (
        <div className="category-distribution-empty">
          <p>Nenhuma categoria cadastrada.</p>
        </div>
      ) : (
        <div className="category-distribution-content">
          {categorias.slice(0, 8).map((categoria, index) => {
            const percentual = total > 0 ? ((categoria.quantidade / total) * 100).toFixed(1) : 0;
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

            return (
              <div key={categoria.nome} className="category-item">
                <div className="category-info">
                  <span 
                    className="category-color" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="category-nome">{categoria.nome}</span>
                </div>
                <div className="category-data">
                  <span className="category-count">
                    {categoria.quantidade} {categoria.quantidade === 1 ? 'produto' : 'produtos'}
                  </span>
                  <span className="category-percent">{percentual}%</span>
                </div>
                <div className="category-bar-container">
                  <div 
                    className="category-bar"
                    style={{ 
                      width: `${percentual}%`,
                      backgroundColor: color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

CategoryDistribution.displayName = 'CategoryDistribution';

export default CategoryDistribution;
