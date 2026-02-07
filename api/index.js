module.exports = async function handler(req, res) {
  console.log('⚡️ API Request received. Params:', req.query);
  const { url, apiKey, api } = req.query
  const queryKey = apiKey || api;
  
  if (!url) return res.status(400).json({ error: 'Missing url' })
  
  // Enforce API Key for all API requests
  // if (!queryKey) {
  //     return res.status(401).json({ error: 'API Key is required' });
  // }

  if (!url.includes('google') && !url.includes('goo.gl')) {
      return res.status(400).json({ error: 'Not a Google Maps URL' })
  }

const axios = require('axios');
const { initializeApp, getApps, getApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Singleton-like initialization for Vercel/Node
let app;
let auth;
let db;

function initFirebase() {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
}

async function serverLogin() {
    initFirebase();
    if (!auth.currentUser) {
        const email = process.env.SERVER_WORKER_EMAIL;
        const password = process.env.SERVER_WORKER_PASSWORD;
        if (email && password) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                console.log("✅ Server Worker Logged In");
            } catch (e) {
                console.error("❌ Server Login Failed:", e.message);
            }
        } else {
            console.warn("⚠️ Missing SERVER_WORKER_EMAIL or PASSWORD env vars");
        }
    }
}

const MAX_GLOBAL_RETRIES = 20;

