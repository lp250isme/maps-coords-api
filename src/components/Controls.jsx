import React from 'react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function Controls({ onInfoClick }) {
  const { theme, toggleTheme, lang, toggleLang } = useStore();
  const t = I18N[lang];
    
  return (
    <>
      <button 
        className="fixed top-5 left-5 bg-surface-button border-none rounded-xl w-8 h-8 text-sm flex items-center justify-center p-0 cursor-pointer transition-all duration-200 z-50 hover:bg-surface-button-hover text-text-primary active:scale-90"
        onClick={toggleTheme}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <button 
        className="fixed top-5 left-[60px] bg-surface-button border-none rounded-xl w-8 h-8 text-sm flex items-center justify-center p-0 cursor-pointer transition-all duration-200 z-50 hover:bg-surface-button-hover text-text-primary active:scale-90"
        onClick={onInfoClick}
      >
        ℹ️
      </button>

      <button 
        className="fixed top-5 right-5 bg-surface-button border-none rounded-xl py-1.5 px-2.5 text-xs font-medium text-text-secondary cursor-pointer transition-all duration-200 z-50 hover:bg-surface-button-hover hover:text-text-primary active:scale-95"
        onClick={toggleLang}
      >
        {t.toggleBtn}
      </button>
    </>
  );
}
