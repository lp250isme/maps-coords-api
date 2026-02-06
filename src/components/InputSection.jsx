import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react'; // Import motion
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function InputSection({ url, setUrl, onAutoPaste, loading, success, onConvert }) {
  const { lang } = useStore();
  const t = I18N[lang];
  const inputRef = useRef(null);

  const handleWrapperClick = async () => {
      inputRef.current?.focus();
      
      if (!url && navigator.clipboard) {
          try {
              const text = await navigator.clipboard.readText();
              if (text) {
                  setUrl(text);
                  if (onAutoPaste) {
                      onAutoPaste(text);
                      inputRef.current?.blur();
                  }
              }
          } catch (err) {
              console.log('Clipboard access denied or empty');
          }
      }
  };

  const handlePaste = (e) => {
      const text = e.clipboardData.getData('text');
      if (text && onAutoPaste) {
          onAutoPaste(text);
          inputRef.current?.blur();
      }
  };

  const handleKeyDown = (e) => {
      if(e.key === 'Enter') {
          onConvert();
          inputRef.current?.blur();
      }
  };

  const handleClear = (e) => {
      e.stopPropagation();
      setUrl('');
      inputRef.current?.focus();
  };

  return (
    <div 
        className="w-full flex items-center bg-surface-input backdrop-blur-md shadow-sm border border-ios-border/50 rounded-full px-1.5 py-1.5 transition-all duration-300 cursor-text focus-within:ring-2 focus-within:ring-ios-blue/30 focus-within:bg-surface-card h-[54px]"
        onClick={handleWrapperClick}
    >
        {/* Left Icon */}
        <div className="pl-3.5 pr-2 text-text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
        </div>

        {/* Input */}
        <input 
            ref={inputRef}
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            spellCheck="false"
            autoComplete="off"
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-text-primary placeholder:text-text-secondary/60 h-full font-medium min-w-0"
        />

        {/* Clear Button */}
        <AnimatePresence>
            {url && (
                <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={handleClear}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-black/5 active:bg-black/10 transition-colors mr-1 shrink-0"
                    tabIndex={0}
                >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                     </svg>
                </motion.button>
            )}
        </AnimatePresence>

        {/* Right Button (Embedded) */}
        <motion.button 
            className={`
                ml-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden
                ${(url.trim() && (
                    // Valid if it matches coordinates OR is a valid-looking URL (contains http/https/www)
                    /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/.test(url.trim()) || 
                    /^(https?:\/\/|www\.|goo\.gl|maps\.)/i.test(url.trim())
                )) ? 'bg-ios-blue text-white shadow-md cursor-pointer' : 'bg-ios-gray/30 text-text-secondary cursor-default'}
                ${success ? '!bg-naver-green !text-white' : ''}
            `}
            onClick={(e) => {
                e.stopPropagation();
                const isValid = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/.test(url.trim()) || /^(https?:\/\/|www\.|goo\.gl|maps\.)/i.test(url.trim());
                if (url.trim() && isValid && !loading && !success) {
                    onConvert();
                    inputRef.current?.blur();
                }
            }}
            disabled={
                !url.trim() || 
                !(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/.test(url.trim()) || /^(https?:\/\/|www\.|goo\.gl|maps\.)/i.test(url.trim())) ||
                loading || success
            }
            whileHover={(url.trim() && (/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/.test(url.trim()) || /^(https?:\/\/|www\.|goo\.gl|maps\.)/i.test(url.trim())) && !loading && !success) ? { scale: 1.05 } : {}}
            whileTap={(url.trim() && (/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/.test(url.trim()) || /^(https?:\/\/|www\.|goo\.gl|maps\.)/i.test(url.trim())) && !loading && !success) ? { scale: 0.95 } : {}}
            animate={{ 
                backgroundColor: success ? '#00C73C' : (url.trim() && (/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/.test(url.trim()) || /^(https?:\/\/|www\.|goo\.gl|maps\.)/i.test(url.trim()))) ? '#007AFF' : 'rgba(142, 142, 147, 0.3)',
                scale: success ? 1.05 : 1
            }}
            layout
        >
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    />
                ) : success ? (
                    <motion.svg 
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </motion.svg>
                ) : (
                    <motion.svg 
                        key="arrow"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </motion.svg>
                )}
            </AnimatePresence>
        </motion.button>
    </div>
  );
}