// Regex Constants
const REGEX_COORDS = /^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/;
const REGEX_PRELOAD_LINK = /<link\s+[^>]*href="(\/search\?[^"]*tbm=map[^"]*)"/;
const REGEX_PREVIEW_LINK = /<link\s+[^>]*href="(\/maps\/preview\/place\?[^"]+)"/;
const REGEX_RPC_STRICT = /\[\s*null\s*,\s*null\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/;
const REGEX_RPC_FALLBACK = /\[\s*\d+(?:\.\d+)?\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/;
const REGEX_TITLE = /<title>(.*?)<\/title>/;
const REGEX_OG_TITLE = /<meta\s+property="og:title"\s+content="(.*?)"/;

let globalBestPlaceName = null;

const USER_AGENTS = require('./userAgents');

const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create axios instance with default config
const createClient = () => axios.create({
  timeout: 6000,
  maxRedirects: 0, // Manual redirect handling
  validateStatus: status => status >= 200 && status < 400
});

async function tryFetchCoords(targetUrl, attemptIndex) {
    let current = targetUrl
    let innerAttempt = 0
    const MAX_INNER_ATTEMPTS = 4  
    let localPlaceName = null

    try {
      while (innerAttempt < MAX_INNER_ATTEMPTS) {
        innerAttempt++
        const urlName = extractPlaceName(current)
        if (urlName) localPlaceName = urlName

        const client = createClient();
        
        let r;
        try {
          r = await client.get(current, {
            headers: {
              'User-Agent': getRandomUA(),
              'Accept-Language': 'zh-TW,en-US;q=0.9'
            }
          });
        } catch (err) {
           if (err.response && (err.response.status === 301 || err.response.status === 302)) {
               r = err.response;
           } else {
               throw err;
           }
        }

        const locationHeader = r.headers['location'] || r.headers['Location']
        
        const redirectFtid = locationHeader ? getFtid(locationHeader) : null
        if (redirectFtid) {
          current = `https://www.google.com/maps?ftid=${redirectFtid}&hl=zh-TW`
          continue
        }

        if (locationHeader) {
          current = locationHeader.startsWith('/') ? new URL(current).origin + locationHeader : locationHeader
          continue
        }

        if (r.status !== 200) break
        const html = typeof r.data === 'string' ? r.data : JSON.stringify(r.data)

        const htmlName = extractPlaceName(current, html)
        if (htmlName) localPlaceName = htmlName

        if (localPlaceName) globalBestPlaceName = localPlaceName;

        const preloadLinkMatch = html.match(REGEX_PRELOAD_LINK);
        if (preloadLinkMatch) {
            try {
                const rawUrl = preloadLinkMatch[1].replace(/amp;/g, '');
                const linkUrl = new URL(`https://www.google.com${rawUrl}`);
                const q = linkUrl.searchParams.get('q');
                if (q) {
                    const coordMatch = decodeURIComponent(q).match(REGEX_COORDS);
                    if (coordMatch) {
                        console.log(`✅ [Try ${attemptIndex}] Found Priority 0 coords: ${q}`);
                        const [lat, lon] = normalizeCoords(parseFloat(coordMatch[1]), parseFloat(coordMatch[3]));
                        return { lat, lon, name: globalBestPlaceName };
                    }
                }
            } catch (e) {}
        }

        const previewLinkMatch = html.match(REGEX_PREVIEW_LINK)

        if (previewLinkMatch) {
          const rpcUrl = `https://www.google.com${previewLinkMatch[1].replace(/amp;/g, '')}`
          
          try {
            const rpcRes = await client.get(rpcUrl, {
              headers: { 'User-Agent': getRandomUA(), Referer: current }
            });

            const rpcText = typeof rpcRes.data === 'string' ? rpcRes.data : JSON.stringify(rpcRes.data)
            let parsedData = null;

            try {
                const cleanJson = rpcText.replace(/^\)]}'/, '').trim();
                parsedData = JSON.parse(cleanJson);
                const rpcName = parsedData?.[6]?.[11];
                if (rpcName && typeof rpcName === 'string') {
                    globalBestPlaceName = rpcName; 
                }
            } catch (e) {}

            const strictMatch = rpcText.match(REGEX_RPC_STRICT)
            if (strictMatch) {
              console.log(`✅ [Try ${attemptIndex}] Found Priority 1 strict coords`)
              const [lat, lon] = normalizeCoords(strictMatch[1], strictMatch[2]);
              return { lat, lon, name: globalBestPlaceName };
            }

            if (parsedData && isValidCoordArray(parsedData[0])) {
               console.log(`✅ [Try ${attemptIndex}] Found Priority 2 JSON coords`);
               const [lat, lon] = normalizeCoords(parsedData[0][0], parsedData[0][1]);
               return { lat, lon, name: globalBestPlaceName };
            }

            if (parsedData && Array.isArray(parsedData[1]) && isValidCoordArray(parsedData[1][0])) {
               console.log(`✅ [Try ${attemptIndex}] Found Priority 3 JSON coords`);
               const [lat, lon] = normalizeCoords(parsedData[1][0][0], parsedData[1][0][1]);
               return { lat, lon, name: globalBestPlaceName };
            }

            if (parsedData && Array.isArray(parsedData[4]) && Array.isArray(parsedData[4][0]) && parsedData[4][0].length >= 3) {
                const targetArr = parsedData[4][0];
                const rawLon = parseFloat(targetArr[1]);
                const rawLat = parseFloat(targetArr[2]);
                
                if (!isNaN(rawLon) && !isNaN(rawLat) && (rawLon !== 0 || rawLat !== 0)) {
                    console.log(`✅ [Try ${attemptIndex}] Found Priority 4 JSON coords: ${rawLat}, ${rawLon}`);
                    const [lat, lon] = normalizeCoords(rawLon, rawLat);
                    return { lat, lon, name: globalBestPlaceName };
                }
            }

            const fallbackMatch = rpcText.match(REGEX_RPC_FALLBACK)
            if (fallbackMatch) {
                console.log(`✅ [Try ${attemptIndex}] Found Priority 5 Viewport coords`)
                const [lat, lon] = normalizeCoords(fallbackMatch[1], fallbackMatch[2]);
                return { lat, lon, name: globalBestPlaceName };
            }
          } catch (e) {
              // RPC fetch failed, continue loop
          }
        }
        if (!locationHeader && !previewLinkMatch) break; 
      }
    } catch (err) {
        console.error(`⚠️ Attempt ${attemptIndex} Error:`, err.message);
    }
    return null; 
}

    // 1. Enforce API Key Validation if provided
    let userData = null;
    let uid = null;

    if (queryKey !== undefined) {
        if (!queryKey.trim()) {
            return res.status(401).json({ error: 'API Key is missing' });
        }

        await serverLogin();
        if (auth && auth.currentUser) {
            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('apiKey', '==', queryKey));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const userDoc = snapshot.docs[0];
                    uid = userDoc.id;
                    userData = userDoc.data();
                } else {
                    console.warn(`⚠️ [API] Invalid API Key: ${queryKey}`);
                    return res.status(401).json({ error: 'Invalid API Key' });
                }
            } catch (err) {
                console.error("❌ [API] DB Error:", err);
                return res.status(500).json({ error: 'Database Error' });
            }
        }
    }

    try {
        for (let i = 1; i <= MAX_GLOBAL_RETRIES; i++) {
            console.log(`\n🚀 GLOBAL TRY ${i}/${MAX_GLOBAL_RETRIES} for: ${url}`);
            
            const result = await tryFetchCoords(url, i);
            
            if (result && result.lat && result.lon) {
                let mobileRedirectUrl = null;
                
                // If we have authenticated user data, check settings and log history
                if (userData) {
                     // Check for Direct Open setting
                     if (userData.settings?.directOpenTarget === 'apple') {
                         mobileRedirectUrl = `http://maps.apple.com/?q=${result.lat},${result.lon}`;
                     }
                     else if (userData.settings?.directOpenTarget === 'naver') {
                         const protocol = req.headers['x-forwarded-proto'] || 'http';
                         const host = req.headers['x-forwarded-host'] || req.headers.host;
                         const baseUrl = `${protocol}://${host}`;
                         const encodedName = encodeURIComponent(result.name || "Location");
                         const encodedCallback = encodeURIComponent(`${baseUrl}/`);
                         mobileRedirectUrl = `nmap://place?lat=${result.lat}&lng=${result.lon}&name=${encodedName}&appname=${encodedCallback}`;
                     }
 
                     // Create history item
                     const newItem = {
                         coords: `${result.lat},${result.lon}`,
                         placeName: result.name || `${result.lat}, ${result.lon}`,
                         lat: result.lat,
                         lon: result.lon,
                         timestamp: Date.now()
                     };
                     
                     // Get existing history to prepend
                     const currentHistory = userData.history || [];
                     const filtered = currentHistory.filter(h => h.coords !== newItem.coords);
                     const newHistory = [newItem, ...filtered].slice(0, 100); 
                     
                     const userDocRef = doc(db, "users", uid);
                     await updateDoc(userDocRef, { history: newHistory });
                     console.log(`✅ [API] Logged history for user ${uid}`);
                     if (mobileRedirectUrl) console.log(`↪️ [API] Redirect target: ${userData.settings.directOpenTarget}`);
                }
    
                return sendResult(res, result.lat, result.lon, result.name, mobileRedirectUrl);
            }

        if (i < MAX_GLOBAL_RETRIES) {
            // Cap wait time to 1500ms to allow 20 retries within timeout limits
            const rawWaitTime = 800 * Math.pow(1.5, i - 1);
            const waitTime = Math.min(rawWaitTime, 1500); 
            console.log(`⏳ Coords not found in try ${i}. Waiting ${Math.round(waitTime)}ms to retry with new UA...`);
            await sleep(waitTime);
        }
    }

    console.log('❌ All global retries exhausted.');
    
    // Headless Fallback for exhausted retries
    // REMOVED: Restore JSON-only response as requested
    
    return sendResult(res, null, null, globalBestPlaceName);

} catch (err) {
    console.error('Critical Error:', err.message)
    // Headless Error Fallback
    // REMOVED: Restore JSON-only response as requested

    return res.status(500).json({ error: 'Server Error', placeName: globalBestPlaceName || "" })
}

