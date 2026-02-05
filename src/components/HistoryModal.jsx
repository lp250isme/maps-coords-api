import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function HistoryModal({ isOpen, onClose, onSelect, initialTab = 'history' }) {
  const { lang, history, favorites, clearHistory, toggleFavorite } = useStore();
  const t = I18N[lang];
  const [activeTab, setActiveTab] = useState('history');

  // Sync active tab when initialTab changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  return (
    <AnimatePresence>
    {isOpen && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 w-full h-full z-[200] flex justify-center items-center p-5 bg-black/40 backdrop-blur-[4px]"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="bg-ios-card backdrop-blur-2xl rounded-[26px] border border-ios-border w-full max-w-[400px] h-[600px] max-h-[85vh] flex flex-col relative shadow-ios-lg"
            >
                {/* Header / Tabs */}
                <div className="p-4 border-b border-ios-border/50 flex flex-col gap-4">
                    <div className="flex justify-between items-center px-1 relative">
                        {activeTab === 'history' && history.length > 0 && (
                            <button 
                                onClick={clearHistory}
                                className="text-ios-blue text-sm font-medium absolute left-0 active:opacity-60 transition-opacity"
                            >
                                {t.clear}
                            </button>
                        )}
                        
                        <h2 className="text-lg font-semibold text-text-primary text-center w-full">{activeTab === 'history' ? t.history : t.favorites}</h2>
                        
                        <button 
                            className="bg-ios-gray/10 border-none rounded-full w-7 h-7 flex items-center justify-center text-text-secondary cursor-pointer hover:bg-ios-gray/20 hover:text-text-primary transition-colors absolute right-0"
                            onClick={onClose}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Segmented Control */}
                    <div className="bg-ios-gray/20 p-1 rounded-[10px] flex h-9 relative">
                        <button 
                            className={`
                                flex-1 rounded-[8px] text-[13px] font-medium transition-all duration-200 z-10
                                ${activeTab === 'history' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}
                            `}
                            onClick={() => setActiveTab('history')}
                        >
                            {t.history}
                        </button>
                        <button 
                            className={`
                                flex-1 rounded-[8px] text-[13px] font-medium transition-all duration-200 z-10
                                ${activeTab === 'favorites' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}
                            `}
                            onClick={() => setActiveTab('favorites')}
                        >
                            {t.favorites}
                        </button>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                    {/* ... (Kept as is, lists render simply) */}
                    {activeTab === 'history' && (
                        <>
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] text-text-secondary text-sm">
                                    {t.noHistory}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {history.map((item, idx) => (
                                        <ListItem 
                                            key={idx} 
                                            item={item} 
                                            onClick={() => { onSelect(item); onClose(); }} 
                                            isFav={favorites.some(f => f.coords === item.coords)}
                                            onToggleFav={() => toggleFavorite(item)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'favorites' && (
                        <>
                            {favorites.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] text-text-secondary text-sm">
                                    {t.noFavorites}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {favorites.map((item, idx) => (
                                        <ListItem 
                                            key={idx} 
                                            item={item} 
                                            onClick={() => { onSelect(item); onClose(); }} 
                                            isFav={true}
                                            onToggleFav={() => toggleFavorite(item)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )}
    </AnimatePresence>
  );
}

function ListItem({ item, onClick, isFav, onToggleFav }) {
    return (
        <div className="flex items-center bg-surface-button/50 hover:bg-surface-button transition-colors rounded-xl p-3 pr-2 group">
            <div className="flex-1 cursor-pointer min-w-0 text-left" onClick={onClick}>
                <div className="text-text-primary font-medium text-sm truncate pr-2">{item.placeName}</div>
                <div className="text-text-secondary text-xs truncate mt-0.5 font-mono opacity-80">{item.coords}</div>
            </div>
            
            <button 
                className="w-10 h-10 flex items-center justify-center focus:outline-none active:scale-90 transition-transform group-hover:scale-110"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFav();
                }}
            >
                <svg 
                    className={`w-6 h-6 transition-colors duration-200 ${isFav ? 'text-[#FFC107]' : 'text-text-secondary hover:text-text-primary'}`}
                    fill={isFav ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            </button>
        </div>
    );
}
