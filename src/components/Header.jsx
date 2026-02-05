import React from 'react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function Header() {
  const { lang, theme } = useStore();
  
  return (
    <>
      {theme === 'dark' ? (
        <picture>
             <img src="/icon-dark.png" alt="Icon" className="w-16 h-16 rounded-2xl mb-4 shadow-lg mx-auto" />
        </picture>
      ) : (
        <picture>
             <img src="/icon.png" alt="Icon" className="w-16 h-16 rounded-2xl mb-4 shadow-lg mx-auto" />
        </picture>
      )}
      
      <h1 className="text-2xl font-semibold mb-4 tracking-tighter mt-0 text-text-primary">GTC</h1>
    </>
  );
}
