module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  let current = url
  let attempt = 0
  const MAX_ATTEMPTS = 10

  // 用來儲存最後找到的地點名稱 (Fallback 用)
  let lastFoundPlaceName = null

  // 🛠️ Helper: 格式化並回傳座標 (小數點後 6 位)
  function sendLatLon(lat, lon) {
    const format = val => parseFloat(val).toFixed(6)

    return res.status(200).json({
      coordsFound: true,
      lat: format(lat),
      lon: format(lon),
      placeName: lastFoundPlaceName
    })
  }

  // Helper: 嘗試從 URL 或 HTML 提取地點名稱
  function extractPlaceName(currentUrl, htmlContent = '') {
    try {
      const u = new URL(currentUrl)
      let name = u.searchParams.get('q')

      // 1. 從 URL query (q=...)
      if (name) return name

      // 2. 從 URL path (/place/地點名/...)
      if (currentUrl.includes('/place/')) {
        const parts = u.pathname.split('/place/')
        if (parts[1]) {
          return decodeURIComponent(parts[1].split('/')[0]).replace(/\+/g, ' ')
        }
      }

      // 3. 從 HTML <title> (最後手段)
      if (htmlContent) {
        const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/)
        if (titleMatch && titleMatch[1]) {
          let title = titleMatch[1].replace(' - Google Maps', '').trim()
          if (title !== 'Google Maps') return title
        }

        // 4. 從 meta og:title
        const ogTitleMatch = htmlContent.match(
          /<meta\s+property="og:title"\s+content="(.*?)"/
        )
        if (
          ogTitleMatch &&
          ogTitleMatch[1] &&
          ogTitleMatch[1] !== 'Google Maps'
        ) {
          return ogTitleMatch[1]
        }
      }
    } catch (e) {
      // 忽略解析錯誤
    }
    return null
  }

  try {
    while (attempt < MAX_ATTEMPTS) {
      attempt++
      console.log(`\n🔍 Attempt ${attempt}: Fetching ${current}`)

      // 每次迴圈都試著提取名字
      const tempName = extractPlaceName(current)
      if (tempName) lastFoundPlaceName = tempName

      const r = await fetch(current, {
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-TW,en-US;q=0.9,en;q=0.8',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      })

      // 1. 處理 HTTP 3xx Redirect
      const locationHeader = r.headers.get('location')
      if (locationHeader) {
        console.log('➡️ HTTP Redirect:', locationHeader)
        current = locationHeader.startsWith('/')
          ? new URL(current).origin + locationHeader
          : locationHeader
        continue
      }

      // 2. 檢查 URL 本身座標 (!3d...!4d...)
      const pinMatch = current.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
      if (pinMatch) {
        console.log('✅ Found via URL Data Param (!3d!4d)')
        return sendLatLon(pinMatch[1], pinMatch[2])
      }

      // 3. 讀取 HTML
      if (!r.ok) break
      const html = await r.text()

      // 更新地點名稱
      const htmlName = extractPlaceName(current, html)
      if (htmlName) lastFoundPlaceName = htmlName

      // ==========================================
      // 🎯 核心策略: Preview Link -> RPC Call
      // ==========================================
      const previewLinkMatch = html.match(
        /<link\s+[^>]*href="(\/maps\/preview\/place\?[^"]+)"/
      )

      if (previewLinkMatch) {
        console.log('🔗 Found Preview Link Tag')
        let rawHref = previewLinkMatch[1]
        // 移除 amp; 還原 &
        const cleanHref = rawHref.replace(/amp;/g, '')
        const rpcUrl = `https://www.google.com${cleanHref}`

        const rpcRes = await fetch(rpcUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: current
          }
        })

        if (rpcRes.ok) {
          const rpcText = await rpcRes.text()
          // 解析 RPC Array
          const rpcMatch = rpcText.match(
            /\[\s*\d+(?:\.\d+)?\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/
          )

          if (rpcMatch) {
            console.log('✅ Found coords in RPC Response!')
            const val1 = parseFloat(rpcMatch[1])
            const val2 = parseFloat(rpcMatch[2])

            // 經度 (Lon) 120+ > 緯度 (Lat) 20+
            if (Math.abs(val1) < Math.abs(val2)) {
              return sendLatLon(val1, val2) // val1=Lat, val2=Lon
            }
            return sendLatLon(val2, val1) // val2=Lat, val1=Lon
          }
        }
      }

      // [備案策略]
      // 策略 B: APP_INITIALIZATION_STATE
      const stateMatch = html.match(
        /APP_INITIALIZATION_STATE\s*=\s*\[\s*\[\s*\[\s*[^,]+,\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\s*\]/
      )
      if (stateMatch) {
        console.log('✅ Found via APP_INITIALIZATION_STATE')
        return sendLatLon(stateMatch[2], stateMatch[1]) // Group2=Lat, Group1=Lon
      }

      // 策略 C: JS Redirect
      const jsRedirectMatch =
        html.match(/window\.ES5DGURL\s*=\s*'([^']+)'/) ||
        html.match(/window\.location\.replace\(['"]([^'"]+)['"]\)/)

      if (jsRedirectMatch) {
        let nextUrl = jsRedirectMatch[1]
          .replace(/\\x26/g, '&')
          .replace(/\\x3d/g, '=')
          .replace(/\\u003d/g, '=')
          .replace(/&/g, '&')

        if (nextUrl.startsWith('/'))
          nextUrl = 'https://www.google.com' + nextUrl
        console.log('🔄 JS Redirect detected:', nextUrl)
        current = nextUrl
        continue
      }

      break
    }

    // ==========================================
    // 🏁 失敗處理 (找不到座標)
    // ==========================================
    console.log('⚠️ All attempts exhausted. No coordinates found.')

    // 如果有找到地點名稱，回傳地點名稱
    if (lastFoundPlaceName) {
      console.log('🔙 Returning Place Name instead:', lastFoundPlaceName)
      return res.status(200).json({
        coordsFound: false, // 標記為沒找到座標
        placeName: lastFoundPlaceName, // 但找到了名字
        message: 'Coordinates not found, returning place name.'
      })
    }

    return res.status(404).json({
      error: 'Coords and Place Name not found',
      finalUrl: current
    })
  } catch (err) {
    console.error('Critical Error:', err)

    // 發生例外時，也試著回傳最後已知的地點名稱
    if (lastFoundPlaceName) {
      return res.status(200).json({
        coordsFound: false,
        placeName: lastFoundPlaceName,
        error: err.message
      })
    }

    return res.status(500).json({ error: err.message })
  }
}
