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
const getInitialFolders = () => {
    try {
        return JSON.parse(localStorage.getItem('gtc_folders')) || [];
    } catch { return []; }
};

// Firebase Imports
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

export const useStore = create((set, get) => ({
  theme: getInitialTheme(),
  lang: getInitialLang(),
  history: getInitialHistory(),
  favorites: getInitialFavorites(),
  folders: getInitialFolders(),
  user: null, 
  isAuthLoading: true,
  unsubscribeSnapshot: null, // Store unsubscribe function

  setUser: (user) => {
      set({ user });
      if (user) {
          get().subscribeToData(user);
      } else {
          get().unsubscribeData();
      }
  },
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  login: async () => {
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          // setUser will handle subscription
          set({ user });
      } catch (error) {
          console.error("Login failed:", error);
      }
  },

  logout: async () => {
      try {
          get().unsubscribeData(); // Stop listening
          await signOut(auth);
          set({ 
              user: null,
              history: [],
              favorites: [],
              folders: [],
              settings: {} 
          });
          // Clear Local Storage
          localStorage.removeItem('gtc_history');
          localStorage.removeItem('gtc_favorites');
          localStorage.removeItem('gtc_folders');
          localStorage.removeItem('gtc_settings');
          localStorage.removeItem('gtc_user_settings');
          localStorage.removeItem('gtc_direct_open_promotion_seen');
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

              // 5. Merge Folders (Cloud wins or merge unique?)
              // Simple merge: Union
              const cloudFolders = cloudData.folders || [];
              const localFolders = get().folders;
              const mergedFolders = [...new Set([...cloudFolders, ...localFolders])];

              // Update State & LocalStorage
              set({ 
                  favorites: mergedFavorites, 
                  history: mergedHistory,
                  settings: mergedSettings,
                  folders: mergedFolders
                  // Cache isn't in state to avoid re-renders, accessible via localStorage/method
              });
              localStorage.setItem('gtc_folders', JSON.stringify(mergedFolders));
              
              // Write back merged data to Cloud
              await setDoc(userRef, { 
                  favorites: mergedFavorites || [],
                  history: mergedHistory || [],
                  settings: mergedSettings || {},
                  locationCache: mergedCache || {},
                  folders: mergedFolders || []
              }, { merge: true });

          } else {
              // First time: Write Local -> Cloud
              const localCache = JSON.parse(localStorage.getItem('gtc_location_cache')) || {};
              await setDoc(userRef, { 
                  favorites: get().favorites || [],
                  history: get().history || [],
                  settings: get().settings || {}, // Also sync settings
                  locationCache: localCache || {},
                  folders: get().folders || []
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

  unsubscribeData: () => {
      const unsub = get().unsubscribeSnapshot;
      if (unsub) {
          unsub();
          set({ unsubscribeSnapshot: null });
      }
  },

  subscribeToData: (user) => {
      if (!user) return;
      get().unsubscribeData(); // Clear existing

      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
              const cloudData = docSnap.data();
              // Verify if data is actually different to avoid loop (though setState usually handles strict equality)
              // Actually, we want to MERGE cloud data with local if it's newer or just replace?
              // Standard real-time pattern: Cloud is truth.
              // BUT we have local pending writes potentially. 
              // To keep it simple and effective: We will just update store from Cloud.
              // Logic from syncData can be adapted here, but simpler.
              set(state => {
                  const cloudFavorites = cloudData.favorites || [];
                  const cloudHistory = cloudData.history || [];
                  const cloudFolders = cloudData.folders || [];
                  const cloudSettings = cloudData.settings || {};
                  
                  // Local Storage Sync (Effect)
                  localStorage.setItem('gtc_favorites', JSON.stringify(cloudFavorites));
                  localStorage.setItem('gtc_history', JSON.stringify(cloudHistory));
                  localStorage.setItem('gtc_folders', JSON.stringify(cloudFolders));
                  localStorage.setItem('gtc_settings', JSON.stringify({ ...state.settings, ...cloudSettings }));

                  return {
                      favorites: cloudFavorites,
                      history: cloudHistory,
                      folders: cloudFolders,
                      settings: { ...state.settings, ...cloudSettings }
                  };
              });
          }
      }, (error) => {
          console.error("Real-time sync error:", error);
      });
      
      set({ unsubscribeSnapshot: unsubscribe });
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
          cache[originalUrl] = item;
          localStorage.setItem('gtc_location_cache', JSON.stringify(cache));
      }

      // Cloud Sync
      const user = state.user;
      if (user) {
          const userRef = doc(db, "users", user.uid);
          const cache = JSON.parse(localStorage.getItem('gtc_location_cache')) || {};
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

  addFavorite: (item, customName, folder = null) => set((state) => {
      const filtered = state.favorites.filter(f => f.coords !== item.coords);
      const newItem = { ...item, customName: customName, folder: folder }; 
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
      showMapPreview: true,
      startPage: 'home', // home, favorites, history
      directOpenTarget: null // null (off), 'apple', 'naver'
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
  }),

  setSetting: (key, value) => set((state) => {
      const newSettings = { ...state.settings, [key]: value };
      localStorage.setItem('gtc_settings', JSON.stringify(newSettings));
      
      const user = state.user;
      if (user) {
          setDoc(doc(db, "users", user.uid), { settings: newSettings }, { merge: true }).catch(console.error);
      }

      return { settings: newSettings };
  }),

  // Folder Actions
  addFolder: (folderName) => set((state) => {
      if (state.folders.includes(folderName)) return {};
      const newFolders = [...state.folders, folderName];
      localStorage.setItem('gtc_folders', JSON.stringify(newFolders));
      
      const user = state.user;
      if (user) {
          const cleanFolders = JSON.parse(JSON.stringify(newFolders));
          setDoc(doc(db, "users", user.uid), { folders: cleanFolders }, { merge: true }).catch(console.error);
      }
      return { folders: newFolders };
  }),

  removeFolder: (folderName) => set((state) => {
      const newFolders = state.folders.filter(f => f !== folderName);
      
      // Also remove folder from items in that folder (move to uncategorized)
      const newFavorites = state.favorites.map(f => {
          if (f.folder === folderName) {
              return { ...f, folder: null };
          }
          return f;
      });

      localStorage.setItem('gtc_folders', JSON.stringify(newFolders));
      localStorage.setItem('gtc_favorites', JSON.stringify(newFavorites));
      
      const user = state.user;
      if (user) {
          const cleanFolders = JSON.parse(JSON.stringify(newFolders));
          const cleanFavorites = JSON.parse(JSON.stringify(newFavorites));
          setDoc(doc(db, "users", user.uid), { folders: cleanFolders, favorites: cleanFavorites }, { merge: true }).catch(console.error);
      }
      return { folders: newFolders, favorites: newFavorites };
  }),

  moveToFolder: (coords, folderName) => set((state) => {
      const newFavorites = state.favorites.map(f => {
          if (f.coords === coords) {
              return { ...f, folder: folderName };
          }
          return f;
      });
      
      localStorage.setItem('gtc_favorites', JSON.stringify(newFavorites));
      
      const user = state.user;
      if (user) {
          const cleanFavorites = JSON.parse(JSON.stringify(newFavorites));
          setDoc(doc(db, "users", user.uid), { favorites: cleanFavorites }, { merge: true }).catch(console.error);
      }
      return { favorites: newFavorites };
  }),

  renameFolder: (oldName, newName) => set((state) => {
      if (!newName.trim() || oldName === newName) return {};
      if (state.folders.includes(newName)) return {}; // Don't allow duplicate names
      
      const newFolders = state.folders.map(f => f === oldName ? newName : f);
      const newFavorites = state.favorites.map(f => ({
          ...f,
          folder: f.folder === oldName ? newName : f.folder
      }));
      
      localStorage.setItem('gtc_folders', JSON.stringify(newFolders));
      localStorage.setItem('gtc_favorites', JSON.stringify(newFavorites));
      
      const user = state.user;
      if (user) {
          // Sanitize to remove undefined values
          const cleanFolders = JSON.parse(JSON.stringify(newFolders));
          const cleanFavorites = JSON.parse(JSON.stringify(newFavorites));
          setDoc(doc(db, "users", user.uid), { folders: cleanFolders, favorites: cleanFavorites }, { merge: true }).catch(console.error);
      }
      return { folders: newFolders, favorites: newFavorites };
  })
}));
