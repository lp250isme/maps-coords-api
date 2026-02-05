module.exports = async function handler(req, res) {
  const { url } = req.query
  
  if (!url) return res.status(400).json({ error: 'Missing url' })
  if (!url.includes('google') && !url.includes('goo.gl')) {
      return res.status(400).json({ error: 'Not a Google Maps URL' })
  }

  const MAX_GLOBAL_RETRIES = 3;
  
  let globalBestPlaceName = null;

  const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  ];
  
  const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithTimeout = async (url, options = {}, timeout = 6000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(id);
    }
  };

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

          const r = await fetchWithTimeout(current, {
            redirect: 'manual',
            headers: {
              'User-Agent': getRandomUA(),
              'Accept-Language': 'zh-TW,en-US;q=0.9'
            }
          }, 6000)

          const locationHeader = r.headers.get('location')
          
          const redirectFtid = locationHeader ? getFtid(locationHeader) : null
          if (redirectFtid) {
            current = `https://www.google.com/maps?ftid=${redirectFtid}&hl=zh-TW`
            continue
          }

          if (locationHeader) {
            current = locationHeader.startsWith('/') ? new URL(current).origin + locationHeader : locationHeader
            continue
          }

          if (!r.ok) break
          const html = await r.text()

          const htmlName = extractPlaceName(current, html)
          if (htmlName) localPlaceName = htmlName

          if (localPlaceName) globalBestPlaceName = localPlaceName;

          const preloadLinkMatch = html.match(/<link\s+[^>]*href="(\/search\?[^"]*tbm=map[^"]*)"/);
          if (preloadLinkMatch) {
              try {
                  const rawUrl = preloadLinkMatch[1].replace(/amp;/g, '');
                  const linkUrl = new URL(`https://www.google.com${rawUrl}`);
                  const q = linkUrl.searchParams.get('q');
                  if (q) {
                      const coordMatch = decodeURIComponent(q).match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
                      if (coordMatch) {
                          console.log(`✅ [Try ${attemptIndex}] Found Priority 0 coords: ${q}`);
                          const [lat, lon] = normalizeCoords(parseFloat(coordMatch[1]), parseFloat(coordMatch[3]));
                          return { lat, lon, name: globalBestPlaceName };
                      }
                  }
              } catch (e) {}
          }

          const previewLinkMatch = html.match(/<link\s+[^>]*href="(\/maps\/preview\/place\?[^"]+)"/)

          if (previewLinkMatch) {
            const rpcUrl = `https://www.google.com${previewLinkMatch[1].replace(/amp;/g, '')}`
            const rpcRes = await fetchWithTimeout(rpcUrl, {
              headers: { 'User-Agent': getRandomUA(), Referer: current }
            }, 6000)

            if (rpcRes.ok) {
              const rpcText = await rpcRes.text()
              let parsedData = null;

              try {
                  const cleanJson = rpcText.replace(/^\)]}'/, '').trim();
                  parsedData = JSON.parse(cleanJson);
                  const rpcName = parsedData?.[6]?.[11];
                  if (rpcName && typeof rpcName === 'string') {
                      globalBestPlaceName = rpcName; 
                  }
              } catch (e) {}

              const strictMatch = rpcText.match(/\[\s*null\s*,\s*null\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/)
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

              const fallbackMatch = rpcText.match(/\[\s*\d+(?:\.\d+)?\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/)
              if (fallbackMatch) {
                  console.log(`✅ [Try ${attemptIndex}] Found Priority 5 Viewport coords`)
                  const [lat, lon] = normalizeCoords(fallbackMatch[1], fallbackMatch[2]);
                  return { lat, lon, name: globalBestPlaceName };
              }
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
              const waitTime = 800 * Math.pow(1.5, i - 1);
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
        const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/)
        if (titleMatch && titleMatch[1]) {
          let title = titleMatch[1].replace(' - Google Maps', '').replace(' - Google 地圖', '').trim()
          if (title && title !== 'Google Maps' && title !== 'Google 地圖') return title
        }
        const ogTitleMatch = htmlContent.match(/<meta\s+property="og:title"\s+content="(.*?)"/)
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