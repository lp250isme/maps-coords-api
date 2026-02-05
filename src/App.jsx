import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from './store';
import { I18N } from './i18n';
import Header from './components/Header';
import Controls from './components/Controls';
import InputSection from './components/InputSection';
import ConvertButton from './components/ConvertButton';
import ResultCard from './components/ResultCard';
import InfoModal from './components/InfoModal';
import HistoryModal from './components/HistoryModal';

function App() {
  const { theme, lang, initTheme, initLang, addToHistory } = useStore();
  const t = I18N[lang];
  
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const lastConvertedUrl = React.useRef('');

  useEffect(() => {
    initTheme();
    initLang();
  }, []);

  // Handle URL Params (Quick Share)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || params.get('url');
    if (query) {
        setUrl(query);
        // Small delay to ensure state and handlers are ready
        setTimeout(() => {
            handleConvert(query);
        }, 500);
    }
  }, []);

  const handleConvert = async (directUrl) => {
    const inputUrl = typeof directUrl === 'string' ? directUrl : url;
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setSuccess(false);
    setError('');
    setResult(null);

    // Regex for Lat,Lon (Simple validation: "num, num")
    const coordsRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = inputUrl.trim().match(coordsRegex);

    if (match) {
        // Reverse Geocoding Mode (Direct Coords)
        const lat = match[1];
        const lon = match[3];
        const coords = `${lat},${lon}`;
        
        const resultItem = {
            coords,
            placeName: `${lat}, ${lon}`, // Use coords as name for direct mode
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

    // Standard URL Mode
    try {
      const res = await axios.get('/api', {
        params: { url: inputUrl.trim() }
      });
      const data = res.data;

      const { coords, placeName } = data;
      
      if (!coords) {
         throw new Error(t.pleaseCopyFromShare);
      }

      // Parse coords
      const [lat, lon] = coords.replace(/\s/g, '').split(',');

      const resultItem = {
        coords,
        placeName: placeName || t.unknownPlace,
        lat,
        lon,
        timestamp: Date.now()
      };

      setResult(resultItem);
      addToHistory(resultItem);
      
      lastConvertedUrl.current = inputUrl.trim();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);

    } catch (err) {
      // Axios error handling
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

  return (
    <div className="container min-h-screen flex flex-col justify-start items-center pt-[100px] px-6 pb-10 w-full max-w-[500px] mx-auto text-center">
      <Controls 
        onInfoClick={() => setIsModalOpen(true)}
        onHistoryClick={() => setIsHistoryOpen(true)}
      />
      
      <Header />
      
      <div className="input-group relative mb-5 flex items-stretch gap-3 h-[52px]">
        <InputSection 
            url={url} 
            setUrl={setUrl} 
            onAutoPaste={(pastedText) => {
                if (pastedText && pastedText.trim() !== lastConvertedUrl.current) {
                    // Slight timeout to allow state to settle if needed, but we can also
                    // call conversion directly with the pasted text if we refactor handleConvert
                    // For now, let's update state then trigger.
                    setUrl(pastedText);
                    setTimeout(() => document.getElementById('convertBtn')?.click(), 100);
                }
            }}
        />
        <ConvertButton 
            onClick={handleConvert} 
            loading={isLoading} 
            success={success} 
            disabled={!url.trim() || isLoading || success}
        />
      </div>

      {error && !result && <p className="text-[#FF3B30] text-sm mt-3 animate-slide-up">{error}</p>}
      
      {result && (
        <ResultCard result={result} />
      )}
      
      <InfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <HistoryModal 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
          onSelect={(item) => {
              setResult({
                  coords: item.coords,
                  placeName: item.placeName,
                  lat: item.lat,
                  lon: item.lon
              });
              // Optional: Clear URL or set it if we stored it
              setSuccess(true);
              setTimeout(() => setSuccess(false), 1500);
          }}
      />
    </div>
  );
}

export default App;
