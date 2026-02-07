import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { I18N } from '../i18n';
import FavoriteNameModal from './FavoriteNameModal';

export default function FavoritesPage({ onSelect }) {
  const { 
    lang, favorites, user, settings, isAuthLoading,
    login, addFavorite, removeFavorite, 
    folders = [], addFolder, removeFolder, moveToFolder, renameFolder 
  } = useStore();
  
  const t = I18N[lang];
  const [searchTerm, setSearchTerm] = useState('');
  
  // Persist selected folder locally
  const [selectedFolder, setSelectedFolder] = useState(() => {
    return localStorage.getItem('gtc_last_folder') || null;
  });

  useEffect(() => {
    if (selectedFolder === null) {
      localStorage.removeItem('gtc_last_folder');
    } else {
      localStorage.setItem('gtc_last_folder', selectedFolder);
    }
  }, [selectedFolder]);

  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Delete confirm state
  const [folderToDelete, setFolderToDelete] = useState(null);
  
  // Rename folder state
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');

  // Lock body scroll when folder dropdown is open
  useEffect(() => {
    if (showFolderDropdown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFolderDropdown]);

  // Calculate folder counts
  const folderCounts = {
    all: favorites.length,
    uncategorized: favorites.filter(f => !f.folder).length,
    ...folders.reduce((acc, folder) => {
      acc[folder] = favorites.filter(f => f.folder === folder).length;
      return acc;
    }, {})
  };

  // Filter favorites
  const filteredFavorites = favorites.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (item.customName || '').toLowerCase().includes(searchLower) ||
                         (item.placeName || '').toLowerCase().includes(searchLower) ||
                         (item.coords || '').toLowerCase().includes(searchLower);
    
    if (selectedFolder === 'uncategorized') {
      return matchesSearch && !item.folder;
    } else if (selectedFolder) {
      return matchesSearch && item.folder === selectedFolder;
    }
    return matchesSearch;
  });

  const handleAddFolder = () => {
    const trimmed = newFolderName.trim();
    if (trimmed && !folders.includes(trimmed)) {
      addFolder(trimmed);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const confirmDeleteFolder = (folderName) => {
    setFolderToDelete(folderName);
  };

  const performDeleteFolder = () => {
    if (folderToDelete) {
      removeFolder(folderToDelete);
      if (selectedFolder === folderToDelete) {
        setSelectedFolder(null);
      }
      setFolderToDelete(null);
    }
  };

  const handleEditFavorite = (item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (newName, folder) => {
    if (editingItem) {
      // If folder is new, add it first
      if (folder && !folders.includes(folder)) {
        addFolder(folder);
      }
      addFavorite(editingItem, newName, folder);
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleMoveToFolder = (coords, targetFolder) => {
    moveToFolder(coords, targetFolder);
    setShowMoveDropdown(null);
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-ios-gray/20 border-t-ios-blue"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-text-secondary text-base gap-4 px-6 text-center">
        <div className="w-16 h-16 bg-ios-gray/10 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-text-primary">{t.loginRequired || 'Login Required'}</p>
        <p className="text-sm">{t.loginToViewFavorites || 'Sign in with Google to access your favorites'}</p>
        <button
          onClick={login}
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-ios-blue text-white rounded-full font-medium shadow-ios-blue hover:bg-ios-blue/90 transition-colors active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {t.login || 'Sign in with Google'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4 z-30">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-9 pr-8 py-3 border-none rounded-xl bg-[var(--input-bg)] text-text-primary placeholder:text-text-secondary focus:ring-0 text-[15px] outline-none"
          placeholder={t.search || 'Search'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary"
            onClick={() => setSearchTerm('')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Folder Filter & Search */}
      <div className="mb-1.5 relative z-40">
        <button
          onClick={() => setShowFolderDropdown(!showFolderDropdown)}
          className="w-full flex items-center justify-between px-4 py-3 bg-surface-button rounded-xl text-sm text-text-primary hover:bg-surface-button-hover transition-colors mb-3"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {selectedFolder === 'uncategorized' ? (t.uncategorized || 'Uncategorized') : 
             selectedFolder ? selectedFolder : (t.allFavorites || 'All Favorites')}
            <span className="text-text-secondary text-xs ml-1">
              ({selectedFolder === 'uncategorized' ? folderCounts.uncategorized :
                selectedFolder ? folderCounts[selectedFolder] || 0 : folderCounts.all})
            </span>
          </span>
          <svg className={`w-4 h-4 text-text-secondary transition-transform duration-300 ${showFolderDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Backdrop for Folder Dropdown */}
        {showFolderDropdown && (
          <div 
             className="fixed inset-0 z-40"
             onClick={() => setShowFolderDropdown(false)}
          />
        )}

        <AnimatePresence>
          {showFolderDropdown && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: -10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: -10 }}
               transition={{ duration: 0.15, ease: "easeOut" }}
               className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-ios-border rounded-xl shadow-lg z-50 overflow-hidden backdrop-blur-3xl origin-top"
            >
              {/* Add New Folder - Now at top */}
              <div className="border-b border-ios-border">
                {showNewFolderInput ? (
                  <div className="flex items-center gap-2 p-3">
                    <input
                      type="text"
                      autoFocus
                      className="flex-1 px-3 py-2 bg-[var(--input-bg)] rounded-lg text-sm text-text-primary outline-none"
                      placeholder={t.createFolderPlaceholder || 'Folder name'}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                    />
                    <button
                      onClick={handleAddFolder}
                      className="px-3 py-2 bg-ios-blue text-white rounded-lg text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }}
                      className="px-3 py-2 text-text-secondary"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewFolderInput(true)}
                    className="w-full text-left px-4 py-3 text-sm text-ios-blue font-medium hover:bg-surface-button transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {t.newFolder || 'New Folder'}
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {/* All Favorites */}
                <button
                  onClick={() => { setSelectedFolder(null); setShowFolderDropdown(false); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-surface-button transition-colors ${!selectedFolder ? 'text-ios-blue font-medium' : 'text-text-primary'}`}
                >
                  {t.allFavorites || 'All Favorites'} ({folderCounts.all})
                </button>
                
                {/* Uncategorized */}
                <button
                  onClick={() => { setSelectedFolder('uncategorized'); setShowFolderDropdown(false); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-surface-button transition-colors ${selectedFolder === 'uncategorized' ? 'text-ios-blue font-medium' : 'text-text-primary'}`}
                >
                  {t.uncategorized || 'Uncategorized'} ({folderCounts.uncategorized})
                </button>
                
                {/* User Folders with Rename */}
                {folders.map(folder => (
                  <div key={folder} className="flex items-center justify-between hover:bg-surface-button transition-colors">
                    {renamingFolder === folder ? (
                      <div className="flex-1 flex items-center gap-2 px-3 py-2">
                        <input
                          type="text"
                          autoFocus
                          className="flex-1 px-2 py-1 bg-[var(--input-bg)] rounded text-sm text-text-primary outline-none"
                          value={renameFolderValue}
                          onChange={(e) => setRenameFolderValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && renameFolderValue.trim()) {
                              const newName = renameFolderValue.trim();
                              renameFolder(folder, newName);
                              setRenamingFolder(null);
                              setSelectedFolder(newName);
                              setShowFolderDropdown(false);
                            }
                            if (e.key === 'Escape') setRenamingFolder(null);
                          }}
                        />
                        <button
                          onClick={() => {
                            if (renameFolderValue.trim()) {
                              const newName = renameFolderValue.trim();
                              renameFolder(folder, newName);
                              setRenamingFolder(null);
                              setSelectedFolder(newName);
                              setShowFolderDropdown(false);
                            }
                          }}
                          className="p-1 text-ios-blue"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => { setSelectedFolder(folder); setShowFolderDropdown(false); }}
                          className={`flex-1 text-left px-4 py-3 text-sm ${selectedFolder === folder ? 'text-ios-blue font-medium' : 'text-text-primary'}`}
                        >
                          {folder} ({folderCounts[folder] || 0})
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenamingFolder(folder); setRenameFolderValue(folder); }}
                          className="px-2 py-3 text-text-secondary hover:text-ios-blue transition-colors"
                          title={t.rename || 'Rename'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); confirmDeleteFolder(folder); }}
                          className="px-2 py-3 text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>



      {/* Favorites List - Scrollable Container */}
      {/* List */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-28">
        {filteredFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-text-secondary text-sm">
            {searchTerm ? (t.noSearchResults || 'No results found') : (t.noFavorites || 'No favorites yet')}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
          {filteredFavorites.map((item, idx) => (
            <motion.div
              key={item.coords + idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-surface-card rounded-2xl p-4 border border-ios-border cursor-pointer hover:bg-surface-button-hover transition-colors active:scale-[0.98] relative text-left"
              onClick={() => onSelect(item)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text-primary truncate text-left">
                    {item.customName || item.placeName}
                  </h3>
                  
                  {settings.showCoords && (
                    <p className="text-xs text-text-secondary mt-1 truncate text-left">
                      {item.coords}
                    </p>
                  )}
                  
                  {/* Removed folder tag as requested */}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-0.5">
                  {/* Apple Maps */}
                  {settings.showAppleMap && (
                    <a
                      href={`http://maps.apple.com/?q=${item.lat},${item.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                      title={t.openInApple || 'Open in Apple Maps'}
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple" className="w-4 h-4 object-contain opacity-60 hover:opacity-100 transition-opacity dark:invert-0 invert" />
                    </a>
                  )}
                  
                  {/* Naver Maps */}
                  {settings.showNaverMap && (
                    <a
                      href={`nmap://place?lat=${item.lat}&lng=${item.lon}&name=${encodeURIComponent(item.customName || item.placeName || 'Location')}&appname=https%3A%2F%2Fcomap.app/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                      title={t.openInNaver || 'Open in Naver'}
                    >
                      <img src="https://cdn.brandfetch.io/idy7-U4_1-/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1749526893278" alt="Naver" className="w-4 h-4 object-contain rounded-sm opacity-60 hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  
                  {/* Edit */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditFavorite(item); }}
                    className="p-2 text-text-secondary hover:text-ios-blue transition-colors"
                    title={t.edit || 'Edit'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  {/* Remove */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFavorite(item.coords); }}
                    className="p-2 text-[#FFC107] hover:text-[#FFA000] transition-colors"
                    title={t.removeFavorite || 'Remove from favorites'}
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>
      
      {/* Edit Modal */}
      <FavoriteNameModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleSaveEdit}
        initialName={editingItem?.customName || editingItem?.placeName}
        initialFolder={editingItem?.folder}
        folders={folders}
        t={t}
      />
      
      {/* Delete Folder Warning Modal */}
      <AnimatePresence>
        {folderToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setFolderToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-surface-card rounded-2xl shadow-xl overflow-hidden border border-ios-border p-5 text-center"
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {t.deleteFolderTitle || 'Delete Folder'}
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                {t.deleteFolderConfirm || 'Delete this folder? Items will be moved to Uncategorized.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setFolderToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-surface-button text-text-primary rounded-xl font-medium hover:bg-surface-button-hover transition-colors"
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  onClick={performDeleteFolder}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  {t.delete || 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
