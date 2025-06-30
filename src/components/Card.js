import React from 'react';

const Card = ({ children, className = "", onClick }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 ${className}`}
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid #DFE1E6'
      }}
    >
      {children}
    </div>
  );
};

export default Card;
