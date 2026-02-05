import React from 'react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function Header() {
  const { lang, theme } = useStore();
  
  return (
    <>
      {theme === 'dark' ? (
        <picture>
             <img src="/icon-dark.png" alt="Icon" className="w-16 h-16 rounded-[14px] mb-4 shadow-ios mx-auto transition-transform duration-300 hover:scale-105" />
        </picture>
      ) : (
        <picture>
             <img src="/icon.png" alt="Icon" className="w-16 h-16 rounded-[14px] mb-4 shadow-ios mx-auto transition-transform duration-300 hover:scale-105" />
        </picture>
      )}
      
      <h1 className="text-2xl font-semibold mb-4 tracking-tight mt-0 text-text-primary">GTC</h1>
    </>
  );
}
