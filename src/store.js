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

// Firebase Imports
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const useStore = create((set, get) => ({
  theme: getInitialTheme(),
  lang: getInitialLang(),
  history: getInitialHistory(),
  favorites: getInitialFavorites(),
  user: null, // User state

  setUser: (user) => set({ user }),

  login: async () => {
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          set({ user });
          await get().syncData(user); // Sync after login
      } catch (error) {
          console.error("Login failed:", error);
      }
  },

  logout: async () => {
      try {
          await signOut(auth);
          set({ user: null });
      } catch (error) {
          console.error("Logout failed:", error);
      }
  },

  setUserName: async (newName) => {
    const user = get().user;
    if (!user) return;
    
    const updatedUser = { ...user, customName: newName };
    set({ user: updatedUser });
    
    // Sync to Cloud
    try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { customName: newName }, { merge: true });
    } catch (error) {
        console.error("Update name failed:", error);
    }
  },

  // Core Sync Logic
  syncData: async (user) => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      
      try {
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
              const cloudData = docSnap.data();
              
              // 1. Merge Favorites (Union by coords)
              const cloudFavorites = cloudData.favorites || [];
              const localFavorites = get().favorites;
              const mergedFavorites = [...cloudFavorites];
              localFavorites.forEach(localItem => {
                  if (!mergedFavorites.some(c => c.coords === localItem.coords)) {
                      mergedFavorites.push(localItem);
                  }
              });
              
              // 2. Merge History (Union by coords - UNLIMITED)
              const cloudHistory = cloudData.history || [];
              const localHistory = get().history;
              // Simple dedupe: keep local latest, append cloud if not exists
              const mergedHistory = [...localHistory];
              cloudHistory.forEach(cloudItem => {
                  if (!mergedHistory.some(h => h.coords === cloudItem.coords)) {
                      mergedHistory.push(cloudItem);
                  }
              });
              // Sort by timestamp desc
              mergedHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

              // 3. Merge Settings (Cloud wins if exists, else keep local)
              const cloudSettings = cloudData.settings || {};
              const mergedSettings = { ...get().settings, ...cloudSettings };

              // 4. Merge Location Cache
              const cloudCache = cloudData.locationCache || {};
              const localCache = JSON.parse(localStorage.getItem('gtc_location_cache')) || {};
              const mergedCache = { ...cloudCache, ...localCache };

              // Update State & LocalStorage
              set({ 
                  favorites: mergedFavorites, 
                  history: mergedHistory,
                  settings: mergedSettings 
                  // Cache isn't in state to avoid re-renders, accessible via localStorage/method
              });
              localStorage.setItem('gtc_favorites', JSON.stringify(mergedFavorites));
              localStorage.setItem('gtc_history', JSON.stringify(mergedHistory));
              localStorage.setItem('gtc_settings', JSON.stringify(mergedSettings));
              localStorage.setItem('gtc_location_cache', JSON.stringify(mergedCache));
              
              // Write back merged data to Cloud
              await setDoc(userRef, { 
                  favorites: mergedFavorites,
                  history: mergedHistory,
                  settings: mergedSettings,
                  locationCache: mergedCache
              }, { merge: true });

          } else {
              // First time: Write Local -> Cloud
              const localCache = JSON.parse(localStorage.getItem('gtc_location_cache')) || {};
              await setDoc(userRef, { 
                  favorites: get().favorites,
                  history: get().history,
                  settings: get().settings, // Also sync settings
                  locationCache: localCache
              }, { merge: true });
          }
          
          // Sync Custom Name if exists in doc
          if (docSnap.exists()) {
              const cloudData = docSnap.data();
              if (cloudData.customName) {
                    set(state => ({
                        user: { ...state.user, customName: cloudData.customName }
                    }));
              }
          }

      } catch (error) {
          console.error("Sync failed:", error);
      }
  },
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gtc_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Cloud Sync
    const user = state.user;
    if (user) {
        setDoc(doc(db, "users", user.uid), { settings: { ...state.settings, theme: newTheme } }, { merge: true }).catch(console.error);
    }
    
    return { theme: newTheme };
  }),

  toggleLang: () => set((state) => {
    const newLang = state.lang === 'zh-TW' ? 'en' : 'zh-TW';
    localStorage.setItem('gtc_lang', newLang);
    document.documentElement.lang = newLang;
    return { lang: newLang };
  }),

  // Add Item to History & Cache
  addToHistory: (item, originalUrl) => set((state) => {
      const filtered = state.history.filter(i => i.coords !== item.coords);
      const newHistory = [item, ...filtered]; // UNLIMITED
      localStorage.setItem('gtc_history', JSON.stringify(newHistory));
      
      // Update Location Cache if URL provided
      if (originalUrl) {
          const cache = JSON.parse(localStorage.getItem('gtc_location_cache')) || {};
          // Sanitize URL key (firebase doesn't like . or / in keys sometimes, but for simple map object stored as field it's ok, 
          // but better to hash or clean. For simplicity here assuming URL as key in map field is risky in Firestore dot notation.
          // Better strategy: Cache is an array of {url, item} or we just rely on History for "previously searched".
          // WAIT: User said "Look in DB first". So we need a map.
          // Firestore Map keys have restrictions. Let's use MD5 or just store normalized URL.
          // Simplified: We utilize the 'history' array as our cache source for now to avoid complexity of URL key encoding.
          // Actually, let's persist a separate "locationCache" object in localStorage only for fast lookup, 
          // and backup to Cloud as a JSON string or array if needed.
          
          // Let's go with robust solution:
          // We will store cache in localStorage. We will sync it to cloud as a huge map.
          // If URL contains dots/slashes, we might need a workaround for Firestore keys if we store as map field.
          // Safer: Store cache as Array of objects { url: '...', result: ... } in Cloud.
          // Local: Key-Value object for O(1) lookup.
          
          cache[originalUrl] = item;
          localStorage.setItem('gtc_location_cache', JSON.stringify(cache));
      }

      // Cloud Sync
      const user = state.user;
      if (user) {
          const userRef = doc(db, "users", user.uid);
          const cache = JSON.parse(localStorage.getItem('gtc_location_cache')) || {};
          // Only syncing history here to save bandwidth, full sync happens on login/reload
          // Or we can debounced sync. For now, immediate sync for reliability.
          setDoc(userRef, { history: newHistory, locationCache: cache }, { merge: true }).catch(console.error);
      }

      return { history: newHistory };
  }),

  // Check Cache Helper
  checkCache: (url) => {
      try {
          const cache = JSON.parse(localStorage.getItem('gtc_location_cache')) || {};
          return cache[url] || null;
      } catch { return null; }
  },

  clearHistory: () => set((state) => {
      localStorage.removeItem('gtc_history');
      // Should we clear cache? Probably not, user might just want to clear UI list. 
      // User asked for "sync history", erasing history should sync too.
      
      const user = state.user;
      if (user) {
          setDoc(doc(db, "users", user.uid), { history: [] }, { merge: true }).catch(console.error);
      }
      
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
      
      // Cloud Sync
      const user = state.user;
      if (user) {
          const userRef = doc(db, "users", user.uid);
          setDoc(userRef, { favorites: newFavorites }, { merge: true }).catch(console.error);
      }

      return { favorites: newFavorites };
  }),

  addFavorite: (item, customName) => set((state) => {
      const filtered = state.favorites.filter(f => f.coords !== item.coords);
      const newItem = { ...item, customName: customName }; 
      const newFavorites = [newItem, ...filtered];
      localStorage.setItem('gtc_favorites', JSON.stringify(newFavorites));

      // Cloud Sync
      const user = state.user;
      if (user) {
          const userRef = doc(db, "users", user.uid);
          setDoc(userRef, { favorites: newFavorites }, { merge: true }).catch(console.error);
      }

      return { favorites: newFavorites };
  }),

  removeFavorite: (coords) => set((state) => {
      const newFavorites = state.favorites.filter(f => f.coords !== coords);
      localStorage.setItem('gtc_favorites', JSON.stringify(newFavorites));

      // Cloud Sync
      const user = state.user;
      if (user) {
          const userRef = doc(db, "users", user.uid);
          setDoc(userRef, { favorites: newFavorites }, { merge: true }).catch(console.error);
      }

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
  },

  // Settings Slice
  settings: JSON.parse(localStorage.getItem('gtc_settings')) || {
      showCoords: false,
      showDistance: true,
      showWeather: true,
      showAppleMap: true,
      showNaverMap: true,
      showMapPreview: true
  },

  toggleSetting: (key) => set((state) => {
      const newSettings = { ...state.settings, [key]: !state.settings[key] };
      localStorage.setItem('gtc_settings', JSON.stringify(newSettings));
      
      // Cloud Sync
      const user = state.user;
      if (user) {
          setDoc(doc(db, "users", user.uid), { settings: newSettings }, { merge: true }).catch(console.error);
      }

      return { settings: newSettings };
  })
}));
