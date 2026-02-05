import React from 'react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function Controls({ onInfoClick }) {
  const { theme, toggleTheme, lang, toggleLang } = useStore();
  const t = I18N[lang];
    
  return (
    <>
      <button 
        className="fixed top-6 left-6 bg-surface-button backdrop-blur-xl shadow-ios border-[0.5px] border-ios-border rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300 z-50 hover:bg-surface-button-hover text-text-primary active:scale-90"
        onClick={toggleTheme}
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>

      <button 
        className="fixed top-6 left-[72px] bg-surface-button backdrop-blur-xl shadow-ios border-[0.5px] border-ios-border rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300 z-50 hover:bg-surface-button-hover text-text-primary active:scale-90"
        onClick={onInfoClick}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </button>

      <button 
        className="fixed top-6 right-6 bg-surface-button backdrop-blur-xl shadow-ios border-[0.5px] border-ios-border rounded-full px-4 h-10 text-sm font-semibold text-text-secondary cursor-pointer transition-all duration-300 z-50 hover:bg-surface-button-hover hover:text-text-primary active:scale-95 flex items-center"
        onClick={toggleLang}
      >
        {t.toggleBtn}
      </button>
    </>
  );
}
