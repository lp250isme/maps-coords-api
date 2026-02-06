import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { I18N } from '../i18n';

import FavoriteNameModal from './FavoriteNameModal';

export default function ResultCard({ result }) {
  const { lang, theme, settings, favorites, addFavorite, removeFavorite, user, login } = useStore();
  const t = I18N[lang];
  const { placeName, coords, lat, lon } = result;
  
  const favoriteItem = favorites.find(f => f.coords === coords);
  const isFavorite = !!favoriteItem;
  const displayName = favoriteItem?.customName || placeName;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleFavorite = (e) => {
      e.stopPropagation();
      if (!user) {
          if (confirm(t.loginToFavorite || "Please login to manage favorites.")) {
              login();
          }
          return;
      }
      
      if (isFavorite) {
          removeFavorite(coords);
      } else {
          setIsModalOpen(true);
      }
  };

  const handleSaveFavorite = (customName) => {
      const timestamp = new Date().toISOString();
      addFavorite({ ...result, timestamp }, customName);
      setIsModalOpen(false);
  };
  
  const [copied, setCopied] = useState(false);
  const [distance, setDistance] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState(null);
  const [weather, setWeather] = useState(null);

  const getDistance = () => {
      if (!navigator.geolocation) return;
      setLocLoading(true);
      setLocError(null);
      
      navigator.geolocation.getCurrentPosition(
          (position) => {
              const userLat = position.coords.latitude;
              const userLon = position.coords.longitude;
              const dist = getDistanceFromLatLonInKm(userLat, userLon, lat, lon);
              setDistance(dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`);
              setLocLoading(false);
          },
          (err) => {
              console.warn('Geolocation error:', err);
              setLocError(true);
              setLocLoading(false);
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
  };

  const fetchWeather = async () => {
      try {
          const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
          const data = res.data.current;
          setWeather({
              temp: Math.round(data.temperature_2m),
              code: data.weather_code
          });
      } catch (err) {
          console.error('Weather fetch failed', err);
      }
  };

  React.useEffect(() => {
     getDistance();
     fetchWeather();
  }, [lat, lon]);

  const getWeatherIcon = (code) => {
      if (code === 0) return { icon: '☀️', key: 'clear' };
      if (code >= 1 && code <= 3) return { icon: '☁️', key: 'cloudy' };
      if (code >= 45 && code <= 48) return { icon: '🌫️', key: 'fog' };
      if (code >= 51 && code <= 67) return { icon: '🌧️', key: 'rain' };
      if (code >= 71 && code <= 77) return { icon: '❄️', key: 'snow' };
      if (code >= 80 && code <= 82) return { icon: '🌦️', key: 'rain' };
      if (code >= 95 && code <= 99) return { icon: '⚡', key: 'storm' };
      return { icon: '🌡️', key: 'unknown' };
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1); 
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c;
      return d;
  }
  
  function deg2rad(deg) {
      return deg * (Math.PI/180);
  }

  const handleShareLink = async () => {
      let shareUrl = `${window.location.origin}/?q=${lat},${lon}`;
      if (placeName && placeName !== `${lat}, ${lon}`) {
          shareUrl += `&name=${encodeURIComponent(placeName)}`;
      }
      const shareData = {
          title: 'GTC - ' + placeName,
          text: `Coords for ${placeName}: ${coords}`,
          url: shareUrl
      };

      try {
          if (navigator.share) {
              await navigator.share(shareData);
          } else {
              await navigator.clipboard.writeText(shareUrl);
              alert(t.linkCopied);
          }
      } catch (err) {
          console.error('Share failed:', err);
      }
  };

  const appleUrl = `http://maps.apple.com/?q=${lat},${lon}`;
  const encodedName = encodeURIComponent(placeName || 'Location');
  const naverUrl = `nmap://place?lat=${lat}&lng=${lon}&name=${encodedName}&appname=https%3A%2F%2Fcomap.app`; 

  return (
    <div className="relative w-full animate-slide-up">
        <FavoriteNameModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveFavorite}
            initialName={placeName} 
            t={t}
        />
        <div id="resultCard" className="mt-6 p-6 bg-surface-card backdrop-blur-2xl shadow-ios-lg rounded-[28px] w-full text-left transition-all duration-300 border border-ios-border overflow-hidden">
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-text-primary truncate pr-2" id="placeName">
                    {displayName}
                </h2>
                <button 
                    onClick={handleToggleFavorite}
                    className="p-1 rounded-full hover:bg-surface-button-hover active:scale-95 transition-all focus:outline-none"
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <svg 
                        className={`w-6 h-6 transition-colors duration-200 ${isFavorite ? 'text-[#FFC107] fill-[#FFC107]' : 'text-gray-400 dark:text-gray-300 hover:text-text-secondary fill-none'}`} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </button>
            </div>
            
            {/* Coordinates */}
            <AnimatePresence>
                {settings.showCoords && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div 
                            className="text-base text-ios-blue cursor-pointer active:opacity-60 transition-opacity duration-200 select-none font-medium"
                            onClick={handleCopy}
                            title="Click to copy"
                        >
                            {copied ? t.copied : coords}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info Row: Distance & Weather */}
            <div className={`flex flex-wrap items-center gap-4 animate-fade-in pl-0.5 ${(settings.showCoords) ? 'mb-4' : 'mt-2 mb-4'}`}>
                <AnimatePresence>
                {settings.showDistance && distance && (
                    <motion.div 
                        initial={{ opacity: 0, width: 0, paddingRight: 0 }}
                        animate={{ opacity: 1, width: 'auto', paddingRight: 16 }}
                        exit={{ opacity: 0, width: 0, paddingRight: 0 }}
                        className="text-text-secondary text-sm font-normal flex items-center gap-1.5 overflow-hidden whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5 opacity-70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {t.distanceFromYou || 'Distance'}: <span className="text-text-primary font-medium">{distance}</span>
                    </motion.div>
                )}
                </AnimatePresence>
                
                {/* Geolocation Button */}
                <AnimatePresence>
                {settings.showDistance && !distance && !locError && (
                    <motion.button 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        onClick={getDistance}
                        className="flex items-center gap-1.5 text-sm text-ios-blue hover:opacity-70 transition-opacity whitespace-nowrap overflow-hidden"
                        disabled={locLoading}
                    >
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${locLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {locLoading 
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path> 
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            }
                        </svg>
                        {locLoading ? t.calculating || 'Locating...' : t.showDistance || 'Show Distance'}
                    </motion.button>
                )}
                </AnimatePresence>

                {/* Weather Info (Toggleable) */}
                <AnimatePresence>
                {settings.showWeather && weather && (
                    <motion.div 
                        initial={{ opacity: 0, width: 0, paddingLeft: 0, borderLeftWidth: 0 }}
                        animate={{ opacity: 1, width: 'auto', paddingLeft: 16, borderLeftWidth: 1 }}
                        exit={{ opacity: 0, width: 0, paddingLeft: 0, borderLeftWidth: 0 }}
                        className="text-text-secondary text-sm font-normal flex items-center gap-1.5 border-l border-ios-border overflow-hidden whitespace-nowrap"
                    >
                        <span className="text-lg leading-none">{getWeatherIcon(weather.code).icon}</span>
                        <span className="text-text-primary font-medium">{weather.temp}°C</span>
                        <span className="opacity-80 text-xs">({t.weather?.[getWeatherIcon(weather.code).key] || getWeatherIcon(weather.code).key})</span>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            
            {/* Map Shortcuts (Toggleable with AnimatePresence) */}
            <AnimatePresence>
                {(settings.showAppleMap || settings.showNaverMap) && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="flex gap-2.5 overflow-hidden select-none"
                    >
                        {settings.showAppleMap && (
                            <motion.a 
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                href={appleUrl} 
                                className={`
                                    bg-white text-black no-underline rounded-[14px] p-[14px] flex items-center justify-center font-medium text-sm shadow-sm transition-transform duration-100 ease-out active:scale-95 dark:bg-[#3a3a3c] dark:text-white group
                                    ${!settings.showNaverMap ? 'w-full' : 'flex-1'}
                                `}
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple Maps" className={`w-[18px] h-[18px] mr-[6px] object-contain ${theme === 'light' ? 'invert' : ''}`} />
                                Apple Maps
                            </motion.a>
                        )}
                        {settings.showNaverMap && (
                            <motion.a 
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                href={naverUrl} 
                                className={`
                                    bg-[#03C75A] text-white no-underline rounded-[14px] p-[14px] flex items-center justify-center font-medium text-sm shadow-sm transition-transform duration-100 ease-out active:scale-95
                                    ${!settings.showAppleMap ? 'w-full' : 'flex-1'}
                                `}
                            >
                                <img src="https://cdn.brandfetch.io/idy7-U4_1-/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1749526893278" alt="Naver Map" className="w-[18px] h-[18px] mr-[6px] object-contain rounded-[4px] " />
                                NAVER Maps
                            </motion.a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Map Preview (Toggleable) */}
            <AnimatePresence>
            {settings.showMapPreview && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl overflow-hidden border border-surface-button bg-surface-button relative z-0"
                >
                    <div className="aspect-square w-full relative">
                        <iframe 
                            id="mapFrame" 
                            src={`https://www.google.com/maps?q=${lat},${lon}&z=15&output=embed`} 
                            loading="lazy" 
                            allowFullScreen 
                            referrerPolicy="no-referrer-when-downgrade"
                            className="w-full h-full border-none absolute inset-0"
                            title="Map Preview"
                        ></iframe>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        {/* Share Actions */}
        <div className="flex justify-center gap-4 mt-4">
             <button 
                onClick={handleShareLink}
                className="flex items-center gap-2 px-6 py-2.5 bg-surface-button backdrop-blur-md rounded-full text-sm font-medium text-text-primary shadow-ios hover:bg-surface-button-hover transition-colors active:scale-95"
             >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                 {t.shareLink}
             </button>
        </div>
    </div>
  );
}
