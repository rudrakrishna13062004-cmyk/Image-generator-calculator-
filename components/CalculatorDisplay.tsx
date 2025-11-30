
import React from 'react';

interface CalculatorDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const LoadingIndicator: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-green-300">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-300"></div>
    <p className="mt-4 text-lg font-orbitron tracking-widest animate-pulse">CALCULATING...</p>
  </div>
);

const WelcomeMessage: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-green-400 p-4">
        <p className="font-orbitron text-center">IMAGE GENERATOR</p>
        <p className="text-xs text-green-500/80 text-center mt-2">Enter a prompt below. Use number keys for quick styles.</p>
    </div>
);

export const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({ imageUrl, isLoading, error }) => {
  return (
    <div className="aspect-square w-full bg-green-900/50 border-2 border-black/20 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
      {isLoading ? (
        <LoadingIndicator />
      ) : error ? (
        // The display now shows only a generic error icon, as the specific message is shown below the input.
        <div className="flex flex-col items-center justify-center text-red-400 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 font-orbitron">ERROR</p>
        </div>
      ) : imageUrl ? (
        <img src={imageUrl} alt="Generated" className="w-full h-full object-cover" />
      ) : (
        <WelcomeMessage />
      )}
    </div>
  );
};
