/**
 * Skeleton - Componente de loading placeholder
 */

import React from 'react';
import './Skeleton.css';

const Skeleton = ({ 
  width = '100%', 
  height = '1em', 
  variant = 'text',
  className = '',
  count = 1,
  style = {}
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return 'skeleton-circular';
      case 'rectangular':
        return 'skeleton-rectangular';
      case 'text':
      default:
        return 'skeleton-text';
    }
  };

  const skeletonStyle = {
    width,
    height: variant === 'circular' ? width : height,
    ...style
  };

  if (count > 1) {
    return (
      <div className="skeleton-container">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`skeleton ${getVariantClass()} ${className}`}
            style={skeletonStyle}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${getVariantClass()} ${className}`}
      style={skeletonStyle}
    />
  );
};

export default Skeleton;
