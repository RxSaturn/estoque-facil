/**
 * MetricCard - Card de métrica individual do dashboard
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './MetricCard.css';

const MetricCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'primary',
  link,
  linkText = 'Ver mais',
  trend,
  trendLabel,
  suffix,
  loading = false,
  children
}) => {
  const getTrendClass = () => {
    if (!trend) return '';
    return trend > 0 ? 'trend-positive' : trend < 0 ? 'trend-negative' : '';
  };

  if (loading) {
    return (
      <div className="metric-card metric-card-loading">
        <div className="metric-card-icon skeleton-pulse" />
        <div className="metric-card-content">
          <div className="skeleton-line skeleton-line-sm" />
          <div className="skeleton-line skeleton-line-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="metric-card">
      {Icon && (
        <div className={`metric-card-icon metric-card-icon-${iconColor}`}>
          <Icon />
        </div>
      )}
      <div className="metric-card-content">
        <h3 className="metric-card-title">{title}</h3>
        <div className="metric-card-value">
          <span className="metric-value-number">
            {value}
            {suffix && <span className="metric-value-suffix">{suffix}</span>}
          </span>
          {typeof trend === 'number' && (
            <span className={`metric-trend ${getTrendClass()}`}>
              {trend > 0 ? <FaArrowUp /> : trend < 0 ? <FaArrowDown /> : null}
              <span>{Math.abs(trend)}%</span>
              {trendLabel && <span className="trend-label">{trendLabel}</span>}
            </span>
          )}
        </div>
        {children}
        {link && (
          <Link to={link} className="metric-card-link">
            {linkText}
          </Link>
        )}
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;
