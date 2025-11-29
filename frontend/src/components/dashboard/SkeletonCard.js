/**
 * SkeletonCard - Placeholder de carregamento para cards do dashboard
 */

import React from 'react';
import Skeleton from '../ui/Skeleton';
import './SkeletonCard.css';

const SkeletonCard = ({ variant = 'stat' }) => {
  if (variant === 'stat') {
    return (
      <div className="skeleton-stat-card">
        <div className="skeleton-stat-icon">
          <Skeleton variant="circular" width="60px" height="60px" />
        </div>
        <div className="skeleton-stat-content">
          <Skeleton width="60%" height="14px" />
          <Skeleton width="40%" height="24px" />
          <Skeleton width="80%" height="12px" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="skeleton-table-card">
        <div className="skeleton-table-header">
          <Skeleton width="150px" height="20px" />
          <Skeleton width="80px" height="32px" />
        </div>
        <div className="skeleton-table-rows">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-table-row">
              <Skeleton width="30%" height="14px" />
              <Skeleton width="20%" height="14px" />
              <Skeleton width="15%" height="24px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="skeleton-chart-card">
        <div className="skeleton-chart-header">
          <Skeleton width="120px" height="20px" />
        </div>
        <div className="skeleton-chart-body">
          <Skeleton variant="rectangular" width="100%" height="200px" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="skeleton-list-card">
        <div className="skeleton-list-header">
          <Skeleton width="150px" height="20px" />
        </div>
        <div className="skeleton-list-items">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-list-item">
              <Skeleton variant="circular" width="40px" height="40px" />
              <div className="skeleton-list-item-content">
                <Skeleton width="70%" height="14px" />
                <Skeleton width="50%" height="12px" />
              </div>
              <Skeleton width="60px" height="14px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default
  return (
    <div className="skeleton-default-card">
      <Skeleton variant="rectangular" width="100%" height="120px" />
    </div>
  );
};

export default SkeletonCard;
