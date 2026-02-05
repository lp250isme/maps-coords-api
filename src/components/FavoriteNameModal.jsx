import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function FavoriteNameModal({ isOpen, onClose, onSave, initialName, t }) {
    const [name, setName] = useState(initialName || '');
    const inputRef = useRef(null);

    useEffect(() => {
        setName(initialName || '');
    }, [initialName, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
            setTimeout(() => inputRef.current.select(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(name);
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
                                    className="w-full bg-surface-button text-text-primary px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-ios-blue/50 mb-6 text-base"
                                    placeholder={t.favModalPlaceholder || 'Location Name'}
                                />
                                
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
