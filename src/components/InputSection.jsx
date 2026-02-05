import React, { useRef } from 'react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function InputSection({ url, setUrl }) {
  const { lang } = useStore();
  const t = I18N[lang];
  const inputRef = useRef(null);
  
  const handleClear = () => {
      setUrl('');
      inputRef.current?.focus();
  };

  return (
    <div className="flex-1 flex items-center bg-[rgba(120,120,128,0.08)] rounded-2xl px-4 transition-all duration-200 w-full min-w-0 focus-within:bg-[rgba(120,120,128,0.12)] focus-within:scale-[1.01]">
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
        
        {url.length > 0 && (
            <button 
                className="bg-[rgba(120,120,128,0.3)] border-none rounded-full w-5 h-5 text-xs flex items-center justify-center text-text-primary cursor-pointer flex-shrink-0 p-0 transition-all duration-200 hover:bg-[rgba(120,120,128,0.5)]"
                onClick={handleClear}
                type="button"
            >
                &times;
            </button>
        )}
    </div>
  );
}
