import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function HistoryPage({ onSelect }) {
  const { lang, history, favorites, toggleFavorite, user, login, settings } = useStore();
  const t = I18N[lang];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (item.placeName || '').toLowerCase().includes(searchLower) ||
           (item.coords || '').toLowerCase().includes(searchLower);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
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

      {/* History List */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-28">
      {filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[200px] text-text-secondary text-sm">
          {searchTerm ? (t.noSearchResults || 'No results found') : (t.noHistory || 'No history yet')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredHistory.map((item, idx) => {
            const isFav = favorites.some(f => f.coords === item.coords);
            return (
              <motion.div
                key={item.coords + idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-surface-card rounded-2xl p-4 border border-ios-border cursor-pointer hover:bg-surface-button-hover transition-colors active:scale-[0.98] text-left"
                onClick={() => onSelect(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary truncate text-left">
                      {item.placeName}
                    </h3>
                    {settings.showCoords && (
                      <p className="text-xs text-text-secondary mt-1 truncate text-left">
                        {item.coords}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
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
                    
                    {/* Favorite Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                           if (confirm(t.loginToFavorite || 'Please login to manage favorites.')) {
                              login();
                           }
                           return;
                        }
                        toggleFavorite(item);
                      }}
                      className={`p-2 transition-colors ${isFav ? 'text-[#FFC107]' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                      <svg className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
