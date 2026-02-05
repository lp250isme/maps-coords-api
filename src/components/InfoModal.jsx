import React from 'react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function InfoModal({ isOpen, onClose }) {
  const { lang } = useStore();
  const t = I18N[lang];

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-[8px] z-[200] flex justify-center items-center p-5"
        onClick={(e) => {
            // Close on backdrop click
            if (e.target === e.currentTarget) onClose();
        }}
    >
        <div className="bg-glass-bg backdrop-blur-[20px] rounded-[20px] border border-glass-border w-full max-w-[400px] max-h-[80vh] overflow-y-auto p-6 text-left relative">
            <button 
                className="absolute top-4 right-4 bg-[rgba(120,120,128,0.2)] border-none rounded-full w-7 h-7 text-lg flex items-center justify-center text-text-secondary cursor-pointer transition-colors duration-200 hover:bg-[rgba(120,120,128,0.4)] hover:text-text-primary"
                onClick={onClose}
            >
                &times;
            </button>
            
            <div className="text-xl font-semibold mb-4 text-text-primary">{t.infoTitle}</div>
            
            <div 
                className="text-sm leading-relaxed text-text-secondary [&_p]:mb-3 [&_strong]:text-text-primary"
                dangerouslySetInnerHTML={{ __html: t.infoBody }}
            />
        </div>
    </div>
  );
}
