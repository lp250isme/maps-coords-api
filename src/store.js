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

// Helper to get initial data
const getInitialHistory = () => {
    try {
        return JSON.parse(localStorage.getItem('gtc_history')) || [];
    } catch { return []; }
};
const getInitialFavorites = () => {
    try {
        return JSON.parse(localStorage.getItem('gtc_favorites')) || [];
    } catch { return []; }
};

export const useStore = create((set) => ({
  theme: getInitialTheme(),
  lang: getInitialLang(),
  history: getInitialHistory(),
  favorites: getInitialFavorites(),
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gtc_theme', newTheme);
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

  addToHistory: (item) => set((state) => {
      // Avoid duplicates based on coords
      const filtered = state.history.filter(i => i.coords !== item.coords);
      const newHistory = [item, ...filtered].slice(0, 20); // Keep last 20
      localStorage.setItem('gtc_history', JSON.stringify(newHistory));
      return { history: newHistory };
  }),

  clearHistory: () => set(() => {
      localStorage.removeItem('gtc_history');
      return { history: [] };
  }),

  toggleFavorite: (item) => set((state) => {
      const exists = state.favorites.find(f => f.coords === item.coords);
      let newFavorites;
      if (exists) {
          newFavorites = state.favorites.filter(f => f.coords !== item.coords);
      } else {
          newFavorites = [item, ...state.favorites];
      }
      localStorage.setItem('gtc_favorites', JSON.stringify(newFavorites));
      return { favorites: newFavorites };
  }),
  
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
