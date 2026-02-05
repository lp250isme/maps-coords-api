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

function App() {
  const { theme, lang, initTheme, initLang } = useStore();
  const t = I18N[lang];
  
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lastConvertedUrl = React.useRef('');

  useEffect(() => {
    initTheme();
    initLang();
  }, []);

  const handleConvert = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setSuccess(false);
    setError('');
    setResult(null);

    // Simulate map frame reset
    // In React we just conditionally render or update props

    try {
      const res = await axios.get('/api', {
        params: { url: url.trim() }
      });
      const data = res.data;

      // axios throws on non-2xx by default, but we'll check just in case or handle catch block
      const { coords, placeName } = data;
      
      if (!coords) {
         throw new Error(t.pleaseCopyFromShare);
      }

      // Parse coords
      const [lat, lon] = coords.replace(/\s/g, '').split(',');

      setResult({
        coords,
        placeName: placeName || t.unknownPlace,
        lat,
        lon
      });
      
      lastConvertedUrl.current = url.trim();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);

    } catch (err) {
      // Axios error handling
      if (err.response) {
          const { status, data } = err.response;
          if (status === 404 || data.error === 'Coords not found') {
              setError(t.pleaseCopyFromShare);
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

      {error && <p className="text-[#FF3B30] text-sm mt-3 animate-slide-up">{error}</p>}
      
      {result && (
        <ResultCard result={result} />
      )}
      
      <InfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default App;
