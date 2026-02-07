import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, description, confirmText, cancelText }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-x-4 top-[30%] md:left-1/2 md:w-[400px] md:-ml-[200px] bg-surface-card rounded-[24px] p-6 shadow-2xl z-50 border border-ios-border"
                    >
                        <div className="flex flex-col items-center text-center">
                            <h3 className="text-xl font-bold text-text-primary mb-2">
                                {title}
                            </h3>
                            <p className="text-text-secondary mb-8 text-sm leading-relaxed px-4">
                                {description}
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] text-text-primary rounded-xl font-medium hover:bg-opacity-80 transition-colors"
                                >
                                    {cancelText || 'Cancel'}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                >
                                    {confirmText || 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
