import React, { useRef } from 'react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function InputSection({ url, setUrl }) {
  const { lang } = useStore();
  const t = I18N[lang];
  const inputRef = useRef(null);
  
  const handleClear = (e) => {
      e.stopPropagation();
      setUrl('');
      inputRef.current?.focus();
  };

  const handleWrapperClick = async () => {
      inputRef.current?.focus();
      
      if (!url && navigator.clipboard) {
          try {
              const text = await navigator.clipboard.readText();
              if (text) setUrl(text);
          } catch (err) {
              console.log('Clipboard access denied or empty');
          }
      }
  };

  return (
    <div 
        className="flex-1 flex items-center bg-surface-input backdrop-blur-md shadow-sm rounded-2xl px-4 transition-all duration-200 w-full min-w-0 overflow-hidden cursor-text focus-within:bg-surface-input-focus active:scale-[0.99] focus-within:active:scale-100"
        onClick={handleWrapperClick}
    >
        <svg className="w-5 h-5 text-text-secondary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        
        <input 
            ref={inputRef}
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
                if(e.key === 'Enter') {
                    // Trigger convert from parent button check if needed, 
                    // but usually best to have a form submit or ref to button click
                    document.getElementById('convertBtn')?.click();
                }
            }}
            placeholder={t.placeholder}
            spellCheck="false"
            autoComplete="off"
            className="flex-1 px-3 text-base border-none bg-transparent text-text-primary outline-none w-full min-w-0 h-full placeholder:text-text-secondary"
        />
        
        <button 
            className={`
                bg-surface-button border-none rounded-full w-5 h-5 text-xs flex items-center justify-center text-text-primary cursor-pointer flex-shrink-0 p-0 transition-all duration-200 hover:bg-surface-button-hover
                ${url.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
            onClick={handleClear}
            type="button"
            tabIndex={url.length > 0 ? 0 : -1}
        >
            &times;
        </button>
    </div>
  );
}
