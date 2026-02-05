import React from 'react';

export default function ConvertButton({ onClick, loading, success, disabled }) {
  return (
    <button 
        id="convertBtn"
        className={`
            w-[52px] h-full p-0 text-xl font-semibold text-white bg-primary-blue border-none rounded-2xl 
            cursor-pointer flex flex-shrink-0 items-center justify-center shadow-[0_4px_12px_rgba(0,122,255,0.3)]
            transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
            disabled:bg-text-secondary disabled:opacity-50 disabled:cursor-not-allowed
            ${success ? 'bg-naver-green shadow-[0_4px_12px_rgba(3,199,90,0.3)] scale-105' : ''}
        `}
        onClick={onClick}
        disabled={disabled}
    >
        {loading ? (
            <div className="w-5 h-5 border-[2.5px] border-[rgba(255,255,255,0.3)] rounded-full border-t-white animate-spin-fast"></div>
        ) : success ? (
            <svg className="w-6 h-6 stroke-[2.5] transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        ) : (
            <svg className="w-6 h-6 stroke-[2.5] transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
        )}
    </button>
  );
}
