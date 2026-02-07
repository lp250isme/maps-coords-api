import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { I18N } from '../i18n';
import LoginModal from './LoginModal';
import ConfirmModal from './ConfirmModal';

// Helper Toggle Component
const ToggleItem = ({ label, icon, checked, onChange }) => (
  <div className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-surface-button transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); onChange(); }}>
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

export default function ProfilePage({ onInfoClick }) {
  const { 
    lang, theme, user, settings,
    login, logout, toggleTheme, toggleLang, toggleSetting, setSetting, setUserName
  } = useStore();
  const t = I18N[lang];
  const [isEditingName, setIsEditingName] = useState(false);
  const [showStartPageModal, setShowStartPageModal] = useState(false);
  const [showDirectOpenModal, setShowDirectOpenModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApiKeyGenerateConfirm, setShowApiKeyGenerateConfirm] = useState(false);
  const [showApiKeyRegenerateConfirm, setShowApiKeyRegenerateConfirm] = useState(false);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isApiKeyCopied, setIsApiKeyCopied] = useState(false);


  const startPageOptions = [
    { 
      value: 'home', 
      label: t.homeTab || 'Home', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      value: 'favorites', 
      label: t.favTab || 'Favorites', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    { 
      value: 'history', 
      label: t.historyTab || 'History', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const directOpenOptions = [
    { 
      value: null, 
      label: t.targetAppOff || t.settings?.disabled || 'Disabled',
      icon: (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )
    },
    { 
      value: 'apple', 
      label: 'Apple Maps', 
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple" className={`w-5 h-5 object-contain ${theme === 'light' ? 'invert' : ''}`} />
    },
    { 
      value: 'naver', 
      label: 'Naver Maps', 
      icon: <img src="https://cdn.brandfetch.io/idy7-U4_1-/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1749526893278" alt="Naver" className="w-5 h-5 object-contain rounded-sm" />
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28 -mx-5 px-5">
      <div className="flex-1">
        {/* User Section */}
        <div className="bg-surface-card rounded-2xl p-4 border border-ios-border mb-4">
          {user ? (
            <div className="flex items-center gap-4">
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-14 h-14 rounded-full object-cover shadow-sm border border-ios-border"
              />
              <div className="flex-1 min-w-0 text-left">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      className="text-base font-semibold text-text-primary bg-transparent border-b border-ios-blue outline-none w-full"
                      defaultValue={user.customName || user.displayName}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) setUserName(val);
                        setIsEditingName(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val) setUserName(val);
                          setIsEditingName(false);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h3 className="font-semibold text-text-primary truncate">
                      {user.customName || user.displayName}
                    </h3>
                    <button 
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-text-secondary hover:text-ios-blue transition-colors rounded-full hover:bg-surface-button"
                      title={t.rename || 'Rename'}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
                <p className="text-xs text-ios-blue mt-0.5">{t.synced || 'Synced'}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <div className="w-16 h-16 bg-ios-gray/20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-text-secondary text-sm mb-3">{t.notLoggedIn || 'Not signed in'}</p>
              <button
                onClick={login}
                className="flex items-center gap-2 px-6 py-3 bg-ios-blue text-white rounded-full font-medium shadow-ios-blue hover:bg-ios-blue/90 transition-colors active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                {t.login || 'Sign in with Google'}
              </button>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="bg-surface-card rounded-2xl p-3 border border-ios-border mb-4">
          {/* Theme */}
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-surface-button transition-colors w-full"
          >
            <span className="flex items-center gap-3 text-sm font-medium text-text-primary">
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
              )}
              {theme === 'dark' ? (t.lightMode || 'Light Mode') : (t.darkMode || 'Dark Mode')}
            </span>
          </button>

          {/* Language */}
          <button 
            onClick={toggleLang}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-button text-sm font-medium text-text-primary transition-colors text-left w-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.204 8.5c.912.6 1.844 1.235 2.791 1.874m0 0L16.204 19m-3.409-1.874l-3.208-4.898L6 19M5 13h14l-1.931-6h-3.38m0-1c0 1.25.996 2.5 1.708 3m-9.358 4C2.697 12.016 10 3 10 3"></path></svg>
            {t.toggleBtn || 'English'}
          </button>
          
          <div className="h-[1px] bg-ios-border/50 my-1 mx-2"></div>

          {/* Show Coords */}
          <ToggleItem 
            label={t.settings?.showCoords || 'Show Coordinates'} 
            checked={settings.showCoords} 
            onChange={() => toggleSetting('showCoords')}
            icon={<svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>} 
          />

          {/* Show Distance */}
          <ToggleItem 
            label={t.settings?.showDistance || 'Show Distance'} 
            checked={settings.showDistance} 
            onChange={() => toggleSetting('showDistance')} 
            icon={<svg className="w-4 h-4 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>}
          />

          {/* Show Weather */}
          <ToggleItem 
            label={t.settings?.showWeather || 'Weather'} 
            checked={settings.showWeather} 
            onChange={() => toggleSetting('showWeather')} 
            icon={<svg className="w-4 h-4 text-[#FFCC00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>}
          />

          {/* Apple Maps */}
          <ToggleItem 
            label={t.settings?.showAppleMap || 'Apple Maps'} 
            checked={settings.showAppleMap} 
            onChange={() => toggleSetting('showAppleMap')} 
            icon={<img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple" className={`w-4 h-4 object-contain ${theme === 'light' ? 'invert' : ''}`} />} 
          />

          {/* Naver Maps */}
          <ToggleItem 
            label={t.settings?.showNaverMap || 'Naver Maps'} 
            checked={settings.showNaverMap} 
            onChange={() => toggleSetting('showNaverMap')} 
            icon={<img src="https://cdn.brandfetch.io/idy7-U4_1-/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1749526893278" alt="Naver" className="w-4 h-4 object-contain rounded-sm" />} 
          />

          {/* Map Preview */}
          <ToggleItem 
            label={t.settings?.showMapPreview || 'Map Preview'} 
            checked={settings.showMapPreview} 
            onChange={() => toggleSetting('showMapPreview')} 
            icon={<svg className="w-4 h-4 text-[#AF52DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>}
          />

          <div className="h-[1px] bg-ios-border/50 my-1 mx-2"></div>

          {/* Start Page - Custom Modal Trigger */}
          <div 
            className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-surface-button transition-colors cursor-pointer" 
            onClick={() => setShowStartPageModal(true)}
          >
            <span className="flex items-center gap-3 text-sm font-medium text-text-primary">
              <svg className="w-4 h-4 text-[#FF9500]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              {t.startPage || 'Start Page'}
            </span>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>{startPageOptions.find(o => o.value === (settings.startPage || 'home'))?.label}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="h-[1px] bg-ios-border/50 my-1 mx-2"></div>

          {/* Version Info */}
          





          {/* Direct Open - Custom Modal Trigger (Members Only) */}
          {user && (
          <div 
            className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-surface-button transition-colors cursor-pointer" 
            onClick={() => setShowDirectOpenModal(true)}
          >
            <span className="flex items-center gap-3 text-sm font-medium text-text-primary">
              <svg className="w-4 h-4 text-[#30D158]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              {t.directOpen || 'Direct Open'}
            </span>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>{directOpenOptions.find(o => o.value === settings.directOpenTarget)?.label || (t.targetAppOff || 'Disabled')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          )}
        </div>

        {/* Download Shortcut */}
        <div className="bg-surface-card rounded-2xl p-3 border border-ios-border mb-4">
          <a 
            href={user ? "https://www.icloud.com/shortcuts/44f810f58c954dd3aa9acf01e93c432e" : "#"}
            target={user ? "_blank" : undefined}
            rel={user ? "noopener noreferrer" : undefined}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-button text-sm font-medium text-text-primary transition-colors text-left w-full cursor-pointer"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setShowLoginModal(true);
              }
            }}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="m9.852 14.633l-6.2-3.946a2 2 0 0 1 0-3.374l6.2-3.946a4 4 0 0 1 4.296 0l6.2 3.946a2 2 0 0 1 0 3.374l-6.2 3.946a4 4 0 0 1-4.296 0Z"></path>
                <path d="m18.286 12l2.063 1.313a2 2 0 0 1 0 3.374l-6.201 3.946a4 4 0 0 1-4.296 0l-6.2-3.946a2 2 0 0 1 0-3.374L5.714 12"></path>
              </g>
            </svg>
            {t.downloadShortcut || 'Download Shortcut'}
          </a>
        </div>

        {/* API Key Management (Members Only) */}
        {user && (
        <div className="bg-surface-card rounded-2xl p-4 mb-4 shadow-sm border border-ios-border">
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                {t.apiKeyTitle || 'API Key (Headless Mode)'}
            </h3>
            
            {user.apiKey ? (
                <div className="flex items-center gap-2 bg-[var(--bg-secondary)] rounded-xl p-2 w-full">
                    <code className="flex-1 text-xs font-mono text-text-primary break-all select-all px-1 text-left min-h-[1.5em] flex items-center">
                        {isApiKeyVisible ? user.apiKey : '********'}
                    </code>
                    
                    {/* Visibility Toggle */}
                    <button 
                        onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-button rounded-lg transition-colors shrink-0"
                        title={isApiKeyVisible ? (t.hide || "Hide") : (t.show || "Show")}
                    >
                        {isApiKeyVisible ? (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                    </button>

                    {/* Copy Button */}
                    <button 
                        onClick={() => {
                            const copyText = user.apiKey;
                            if (navigator.clipboard && window.isSecureContext) {
                                navigator.clipboard.writeText(copyText).then(() => {
                                    setIsApiKeyCopied(true);
                                    setTimeout(() => setIsApiKeyCopied(false), 2000);
                                });
                            } else {
                                // Fallback for non-secure context
                                const textArea = document.createElement("textarea");
                                textArea.value = copyText;
                                document.body.appendChild(textArea);
                                textArea.focus();
                                textArea.select();
                                try {
                                    document.execCommand('copy');
                                    setIsApiKeyCopied(true);
                                    setTimeout(() => setIsApiKeyCopied(false), 2000);
                                } catch (err) {
                                    console.error('Copy failed', err);
                                }
                                document.body.removeChild(textArea);
                            }
                        }}
                        className={`p-2 rounded-lg transition-colors shrink-0 ${isApiKeyCopied ? 'text-green-500 bg-green-500/10' : 'text-ios-blue hover:bg-surface-button'}`}
                        title={t.copy || "Copy"}
                    >
                        {isApiKeyCopied ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={() => setShowApiKeyRegenerateConfirm(true)}
                        className="p-2 text-text-secondary hover:text-red-500 transition-colors shrink-0"
                        title={t.regenerateApiKey || "Regenerate"}
                    >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowApiKeyGenerateConfirm(true)}
                    className="w-full py-2 px-3 bg-ios-blue/10 text-ios-blue text-sm font-medium rounded-xl hover:bg-ios-blue/20 transition-colors text-left flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {t.generateApiKey || 'Generate API Key'}
                </button>
            )}
        </div>
        )}

        {/* About */}
        <div className="bg-surface-card rounded-2xl p-3 border border-ios-border mb-4">
          <button 
            onClick={onInfoClick}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-button text-sm font-medium text-text-primary transition-colors text-left w-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {t.about || t.infoTitle?.split(' ')[0] || 'About'}
          </button>
        </div>


      </div>

      {/* Logout Button */}
      {user && (
        <div className="mt-6 pb-2">
          <button
            onClick={logout}
            className="w-full py-3 bg-surface-button text-red-500 rounded-xl font-medium text-sm hover:bg-surface-button-hover transition-colors active:scale-[0.98]"
          >
            {t.logout || 'Sign Out'}
          </button>
        </div>
      )}

      {/* Footer / Copyright */}
      <footer className="w-full py-6 text-center text-[10px] text-text-secondary font-medium shrink-0">
        © {new Date().getFullYear()} kv. All rights reserved.
        <div className="mt-1">GTC v1.3.0</div>
      </footer>

      {/* Start Page Selection Modal */}
      <AnimatePresence>
        {showStartPageModal && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStartPageModal(false)}
            />
            <motion.div
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-surface-card rounded-2xl border border-ios-border shadow-2xl z-50 overflow-hidden max-w-sm mx-auto"
              initial={{ opacity: 0, scale: 0.95, y: '-45%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, y: '-45%' }}
            >
              <div className="px-5 py-4 border-b border-ios-border">
                <h3 className="text-lg font-semibold text-text-primary text-center">
                  {t.startPage || 'Start Page'}
                </h3>
              </div>
              <div className="p-3">
                {startPageOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setSetting('startPage', option.value); setShowStartPageModal(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-1 text-left ${
                      settings.startPage === option.value || (!settings.startPage && option.value === 'home')
                        ? 'bg-ios-blue/10 text-ios-blue' 
                        : 'hover:bg-surface-button text-text-primary'
                    }`}
                  >
                    {option.icon}
                    <span className="font-medium">{option.label}</span>
                    {(settings.startPage === option.value || (!settings.startPage && option.value === 'home')) && (
                      <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="px-3 pb-3">
                <button
                  onClick={() => setShowStartPageModal(false)}
                  className="w-full py-3 bg-surface-button text-text-primary rounded-xl font-medium text-sm hover:bg-surface-button-hover transition-colors"
                >
                  {t.cancel || 'Cancel'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Direct Open Selection Modal */}
      <AnimatePresence>
        {showDirectOpenModal && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDirectOpenModal(false)}
            />
            <motion.div
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-surface-card rounded-2xl border border-ios-border shadow-2xl z-50 overflow-hidden max-w-sm mx-auto"
              initial={{ opacity: 0, scale: 0.95, y: '-45%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, y: '-45%' }}
            >
              <div className="px-5 py-4 border-b border-ios-border">
                <h3 className="text-lg font-semibold text-text-primary text-center">
                  {t.targetApp || 'Default Map App'}
                </h3>
              </div>
              <div className="p-2">
                {directOpenOptions.map((option) => (
                  <button
                    key={option.value || 'off'}
                    onClick={() => {
                      setSetting('directOpenTarget', option.value);
                      setShowDirectOpenModal(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-colors
                      ${settings.directOpenTarget === option.value 
                        ? 'bg-ios-blue text-white shadow-ios-blue' 
                        : 'text-text-primary hover:bg-surface-button'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`
                        flex items-center justify-center
                        ${settings.directOpenTarget === option.value ? 'text-white' : ''}
                      `}>
                        {option.icon}
                      </span>
                      <span className="font-medium text-[15px]">{option.label}</span>
                    </div>
                    {settings.directOpenTarget === option.value && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-ios-border">
                <button
                  onClick={() => setShowDirectOpenModal(false)}
                  className="w-full py-3 text-center text-ios-blue font-semibold text-[17px] hover:bg-surface-button rounded-xl transition-colors"
                >
                  {t.cancel || 'Cancel'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => { login(); setShowLoginModal(false); }}
        title={t.loginToDownloadShortcut || 'Please login to download shortcut'}
        t={t}
      />

        {/* API Key Generate Confirm Modal */}
        <ConfirmModal
            isOpen={showApiKeyGenerateConfirm}
            onClose={() => setShowApiKeyGenerateConfirm(false)}
            onConfirm={async () => {
                await useStore.getState().generateApiKey();
                setShowApiKeyGenerateConfirm(false);
            }}
            title={t.generateApiKey || 'Generate API Key'}
            description={t.confirmGenerateKey || 'Generate a new API Key?'}
            confirmText={t.confirm || 'Confirm'}
            cancelText={t.cancel || 'Cancel'}
        />

        {/* API Key Regenerate Confirm Modal */}
        <ConfirmModal
            isOpen={showApiKeyRegenerateConfirm}
            onClose={() => setShowApiKeyRegenerateConfirm(false)}
            onConfirm={async () => {
                await useStore.getState().generateApiKey();
                setShowApiKeyRegenerateConfirm(false);
            }}
            title={t.regenerateApiKey || 'Regenerate Key'}
            description={t.confirmRegenerateKey || 'Regenerate API Key? Old key will stop working.'}
            confirmText={t.confirm || 'Confirm'}
            cancelText={t.cancel || 'Cancel'}
        />
    </div>
  );
}