function sendResult(res, lat, lon, name, redirectUrl = null) {
  const format = val => parseFloat(val).toFixed(6)
  const coords = lat && lon ? `${format(lat)},${format(lon)}` : null
  
  let finalName = name;
  if (!finalName) {
      try {
          const u = new URL(url)
          const q = u.searchParams.get('q')
          if (q) finalName = q
      } catch (e) {}
  }
  if (finalName && (finalName.includes('Google Maps') || finalName.includes('Google 地圖'))) {
      finalName = null;
  }
  const safePlaceName = finalName || "";

  if (coords || safePlaceName) {
    return res.status(200).json({ 
        coords, 
        placeName: safePlaceName,
        redirect: redirectUrl // Headless Auth Smart Redirect
    })
  } else {
    return res.status(404).json({ error: 'Coords not found', placeName: "" })
  }
}

function normalizeCoords(v1, v2) {
    const num1 = parseFloat(v1);
    const num2 = parseFloat(v2);
    if (Math.abs(num1) > Math.abs(num2)) return [num2, num1]; 
    return [num1, num2];
}

function isValidCoordArray(arr) {
    return Array.isArray(arr) && arr.length >= 2 && 
           !isNaN(parseFloat(arr[0])) && !isNaN(parseFloat(arr[1]));
}

function extractPlaceName(currentUrl, htmlContent = '') {
  try {
    const u = new URL(currentUrl)
    let name = u.searchParams.get('q') || u.searchParams.get('query')
    if (name && !name.match(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)) return name

    if (currentUrl.includes('/place/')) {
      const parts = u.pathname.split('/place/')
      if (parts[1]) return decodeURIComponent(parts[1].split('/')[0]).replace(/\+/g, ' ')
    }

    if (htmlContent) {
      const titleMatch = htmlContent.match(REGEX_TITLE)
      if (titleMatch && titleMatch[1]) {
        let title = titleMatch[1].replace(' - Google Maps', '').replace(' - Google 地圖', '').trim()
        if (title && title !== 'Google Maps' && title !== 'Google 地圖') return title
      }
      const ogTitleMatch = htmlContent.match(REGEX_OG_TITLE)
      if (ogTitleMatch && ogTitleMatch[1]) {
           let ogTitle = ogTitleMatch[1];
           if (ogTitle !== 'Google Maps' && ogTitle !== 'Google 地圖') return ogTitle;
      }
    }
  } catch (e) {}
  return null
}

function getFtid(urlStr) {
  try {
    const u = new URL(urlStr)
    return u.searchParams.get('ftid')
  } catch (e) { return null }
}
}