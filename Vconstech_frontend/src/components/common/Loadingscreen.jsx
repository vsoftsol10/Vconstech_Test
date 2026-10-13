import React from 'react';
import image from '../../assets/logo.jpg';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">

      <div className="relative z-10 flex flex-col items-center gap-4" style={{ animation: 'fadeUp 0.5s ease forwards' }}>

        {/* Flipping logo */}
        <div
          className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm"
          style={{ animation: 'flip 2s ease-in-out infinite' }}
        >
          <img src={image} alt="Logo" className="w-full h-full object-contain" />
        </div>

        {/* Message + bar */}
        <div className="flex flex-col items-center gap-3">
          <p
            className="text-xs tracking-[0.2em] uppercase text-gray-400 font-medium text-center"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {message}
          </p>

          {/* Amber sweep bar */}
          <div className="w-28 h-[3px] bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full w-10 rounded-full bg-amber-400"
              style={{ animation: 'sweep 1.5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flip {
          0%, 100% { transform: rotateY(0deg); }
          45%       { transform: rotateY(180deg); }
          55%       { transform: rotateY(180deg); }
        }
        @keyframes sweep {
          0%   { transform: translateX(-150%); }
          60%  { transform: translateX(350%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;