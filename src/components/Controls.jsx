import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { I18N } from '../i18n';

// Helper Toggle Component
const ToggleItem = ({ label, icon, checked, onChange }) => (
  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-button transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); onChange(); }}>
      <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium text-text-primary">{label}</span>
      </div>
      <button 
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-[#007AFF] dark:bg-[#0A84FF]' : 'bg-ios-gray/30'}`}
      >
          <motion.div 
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ x: checked ? 20 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
      </button>
  </div>
);

export default function Controls({ onInfoClick, onHistoryClick, onFavoritesClick }) { 
  const { theme, toggleTheme, lang, toggleLang, settings, toggleSetting } = useStore();
  const t = I18N[lang];
  const [isOpen, setIsOpen] = useState(false);
    
  const handleAction = (action) => {
      action();
      setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      {/* Toggle Button */}
      <button 
        className="bg-surface-button backdrop-blur-xl shadow-sm border border-surface-button-hover rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-surface-button-hover text-text-primary active:scale-95"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)}></div>
      )}

      {/* Menu Dropdown */}
      <AnimatePresence>
      {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 top-12 w-64 bg-surface-card backdrop-blur-2xl shadow-ios-lg rounded-2xl border border-ios-border p-2 z-50 origin-top-right max-h-[80vh] overflow-y-auto scrollbar-hide"
          >
              <div className="flex flex-col gap-1">
                  
                  {/* Favorites */}
                  <button 
                    onClick={() => handleAction(onFavoritesClick || onHistoryClick)} 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-button text-sm font-medium text-text-primary transition-colors text-left"
                  >
                        <svg className="w-4 h-4 text-[#FFC107]" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        {t.favorites}
                  </button>

                  {/* History */}
                  <button 
                    onClick={() => handleAction(onHistoryClick)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-button text-sm font-medium text-text-primary transition-colors text-left"
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {t.history}
                  </button>

                  <div className="h-[1px] bg-ios-border my-1 mx-2"></div>
                  
                  {/* Settings Section */}
                  <div className="px-3 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider opacity-70">
                      {t.settings.title}
                  </div>

                  {/* Theme */}
                  <button 
                    onClick={() => handleAction(toggleTheme)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-button transition-colors w-full"
                  >
                      <span className="flex items-center gap-3 text-sm font-medium text-text-primary">
                          {theme === 'dark' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                          )}
                          {theme === 'dark' ? t.lightMode : t.darkMode}
                      </span>
                  </button>

                  {/* Language */}
                  <button 
                    onClick={() => handleAction(toggleLang)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-button text-sm font-medium text-text-primary transition-colors text-left"
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.204 8.5c.912.6 1.844 1.235 2.791 1.874m0 0L16.204 19m-3.409-1.874l-3.208-4.898L6 19M5 13h14l-1.931-6h-3.38m0-1c0 1.25.996 2.5 1.708 3m-9.358 4C2.697 12.016 10 3 10 3"></path></svg>
                      {t.toggleBtn}
                  </button>
                  
                  <ToggleItem 
                      label={t.settings.showCoords} 
                      checked={settings.showCoords} 
                      onChange={() => toggleSetting('showCoords')}
                      icon={<svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>} 
                  />
                  <ToggleItem 
                      label={t.settings.showDistance} 
                      checked={settings.showDistance} 
                      onChange={() => toggleSetting('showDistance')} 
                      icon={<svg className="w-4 h-4 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>}
                  />
                  <ToggleItem 
                      label={t.settings.showWeather} 
                      checked={settings.showWeather} 
                      onChange={() => toggleSetting('showWeather')} 
                      icon={<svg className="w-4 h-4 text-[#FFCC00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>}
                  />
                  <ToggleItem 
                      label={t.settings.showAppleMap} 
                      checked={settings.showAppleMap} 
                      onChange={() => toggleSetting('showAppleMap')} 
                      icon={<img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple" className={`w-4 h-4 object-contain ${theme === 'light' ? 'invert' : ''}`} />} 
                  />
                   <ToggleItem 
                      label={t.settings.showNaverMap} 
                      checked={settings.showNaverMap} 
                      onChange={() => toggleSetting('showNaverMap')} 
                      icon={<img src="https://cdn.brandfetch.io/idy7-U4_1-/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1749526893278" alt="Naver" className="w-4 h-4 object-contain rounded-sm" />} 
                  />
                  <ToggleItem 
                      label={t.settings.showMapPreview} 
                      checked={settings.showMapPreview} 
                      onChange={() => toggleSetting('showMapPreview')} 
                      icon={<svg className="w-4 h-4 text-[#AF52DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>}
                  />

                  <div className="h-[1px] bg-ios-border my-1 mx-2"></div>

                  {/* Info */}
                  <button 
                    onClick={() => handleAction(onInfoClick)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-button text-sm font-medium text-text-primary transition-colors text-left"
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {t.infoTitle.split(' ')[0]}
                  </button>

              </div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
