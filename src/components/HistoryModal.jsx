import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { I18N } from '../i18n';

import FavoriteNameModal from './FavoriteNameModal';

export default function HistoryModal({ isOpen, onClose, onSelect, initialTab = 'history' }) {
  const { lang, history, favorites, clearHistory, toggleFavorite, addFavorite, user } = useStore();
  const t = I18N[lang];
  const [activeTab, setActiveTab] = useState('history');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFavorites = favorites.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const customNameStart = (item.customName || '').toLowerCase();
      const placeNameStart = (item.placeName || '').toLowerCase();
      const coordsStart = (item.coords || '').toLowerCase();
      
      return customNameStart.includes(searchLower) || 
             placeNameStart.includes(searchLower) || 
             coordsStart.includes(searchLower);
  });

  const filteredHistory = history.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const placeNameMatch = (item.placeName || '').toLowerCase().includes(searchLower);
      const coordsMatch = (item.coords || '').toLowerCase().includes(searchLower);
      return placeNameMatch || coordsMatch;
  });

  // Sync active tab when initialTab changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleEditFavorite = (item) => {
      setEditingItem(item);
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = (newName) => {
      if (editingItem) {
          addFavorite(editingItem, newName);
          setIsEditModalOpen(false);
          setEditingItem(null);
      }
  };

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
            <FavoriteNameModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveEdit}
                initialName={editingItem?.customName || editingItem?.placeName}
                t={t}
            />
            
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

                    {/* Segmented Control - Favorites first */}
                    <div className="bg-ios-gray/20 p-1 rounded-[10px] flex h-9 relative">
                        <button 
                            className={`
                                flex-1 rounded-[8px] text-[13px] font-medium transition-all duration-200 z-10
                                ${activeTab === 'favorites' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}
                            `}
                            onClick={() => setActiveTab('favorites')}
                        >
                            {t.favorites}
                        </button>
                        <button 
                            className={`
                                flex-1 rounded-[8px] text-[13px] font-medium transition-all duration-200 z-10
                                ${activeTab === 'history' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}
                            `}
                            onClick={() => setActiveTab('history')}
                        >
                            {t.history}
                        </button>
                    </div>
                </div>

                {/* Search Bar - Always visible */}
                <div className="px-4 py-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-[var(--ios-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-9 pr-8 py-0 border-none rounded-[10px] bg-[var(--input-bg)] text-[var(--ios-text-primary)] placeholder:text-[var(--ios-text-secondary)] focus:ring-0 transition-all text-[15px] h-[36px] outline-none leading-normal"
                            placeholder={t.search}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="absolute inset-y-0 right-0 pr-2 flex items-center text-[var(--ios-text-secondary)] active:opacity-60"
                                onClick={() => setSearchTerm('')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>



                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                    {/* History List */}
                    {activeTab === 'history' && (
                        <>
                            {filteredHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] text-text-secondary text-sm">
                                    {searchTerm ? t.noSearchResults || 'No results found' : t.noHistory}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {filteredHistory.map((item, idx) => (
                                        <ListItem 
                                            key={idx} 
                                            item={item} 
                                            onClick={() => { onSelect(item); onClose(); }} 
                                            isFav={favorites.some(f => f.coords === item.coords)}
                                            onToggleFav={() => {
                                                if (!user) {
                                                    if (confirm(t.loginToFavorite)) {
                                                        const { login } = useStore.getState();
                                                        login();
                                                    }
                                                    return;
                                                }
                                                toggleFavorite(item);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Favorites List */}
                    {activeTab === 'favorites' && (
                        <>
                            {!user ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-text-secondary text-base gap-4 px-6 text-center">
                                    <div className="w-16 h-16 bg-ios-gray/10 rounded-full flex items-center justify-center mb-2">
                                        <svg className="w-8 h-8 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    </div>
                                    <p>{t.loginRequired || "Please login to access your favorites."}</p>
                                    <button 
                                        onClick={() => {
                                             const { login } = useStore.getState();
                                             login();
                                        }}
                                        className="bg-ios-blue text-white px-6 py-2.5 rounded-full font-medium shadow-ios-blue hover:bg-blue-600 active:scale-95 transition-all"
                                    >
                                        {t.login}
                                    </button>
                                </div>
                            ) : filteredFavorites.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] text-text-secondary text-sm">
                                    {searchTerm ? t.noResults : t.noFavorites}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {filteredFavorites.map((item, idx) => (
                                        <ListItem 
                                            key={idx} 
                                            item={item} 
                                            name={item.customName || item.placeName}
                                            onClick={() => { onSelect(item); onClose(); }} 
                                            isFav={true}
                                            onToggleFav={() => toggleFavorite(item)}
                                            onEdit={() => handleEditFavorite(item)}
                                        />
                                    ))}
                                </div>
                            )}

                             {/* Sync Status Footer - Only Show if User is Logged In (since Guest can't see list) */}
                             {user && (
                             <div className="mt-4 pt-3 border-t border-ios-border/50 flex justify-between items-center text-xs text-text-secondary px-1">
                                <span className="text-green-500">
                                    {`✓ ${t.synced} (${(user.customName || user.displayName).split(' ')[0]})`}
                                </span>
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

function ListItem({ item, name, onClick, isFav, onToggleFav, onEdit }) {
    const displayName = name || item.placeName;
    
    return (
        <div className="flex items-center bg-surface-button/50 hover:bg-surface-button transition-colors rounded-xl p-3 pr-2 group">
            <div className="flex-1 cursor-pointer min-w-0 text-left" onClick={onClick}>
                <div className="text-text-primary font-medium text-sm truncate pr-2">{displayName}</div>
                <div className="text-text-secondary text-xs truncate mt-0.5 font-mono opacity-80">{item.coords}</div>
            </div>
            
            <div className="flex items-center gap-1">
                {onEdit && (
                    <button 
                        className="w-8 h-8 flex items-center justify-center focus:outline-none text-text-secondary hover:text-text-primary transition-colors active:scale-95"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                )}
                
                <button 
                    className="w-10 h-10 flex items-center justify-center focus:outline-none active:scale-90 transition-transform group-hover:scale-110"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFav();
                    }}
                >
                    <svg 
                        className={`w-6 h-6 transition-colors duration-200 ${isFav ? 'text-[#FFC107] fill-[#FFC107]' : 'text-gray-400 dark:text-gray-300 hover:text-text-secondary'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
