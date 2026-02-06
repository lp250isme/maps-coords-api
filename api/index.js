module.exports = async function handler(req, res) {
  const { url } = req.query
  
  if (!url) return res.status(400).json({ error: 'Missing url' })
  if (!url.includes('google') && !url.includes('goo.gl')) {
      return res.status(400).json({ error: 'Not a Google Maps URL' })
  }

const axios = require('axios');

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

try {
    for (let i = 1; i <= MAX_GLOBAL_RETRIES; i++) {
        console.log(`\n🚀 GLOBAL TRY ${i}/${MAX_GLOBAL_RETRIES} for: ${url}`);
        
        const result = await tryFetchCoords(url, i);
        
        if (result && result.lat && result.lon) {
            return sendResult(res, result.lat, result.lon, result.name);
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
    return sendResult(res, null, null, globalBestPlaceName);

} catch (err) {
    console.error('Critical Error:', err.message)
    return res.status(500).json({ error: 'Server Error', placeName: globalBestPlaceName || "" })
}

function sendResult(res, lat, lon, name) {
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
    return res.status(200).json({ coords, placeName: safePlaceName })
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