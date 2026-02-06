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

import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const { theme, lang, initTheme, initLang, addToHistory, checkCache, setUser, syncData } = useStore();
  const t = I18N[lang];
  
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const lastConvertedUrl = React.useRef('');

  useEffect(() => {
    initTheme();
    initLang();

    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        if (user) {
            syncData(user);
        }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || params.get('url') || params.get('googleMapUrl');
    const name = params.get('name'); // Get name param

    if (query) {
        setUrl(query);
        setTimeout(() => {
            handleConvert(query, name); // Pass name to handler
        }, 500);
    }
  }, []);

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
        min-h-screen flex flex-col items-center w-full mx-auto text-center overflow-hidden transition-all duration-500 ease-out pb-16
        ${result && activeTab === 'home' ? 'bg-black/5' : ''}
    `}>
      
      {/* Main Content Wrapper */}
      <main className={`
          flex-1 w-full flex flex-col px-5
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
                flex w-full z-10 mb-4
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
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
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
              className="w-full flex-1"
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
              className="w-full flex-1"
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
              className="w-full flex-1"
            >
              <ProfilePage onInfoClick={() => setIsModalOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>
          
      </main>


      
      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <InfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default App;
