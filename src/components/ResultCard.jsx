import React, { useState } from 'react';
import { useStore } from '../store';
import { I18N } from '../i18n';

export default function ResultCard({ result }) {
  const { lang, theme } = useStore();
  const t = I18N[lang];
  const { placeName, coords, lat, lon } = result;
  
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const appleUrl = `http://maps.apple.com/?q=${lat},${lon}`;
  const encodedName = encodeURIComponent(placeName || 'Location');
  const naverUrl = `nmap://place?lat=${lat}&lng=${lon}&name=${encodedName}&appname=https%3A%2F%2Fcomap.app`; 

  return (
    <div id="resultCard" className="mt-6 p-6 bg-surface-card backdrop-blur-2xl shadow-ios-lg rounded-[28px] animate-slide-up w-full text-left transition-all duration-300 border border-ios-border">
        <h2 className="text-xl font-semibold mb-1 text-text-primary" id="placeName">
            {placeName}
        </h2>
        
        <div 
            className="text-base text-ios-blue mb-4 cursor-pointer active:opacity-60 transition-opacity duration-200 select-none font-medium"
            onClick={handleCopy}
            title="Click to copy"
        >
            {copied ? t.copied : coords}
        </div>
        
        <div className="flex gap-2.5 mb-5 select-none">
            <a href={appleUrl} className="flex-1 bg-white text-black no-underline rounded-[14px] p-[14px] flex items-center justify-center font-medium text-sm shadow-sm transition-transform duration-100 ease-out active:scale-95 dark:bg-[#3a3a3c] dark:text-white group">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple Maps" className={`w-[18px] h-[18px] mr-[6px] object-contain ${theme === 'light' ? 'invert' : ''}`} />
                Apple Maps
            </a>
             <a href={naverUrl} className="flex-1 bg-[#03C75A] text-white no-underline rounded-[14px] p-[14px] flex items-center justify-center font-medium text-sm shadow-sm transition-transform duration-100 ease-out active:scale-95">
                <img src="https://cdn.brandfetch.io/idy7-U4_1-/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1749526893278" alt="Naver Map" className="w-[18px] h-[18px] mr-[6px] object-contain rounded-[4px] " />
                NAVER Maps
            </a>
        </div>
        
        <div className="rounded-2xl overflow-hidden border border-surface-button bg-surface-button aspect-[16/9]">
            <iframe 
                id="mapFrame" 
                src={`https://www.google.com/maps?q=${lat},${lon}&z=15&output=embed`} 
                loading="lazy" 
                allowFullScreen 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full border-none"
            ></iframe>
        </div>
    </div>
  );
}
