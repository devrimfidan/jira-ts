import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "medium", 
  disabled = false,
  className = "" 
}) => {
  const baseClasses = "font-medium rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "text-white focus:ring-purple-500",
    secondary: "text-white focus:ring-gray-500",
    danger: "text-white focus:ring-red-500",
    outline: "text-white bg-transparent hover:bg-white hover:bg-opacity-10 focus:ring-purple-500"
  };
  
  // Set default colors for primary if not overridden by className
  const primaryStyles = variant === "primary" && !className.includes('bg-') 
    ? { backgroundColor: '#0052CC', ':hover': { backgroundColor: '#0047B3' } }
    : {};
  
  // Set default colors for outline
  const outlineStyles = variant === "outline" 
    ? { 
        border: '1px solid #DFE1E6', 
        color: '#172B4D',
        backgroundColor: 'transparent'
      }
    : {};
  
  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base"
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...primaryStyles,
        ...outlineStyles
      }}
    >
      {children}
    </button>
  );
};

export default Button;
