import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function FavoriteNameModal({ isOpen, onClose, onSave, initialName, initialFolder, folders = [], t }) {
    const [name, setName] = useState(initialName || '');
    const [selectedFolder, setSelectedFolder] = useState(initialFolder || null);
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        setName(initialName || '');
        setSelectedFolder(initialFolder || null);
    }, [initialName, initialFolder, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
            setTimeout(() => inputRef.current.select(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // If creating new folder, use that instead
        const folderToUse = showNewFolderInput && newFolderName.trim() 
            ? newFolderName.trim() 
            : selectedFolder;
        onSave(name, folderToUse);
        setNewFolderName('');
        setShowNewFolderInput(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-[70] pointer-events-none"
                    >
                        <div className="bg-surface-card w-[90%] max-w-sm rounded-[24px] shadow-ios-lg p-6 pointer-events-auto border border-ios-border">
                            <h3 className="text-lg font-semibold text-text-primary mb-2 text-center">
                                {t.favModalTitle || 'Name this location'}
                            </h3>
                            <p className="text-sm text-text-secondary mb-6 text-center">
                                {t.favModalDesc || 'Choose a name for your favorite.'}
                            </p>
                            
                            <form onSubmit={handleSubmit}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-surface-button text-text-primary px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-ios-blue/50 mb-4 text-base"
                                    placeholder={t.favModalPlaceholder || 'Location Name'}
                                />
                                
                                {/* Folder Selector */}
                                {folders && folders.length > 0 && (
                                    <div className="relative mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-surface-button rounded-xl text-sm text-text-primary hover:bg-surface-button-hover transition-colors"
                                        >
                                            <span className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                </svg>
                                                {selectedFolder || t.selectFolder || 'Select Folder'}
                                            </span>
                                            <svg className={`w-4 h-4 text-text-secondary transition-transform ${showFolderDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        <AnimatePresence>
                                            {showFolderDropdown && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-full left-0 right-0 mt-1 bg-ios-card border border-ios-border rounded-xl shadow-lg z-10 overflow-hidden max-h-64 overflow-y-auto"
                                                >
                                                    {/* Uncategorized */}
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedFolder(null); setShowFolderDropdown(false); setShowNewFolderInput(false); }}
                                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-surface-button ${!selectedFolder ? 'text-ios-blue font-medium' : 'text-text-primary'}`}
                                                    >
                                                        {t.uncategorized || 'Uncategorized'}
                                                    </button>
                                                    
                                                    {/* Existing Folders */}
                                                    {folders.map(folder => (
                                                        <button
                                                            type="button"
                                                            key={folder}
                                                            onClick={() => { setSelectedFolder(folder); setShowFolderDropdown(false); setShowNewFolderInput(false); }}
                                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-surface-button ${selectedFolder === folder ? 'text-ios-blue font-medium' : 'text-text-primary'}`}
                                                        >
                                                            {folder}
                                                        </button>
                                                    ))}
                                                    
                                                    {/* New Folder Option */}
                                                    <div className="border-t border-ios-border">
                                                        {showNewFolderInput ? (
                                                            <div className="flex items-center gap-2 p-3">
                                                                <input
                                                                    type="text"
                                                                    autoFocus
                                                                    className="flex-1 px-3 py-2 bg-[var(--input-bg)] rounded-lg text-sm text-text-primary outline-none"
                                                                    placeholder={t.createFolderPlaceholder || 'Folder name'}
                                                                    value={newFolderName}
                                                                    onChange={(e) => setNewFolderName(e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (newFolderName.trim()) {
                                                                            setSelectedFolder(newFolderName.trim());
                                                                            setShowFolderDropdown(false);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-2 bg-ios-blue text-white rounded-lg text-sm font-medium"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowNewFolderInput(true)}
                                                                className="w-full text-left px-4 py-3 text-sm text-ios-blue font-medium hover:bg-surface-button flex items-center gap-2"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                                </svg>
                                                                {t.newFolder || 'New Folder'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                
                                {/* No folders message - show simple category option */}
                                {(!folders || folders.length === 0) && (
                                    <div className="mb-6" />
                                )}
                                
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 rounded-xl bg-surface-button text-text-primary font-medium hover:bg-surface-button-hover transition-colors active:scale-95"
                                    >
                                        {t.cancel || 'Cancel'}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 px-4 rounded-xl bg-ios-blue text-white font-medium hover:bg-ios-blue/90 transition-colors shadow-ios-blue active:scale-95"
                                    >
                                        {t.save || 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
