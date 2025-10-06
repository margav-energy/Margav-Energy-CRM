import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Margav Energy Logo */}
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <div className="relative w-full h-full">
          {/* Green abstract icon */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-lg transform rotate-12 shadow-lg">
            <div className="absolute inset-2 bg-white rounded-md"></div>
          </div>
        </div>
      </div>
      
      {/* Text */}
      <div className="ml-3">
        <div className="text-lg font-bold">
          <span className="text-green-600">Margav</span>
          <span className="text-blue-600">Energy</span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
