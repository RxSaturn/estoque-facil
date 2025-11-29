/**
 * ReportFilters - Componente de filtros para relatórios
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { FaFilter, FaCalendarAlt, FaTimes, FaSearch } from 'react-icons/fa';
import { useTipos, useCategorias, useSubcategorias } from '../../hooks/useProdutos';
import { useLocais } from '../../hooks/useEstoque';
import { periodosPredefinidos } from '../../hooks/useRelatorios';
import './ReportFilters.css';

const ReportFilters = memo(({ 
  filtros, 
  onChange, 
  onApply, 
  loading = false 
}) => {
  const [expanded, setExpanded] = useState(true);

  // Buscar opções dos selects
  const { data: tipos = [] } = useTipos();
  const { data: categorias = [] } = useCategorias(filtros.tipo);
  const { data: subcategorias = [] } = useSubcategorias(filtros.tipo, filtros.categoria);
  const { data: locais = [] } = useLocais();

  const handleChange = useCallback((field, value) => {
    const newFiltros = { ...filtros, [field]: value };
    
    // Limpar campos dependentes
    if (field === 'tipo') {
      newFiltros.categoria = '';
      newFiltros.subcategoria = '';
    }
    if (field === 'categoria') {
      newFiltros.subcategoria = '';
    }
    
    onChange(newFiltros);
  }, [filtros, onChange]);

  const handlePeriodoRapido = useCallback((periodo) => {
    const datas = periodosPredefinidos[periodo]();
    onChange({
      ...filtros,
      dataInicio: datas.dataInicio,
      dataFim: datas.dataFim
    });
  }, [filtros, onChange]);

  const handleLimpar = useCallback(() => {
    onChange({
      dataInicio: periodosPredefinidos.mesAtual().dataInicio,
      dataFim: periodosPredefinidos.mesAtual().dataFim,
      tipo: '',
      categoria: '',
      subcategoria: '',
      local: '',
      metodoCalculo: 'transacoes'
    });
  }, [onChange]);

  return (
    <div className="report-filters">
      <div className="filters-header" onClick={() => setExpanded(!expanded)}>
        <h3>
          <FaFilter />
          Filtros do Relatório
        </h3>
        <button className="btn-toggle">
          {expanded ? '−' : '+'}
        </button>
      </div>

      {expanded && (
        <div className="filters-content">
          {/* Período */}
          <div className="filters-section">
            <h4><FaCalendarAlt /> Período</h4>
            <div className="periodo-rapido">
              <button 
                type="button"
                className="btn-periodo"
                onClick={() => handlePeriodoRapido('ultimaSemana')}
              >
                Última Semana
              </button>
              <button 
                type="button"
                className="btn-periodo"
                onClick={() => handlePeriodoRapido('ultimoMes')}
              >
                Último Mês
              </button>
              <button 
                type="button"
                className="btn-periodo"
                onClick={() => handlePeriodoRapido('ultimoTrimestre')}
              >
                Último Trimestre
              </button>
              <button 
                type="button"
                className="btn-periodo"
                onClick={() => handlePeriodoRapido('mesAtual')}
              >
                Mês Atual
              </button>
            </div>
            <div className="filters-row">
              <div className="filter-group">
                <label>Data Início</label>
                <input
                  type="date"
                  value={filtros.dataInicio || ''}
                  onChange={(e) => handleChange('dataInicio', e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Data Fim</label>
                <input
                  type="date"
                  value={filtros.dataFim || ''}
                  onChange={(e) => handleChange('dataFim', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>

          {/* Produto */}
          <div className="filters-section">
            <h4>Produto</h4>
            <div className="filters-row filters-row-3">
              <div className="filter-group">
                <label>Tipo</label>
                <select
                  value={filtros.tipo || ''}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos</option>
                  {tipos.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Categoria</label>
                <select
                  value={filtros.categoria || ''}
                  onChange={(e) => handleChange('categoria', e.target.value)}
                  className="filter-select"
                  disabled={!filtros.tipo}
                >
                  <option value="">Todas</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Subcategoria</label>
                <select
                  value={filtros.subcategoria || ''}
                  onChange={(e) => handleChange('subcategoria', e.target.value)}
                  className="filter-select"
                  disabled={!filtros.categoria}
                >
                  <option value="">Todas</option>
                  {subcategorias.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Local e Método */}
          <div className="filters-section">
            <h4>Opções</h4>
            <div className="filters-row">
              <div className="filter-group">
                <label>Local</label>
                <select
                  value={filtros.local || ''}
                  onChange={(e) => handleChange('local', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos</option>
                  {locais.map((local) => (
                    <option key={local} value={local}>{local}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Método de Cálculo</label>
                <select
                  value={filtros.metodoCalculo || 'transacoes'}
                  onChange={(e) => handleChange('metodoCalculo', e.target.value)}
                  className="filter-select"
                >
                  <option value="transacoes">Por Número de Vendas</option>
                  <option value="quantidade">Por Quantidade Vendida</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="filters-actions">
            <button 
              type="button"
              className="btn-limpar"
              onClick={handleLimpar}
            >
              <FaTimes /> Limpar
            </button>
            <button 
              type="button"
              className="btn-aplicar"
              onClick={onApply}
              disabled={loading || !filtros.dataInicio || !filtros.dataFim}
            >
              <FaSearch /> {loading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ReportFilters.displayName = 'ReportFilters';

export default ReportFilters;
