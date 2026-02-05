import React, { useEffect, useState } from 'react';
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
      const res = await fetch(`/api?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Coords not found' || res.status === 404) {
           throw new Error(t.pleaseCopyFromShare);
        }
        throw new Error(data.error || t.errorFetching);
      }

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
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);

    } catch (err) {
      setError(err.message);
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
        <InputSection url={url} setUrl={setUrl} />
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
