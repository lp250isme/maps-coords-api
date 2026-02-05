import React from 'react';
import { useStore } from '../store';

export default function Header() {
  const { theme } = useStore();
  
  return (
    <div className="flex items-center select-none">
      {theme === 'dark' ? (
           <img src="/icon-dark.png" alt="Icon" className="w-8 h-8 rounded-[8px] shadow-sm" />
      ) : (
           <img src="/icon.png" alt="Icon" className="w-8 h-8 rounded-[8px] shadow-sm" />
      )}
    </div>
  );
}
