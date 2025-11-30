import React from 'react';

interface CalculatorButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isPressed?: boolean;
}

export const CalculatorButton: React.FC<CalculatorButtonProps> = ({ onClick, children, className = 'bg-gray-600 hover:bg-gray-500', disabled = false, isPressed = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-14 font-bold text-white text-2xl rounded-lg shadow-md transition-transform transform active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 flex items-center justify-center ${className} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${isPressed ? 'animate-press' : ''}`}
    >
      {children}
    </button>
  );
};
