import { create } from 'zustand';

// Helper to get initial theme
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('gtc_theme');
  if (savedTheme) return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Helper to get initial lang
const getInitialLang = () => {
    const savedLang = localStorage.getItem('gtc_lang');
    if (savedLang) return savedLang;
    const systemLang = (navigator.language || navigator.userLanguage).toLowerCase();
    return (systemLang.includes('zh') || systemLang.includes('tw')) ? 'zh-TW' : 'en';
};

export const useStore = create((set) => ({
  theme: getInitialTheme(),
  lang: getInitialLang(),
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gtc_theme', newTheme);
    // Directly update DOM class for Tailwind dark mode
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),

  toggleLang: () => set((state) => {
    const newLang = state.lang === 'zh-TW' ? 'en' : 'zh-TW';
    localStorage.setItem('gtc_lang', newLang);
    document.documentElement.lang = newLang;
    return { lang: newLang };
  }),
  
  // Initialize theme on store creation (not typical for Zustand but we can do side effects here or in App)
  initTheme: () => {
     const theme = getInitialTheme();
     if (theme === 'dark') document.documentElement.classList.add('dark');
     else document.documentElement.classList.remove('dark');
  }, 
  
  initLang: () => {
      const lang = getInitialLang();
      document.documentElement.lang = lang;
  }
}));
