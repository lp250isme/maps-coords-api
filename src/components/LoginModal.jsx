import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginModal({ isOpen, onClose, onLogin, title, description, t }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80]" // High z-index
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 flex items-center justify-center z-[90] pointer-events-none"
                    >
                        <div className="bg-surface-card w-[90%] max-w-sm rounded-[24px] p-6 shadow-ios-lg border border-ios-border pointer-events-auto">
                            <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-text-secondary text-center mb-6 leading-relaxed">
                                {description}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={onLogin} 
                                    className="w-full py-3.5 bg-ios-blue text-white rounded-xl font-medium hover:bg-ios-blue/90 transition-colors shadow-sm"
                                >
                                    {t.login || 'Sign in with Google'}
                                </button>
                                <button 
                                    onClick={onClose} 
                                    className="w-full py-3.5 text-ios-blue font-medium hover:bg-surface-button rounded-xl transition-colors"
                                >
                                    {t.cancel || 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
