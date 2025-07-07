import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    {(title || actions) && (
      <div className="flex justify-between items-center mb-4">
        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        {actions}
      </div>
    )}
    {children}
  </div>
);

export default Card; 