import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './store';
import { I18N } from './i18n';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultCard from './components/ResultCard';
import InfoModal from './components/InfoModal';
import BottomTabBar from './components/BottomTabBar';
import FavoritesPage from './components/FavoritesPage';
import HistoryPage from './components/HistoryPage';
import ProfilePage from './components/ProfilePage';
import LoginModal from './components/LoginModal';

import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const { theme, lang, initTheme, initLang, addToHistory, checkCache, setUser, syncData, settings, setSetting, setAuthLoading, login, user, isAuthLoading } = useStore();
  const t = I18N[lang];
  
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoLoginOpen, setPromoLoginOpen] = useState(false);
  // Initialize from settings.startPage, only when there's no URL parameter
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hasQuery = params.get('q') || params.get('url') || params.get('googleMapUrl');
    if (hasQuery) return 'home'; // If converting URL, go to home
    return settings.startPage || 'home';
  });
  const lastConvertedUrl = React.useRef('');

  useEffect(() => {
    initTheme();
    initLang();

    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check for Shortcut Promotion
  useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const isShortcut = params.get('googleMapUrl');
     
     if (isShortcut && !user && !isAuthLoading && !isLoading) {
         const seen = localStorage.getItem('gtc_direct_open_promotion_seen');
         if (!seen) {
             setPromoLoginOpen(true);
         }
     }
  }, [user, isAuthLoading, isLoading]);

  const handlePromoWait = async () => {
      await login(); // This triggers popup
      setPromoLoginOpen(false);
      localStorage.setItem('gtc_direct_open_promotion_seen', 'true');
      
      // Auto-enable direct open logic?
      // Since login updates user, App re-renders. 
      // If user logs in, we might want to default directOpenTarget if null?
      // We can do this in store login or here using setSetting
      // But settings is from useStore. Access via store instance or effect?
      // We will access store via hook - settings is available.
      // But we need to update it. useStore returns setSetting.
      // Wait, we need setSetting in App's destructuring first.
  };

  const handlePromoClose = () => {
       setPromoLoginOpen(false);
       localStorage.setItem('gtc_direct_open_promotion_seen', 'true');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || params.get('url') || params.get('googleMapUrl');
    const name = params.get('name'); // Get name param

    if (query) {
        setUrl(query);
        setTimeout(() => {
            handleConvert(query, name); // Pass name to handler
            // Clean URL after processing
            window.history.replaceState({}, '', window.location.pathname);
        }, 500);
    }
  }, []);

  // Direct Open Effect
  useEffect(() => {
    if (result && success && settings.directOpenTarget) {
      const { lat, lon, placeName } = result;
      const encodedName = encodeURIComponent(placeName || 'Location');
      let targetUrl = '';
      
      if (settings.directOpenTarget === 'apple') {
          targetUrl = `http://maps.apple.com/?q=${lat},${lon}`;
      } else if (settings.directOpenTarget === 'naver') {
          const naverUrl = `nmap://place?lat=${lat}&lng=${lon}&name=${encodedName}&appname=https%3A%2F%2Fcomap.app`;
          targetUrl = naverUrl;
      }
      
      if (targetUrl) {
          window.location.href = targetUrl;
      }
    }
  }, [result, success, settings.directOpenTarget]);

  const handleConvert = async (directUrl, sharedName = null) => {
    const inputUrl = typeof directUrl === 'string' ? directUrl : url;
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setSuccess(false);
    setError('');
    setResult(null);

    const coordsRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = inputUrl.trim().match(coordsRegex);

    if (match) {
        const lat = match[1];
        const lon = match[3];
        const coords = `${lat},${lon}`;
        
        const resultItem = {
            coords,
            placeName: sharedName || `${lat}, ${lon}`, 
            lat,
            lon,
            timestamp: Date.now()
        };

        setResult(resultItem);
        addToHistory(resultItem);
        lastConvertedUrl.current = inputUrl.trim();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 1500);
        setIsLoading(false);
        return; 
    }

    // 2. Check Cache (Database/Local)
    const cachedResult = checkCache(inputUrl.trim());
    if (cachedResult) {
        console.log("Cache Hit:", cachedResult.placeName);
        setResult(cachedResult);
        addToHistory({ ...cachedResult, timestamp: Date.now() }, inputUrl.trim());
        
        lastConvertedUrl.current = inputUrl.trim();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 1500);
        setIsLoading(false);
        return;
    }

    try {
      const res = await axios.get('/api', {
        params: { url: inputUrl.trim() }
      });
      const data = res.data;

      const { coords, placeName } = data;
      
      if (!coords) {
         throw new Error(t.pleaseCopyFromShare);
      }

      const [lat, lon] = coords.replace(/\s/g, '').split(',');

      const resultItem = {
        coords,
        placeName: placeName || t.unknownPlace,
        lat,
        lon,
        timestamp: Date.now()
      };

      setResult(resultItem);
      addToHistory(resultItem, inputUrl.trim());
      
      lastConvertedUrl.current = inputUrl.trim();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);

    } catch (err) {
      if (err.response) {
          const { status, data } = err.response;
          if (status === 404 || data.error === 'Coords not found') {
              setError(t.pleaseCopyFromShare);
          } else if (data.error === 'Not a Google Maps URL') {
              setError(t.invalidUrl);
          } else {
              setError(data.error || t.errorFetching);
          }
      } else {
        setError(err.message || t.errorFetching);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (result) {
        setResult(null);
        setUrl('');
        setError('');
        setSuccess(false);
        lastConvertedUrl.current = ''; 
    }
  };

  const handleSelectItem = (item) => {
    setResult({
      coords: item.coords,
      placeName: item.customName || item.placeName,
      lat: item.lat,
      lon: item.lon
    });
    setActiveTab('home');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1500);
  };

  // Determine if header should be shown (non-home tabs or home with result)
  const showHeader = activeTab !== 'home' || result;

  return (
    <div className={`
        h-[100dvh] flex flex-col items-center w-full mx-auto text-center overflow-hidden transition-all duration-500 ease-out pb-safe
        ${result && activeTab === 'home' ? 'bg-black/5' : ''}
    `}>
      
      {/* Main Content Wrapper */}
      <main className={`
          flex-1 w-full flex flex-col px-5 overflow-hidden
          container mx-auto sm:max-w-[600px]
          transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)
          ${activeTab === 'home' 
            ? (result ? 'pt-4 sm:pt-6 justify-start' : 'pt-[30vh] justify-start')
            : 'pt-4 sm:pt-6 justify-start'
          }
      `}>

        {/* Persistent Layout Container - Header (for Home tab, animated; for other tabs, static) */}
        <motion.div 
            layout
            className={`
                flex w-full z-10 mb-4 flex-shrink-0
                ${showHeader 
                    ? 'flex-row items-center justify-start gap-3 mb-5 pl-0 h-10' 
                    : 'flex-col items-center justify-center gap-4'
                }
            `}
        >
            {/* Icon Container */}
            <motion.div 
                layout
                className={`
                    relative z-20 flex-shrink-0
                    ${activeTab === 'home' && result ? 'cursor-pointer active:scale-95' : ''}
                `}
                onClick={() => {
                  if (activeTab === 'home') {
                    // On home tab: reset the result
                    handleReset();
                  } else {
                    // On other tabs: just switch back to home (preserve result)
                    setActiveTab('home');
                  }
                }}
                animate={{ 
                    scale: showHeader ? 1 : 1.5,
                }}
                transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 25
                }}
            >
                <Header />
            </motion.div>
            
            {/* App Name */}
            <motion.h1 
                layout="position"
                animate={{ 
                    opacity: 1, 
                    scale: showHeader ? 1 : 1.2, 
                    originX: showHeader ? 0 : 0.5,
                    originY: 0.5
                }}
                transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 25 
                }}
                className={`
                    font-bold tracking-tight text-text-primary whitespace-nowrap overflow-hidden text-lg
                `}
            >
                GTC
            </motion.h1>
        </motion.div>
        
        {/* Page Content based on Active Tab */}
        <div className="flex-1 w-full relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full overflow-y-auto no-scrollbar pb-28"
            >
              {/* Input Section */}
              <motion.div 
                  layout
                  className={`
                      w-full transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)
                      ${result ? 'max-w-full' : 'max-w-[400px] mx-auto'}
                  `}
                  transition={{ 
                      type: "spring", 
                      stiffness: 250, 
                      damping: 30
                  }}
              >
                  <InputSection 
                      url={url} 
                      setUrl={setUrl} 
                      loading={isLoading}
                      success={success}
                      onConvert={() => handleConvert()}
                      onAutoPaste={(pastedText) => {
                          if (pastedText && pastedText.trim() !== lastConvertedUrl.current) {
                              setUrl(pastedText);
                              setTimeout(() => handleConvert(pastedText), 200);
                          }
                      }}
                  />
              </motion.div>
          
              {/* Error & Result */}
              <div className="w-full relative min-h-[50px] z-0">
                <AnimatePresence>
                    {error && !result && (
                        <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-[#FF3B30] text-sm mt-3 absolute w-full left-0 text-center"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>
                
                <AnimatePresence mode="popLayout">
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 300, 
                                damping: 30, 
                                delay: 0.2
                            }}
                        >
                            <ResultCard result={result} />
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full overflow-hidden flex flex-col"
            >
              <FavoritesPage onSelect={handleSelectItem} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full overflow-hidden flex flex-col"
            >
              <HistoryPage onSelect={handleSelectItem} />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full overflow-hidden flex flex-col"
            >
              <ProfilePage onInfoClick={() => setIsModalOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
          
      </main>


      
      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <InfoModal isOpen={isModalOpen}        onClose={() => setIsModalOpen(false)} 
      />
      <LoginModal
          isOpen={promoLoginOpen}
          onClose={handlePromoClose}
          onLogin={async () => {
            await handlePromoWait();
             if (!settings.directOpenTarget) {
                 setSetting('directOpenTarget', 'apple');
             }
             // Re-trigger direct open check
             if (result) {
                 setSuccess(true);
                 setTimeout(() => setSuccess(false), 1500);
             }
          }}
          title={t.directOpenPromotionTitle}
          description={t.directOpenPromotion}
          t={t}
      />
    </div>
  );
}

export default App;
