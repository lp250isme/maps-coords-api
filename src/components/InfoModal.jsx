import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function InfoModal({ isOpen, onClose }) {
  const { lang } = useStore();
  const t = I18N[lang];

  return (
    <AnimatePresence>
    {isOpen && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 w-full h-full z-[200] flex justify-center items-center p-5 bg-black/60 backdrop-blur-[8px]"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-ios-card backdrop-blur-2xl rounded-[26px] border border-ios-border w-full max-w-[360px] max-h-[80vh] overflow-y-auto p-6 text-left relative shadow-ios-lg"
            >
                <button 
                    className="absolute top-4 right-4 bg-ios-gray/10 border-none rounded-full w-7 h-7 text-lg flex items-center justify-center text-text-secondary cursor-pointer transition-colors duration-200 hover:bg-ios-gray/20 hover:text-text-primary"
                    onClick={onClose}
                >
                    ✕
                </button>
                
                <div className="text-xl font-semibold mb-4 text-text-primary">{t.infoTitle}</div>
                
                <div 
                    className="text-sm leading-relaxed text-text-secondary [&_p]:mb-3 [&_strong]:text-text-primary"
                    dangerouslySetInnerHTML={{ __html: t.infoBody }}
                />
            </motion.div>
        </motion.div>
    )}
    </AnimatePresence>
  );
}
