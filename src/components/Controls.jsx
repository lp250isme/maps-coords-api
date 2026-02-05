import React from 'react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function Controls({ onInfoClick }) {
  const { theme, toggleTheme, lang, toggleLang } = useStore();
  const t = I18N[lang];
    
  return (
    <>
      <button 
        className="fixed top-6 left-6 bg-surface-button backdrop-blur-xl shadow-ios border-[0.5px] border-ios-border rounded-full w-10 h-10 text-lg flex items-center justify-center cursor-pointer transition-all duration-300 z-50 hover:bg-surface-button-hover text-text-primary active:scale-90"
        onClick={toggleTheme}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <button 
        className="fixed top-6 left-[72px] bg-surface-button backdrop-blur-xl shadow-ios border-[0.5px] border-ios-border rounded-full w-10 h-10 text-lg flex items-center justify-center cursor-pointer transition-all duration-300 z-50 hover:bg-surface-button-hover text-text-primary active:scale-90"
        onClick={onInfoClick}
      >
        ℹ️
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
