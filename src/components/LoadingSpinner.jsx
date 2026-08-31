import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <div className="w-16 h-16 border-4 border-t-4 rounded-full border-gray-700 border-t-cyan-400 animate-spin"></div>
    </div>
  );
}



