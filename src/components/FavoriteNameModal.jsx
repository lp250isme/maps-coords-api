import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';

export default function FavoriteNameModal({ isOpen, onClose, onSave, initialName, initialFolder, t }) {
    const { folders, addFolder } = useStore();
    const [name, setName] = useState(initialName || '');
    const [selectedFolder, setSelectedFolder] = useState(initialFolder || null);
    const [showFolderSelect, setShowFolderSelect] = useState(false);
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
        onSave(name, selectedFolder);
    };

    const handleAddNewFolder = () => {
        if (newFolderName.trim()) {
            addFolder(newFolderName.trim());
            setSelectedFolder(newFolderName.trim());
            setNewFolderName('');
        }
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
                                {/* Name Input */}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-surface-button text-text-primary px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-ios-blue/50 mb-4 text-base"
                                    placeholder={t.favModalPlaceholder || 'Location Name'}
                                />

                                {/* Folder Selector */}
                                <div className="mb-6 relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowFolderSelect(!showFolderSelect)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-surface-button rounded-xl text-sm text-text-primary hover:bg-surface-button-hover transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                            {selectedFolder || t.uncategorized || 'Uncategorized'}
                                        </span>
                                        <svg className={`w-4 h-4 text-text-secondary transition-transform ${showFolderSelect ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Folder Dropdown */}
                                    <AnimatePresence>
                                        {showFolderSelect && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                className="absolute bottom-full left-0 right-0 mb-1 bg-ios-card border border-ios-border rounded-xl shadow-lg z-[300] overflow-hidden max-h-[150px] overflow-y-auto"
                                            >
                                                {/* Uncategorized Option */}
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedFolder(null); setShowFolderSelect(false); }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-button transition-colors ${!selectedFolder ? 'text-ios-blue font-medium' : 'text-text-primary'}`}
                                                >
                                                    📄 {t.uncategorized || 'Uncategorized'}
                                                </button>

                                                {/* Existing Folders */}
                                                {folders.map(folder => (
                                                    <button
                                                        key={folder}
                                                        type="button"
                                                        onClick={() => { setSelectedFolder(folder); setShowFolderSelect(false); }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-button transition-colors ${selectedFolder === folder ? 'text-ios-blue font-medium' : 'text-text-primary'}`}
                                                    >
                                                        📁 {folder}
                                                    </button>
                                                ))}

                                                {/* New Folder Input */}
                                                <div className="border-t border-ios-border/50 p-2 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newFolderName}
                                                        onChange={(e) => setNewFolderName(e.target.value)}
                                                        placeholder={t.newFolder || 'New Folder'}
                                                        className="flex-1 px-3 py-1.5 text-sm bg-surface-button rounded-lg border-none outline-none text-text-primary placeholder:text-text-secondary"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddNewFolder();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddNewFolder}
                                                        className="text-ios-blue font-medium text-sm px-2"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
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

