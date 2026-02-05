module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  let current = url
  let attempt = 0
  const MAX_ATTEMPTS = 5

  let lastFoundPlaceName = null

  // 🛠️ Helper: 統一回傳 JSON 格式
  function sendResult(lat, lon) {
    const format = val => parseFloat(val).toFixed(6)

    // 如果有座標，組合成字串；否則為 null
    const coords = lat && lon ? `${format(lat)},${format(lon)}` : null

    // 處理地名
    let finalName = lastFoundPlaceName

    // 如果目前沒名字，嘗試從原始 Query 撈
    if (!finalName) {
      try {
        const u = new URL(url)
        const q = u.searchParams.get('q')
        if (q) finalName = q
      } catch (e) {}
    }

    // 過濾無效地名
    if (
      finalName &&
      (finalName.includes('Google Maps') || finalName.includes('Google 地圖'))
    ) {
      finalName = null
    }

    const safePlaceName = finalName || ''

    if (coords || safePlaceName) {
      return res.status(200).json({
        coords: coords,
        placeName: safePlaceName
      })
    } else {
      return res.status(404).json({
        error: 'Coords not found',
        placeName: ''
      })
    }
  }

  // 🛠️ Helper: 判斷並標準化座標
  function normalizeCoords(v1, v2) {
    const num1 = parseFloat(v1)
    const num2 = parseFloat(v2)

    // 防呆：在台灣/亞洲，經度(100+)通常 > 緯度(20+)
    // 如果 num1 較大，代表它是經度，回傳 [Lat, Lon]
    if (Math.abs(num1) > Math.abs(num2)) {
      return [num2, num1]
    }
    return [num1, num2]
  }

  // 🛠️ Helper: 檢查陣列是否像座標
  function isValidCoordArray(arr) {
    return (
      Array.isArray(arr) &&
      arr.length >= 2 &&
      !isNaN(parseFloat(arr[0])) &&
      !isNaN(parseFloat(arr[1]))
    )
  }

  // 🛠️ Helper: 提取地名
  function extractPlaceName(currentUrl, htmlContent = '') {
    try {
      const u = new URL(currentUrl)

      // 1. URL Query
      let name = u.searchParams.get('q') || u.searchParams.get('query')
      if (name && !name.match(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)) {
        return name
      }

      // 2. URL Path
      if (currentUrl.includes('/place/')) {
        const parts = u.pathname.split('/place/')
        if (parts[1]) {
          return decodeURIComponent(parts[1].split('/')[0]).replace(/\+/g, ' ')
        }
      }

      // 3. HTML Title
      if (htmlContent) {
        const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/)
        if (titleMatch && titleMatch[1]) {
          let title = titleMatch[1]
            .replace(' - Google Maps', '')
            .replace(' - Google 地圖', '')
            .trim()
          if (title && title !== 'Google Maps' && title !== 'Google 地圖')
            return title
        }

        const ogTitleMatch = htmlContent.match(
          /<meta\s+property="og:title"\s+content="(.*?)"/
        )
        if (ogTitleMatch && ogTitleMatch[1]) {
          let ogTitle = ogTitleMatch[1]
          if (ogTitle !== 'Google Maps' && ogTitle !== 'Google 地圖')
            return ogTitle
        }
      }
    } catch (e) {}
    return null
  }

  function getFtid(urlStr) {
    try {
      const u = new URL(urlStr)
      return u.searchParams.get('ftid')
    } catch (e) {
      return null
    }
  }

  try {
    while (attempt < MAX_ATTEMPTS) {
      attempt++
      console.log(`\n🔍 Attempt ${attempt}: Fetching ${current}`)

      const urlName = extractPlaceName(current)
      if (urlName) lastFoundPlaceName = urlName

      const r = await fetch(current, {
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-TW,en-US;q=0.9'
        }
      })

      const locationHeader = r.headers.get('location')

      const redirectFtid = locationHeader ? getFtid(locationHeader) : null
      if (redirectFtid) {
        console.log(`⚡ Shortcut: Found FTID [${redirectFtid}]`)
        current = `https://www.google.com/maps?ftid=${redirectFtid}&hl=zh-TW`
        continue
      }

      if (locationHeader) {
        console.log('➡️ Normal Redirect:', locationHeader)
        current = locationHeader.startsWith('/')
          ? new URL(current).origin + locationHeader
          : locationHeader
        continue
      }

      if (!r.ok) break
      const html = await r.text()

      const htmlName = extractPlaceName(current, html)
      if (htmlName) lastFoundPlaceName = htmlName

      // ==========================================
      // 🚀 [Priority 0] 檢查 Preload Link 中的 q 參數
      // ==========================================
      // 尋找 <link href="/search?tbm=map...q=..." ...>
      const preloadLinkMatch = html.match(
        /<link\s+[^>]*href="(\/search\?[^"]*tbm=map[^"]*)"/
      )

      if (preloadLinkMatch) {
        try {
          // 還原 &amp; -> &
          const rawUrl = preloadLinkMatch[1].replace(/amp;/g, '')
          const linkUrl = new URL(`https://www.google.com${rawUrl}`)

          // 提取 q 參數
          const q = linkUrl.searchParams.get('q')

          if (q) {
            // 檢查 q 是否為純座標格式 (數字,數字)
            // Regex: 開頭-可選負號-數字-逗號-可選負號-數字-結尾
            const coordMatch = decodeURIComponent(q).match(
              /^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/
            )

            if (coordMatch) {
              console.log(
                `✅ [Priority 0] Found direct coords in <link> q param: ${q}`
              )
              const val1 = parseFloat(coordMatch[1])
              const val2 = parseFloat(coordMatch[3])

              // 使用 normalize 確保經緯順序
              const [lat, lon] = normalizeCoords(val1, val2)
              return sendResult(lat, lon)
            }
          }
        } catch (e) {
          console.log('⚠️ Failed to parse preload link params:', e.message)
        }
      }

      // ==========================================
      // 原有邏輯：Preview Link -> RPC
      // ==========================================
      const previewLinkMatch = html.match(
        /<link\s+[^>]*href="(\/maps\/preview\/place\?[^"]+)"/
      )

      if (previewLinkMatch) {
        console.log('🔗 Found Preview Link, fetching RPC...')
        const rpcUrl = `https://www.google.com${previewLinkMatch[1].replace(/amp;/g, '')}`

        const rpcRes = await fetch(rpcUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: current
          }
        })

        if (rpcRes.ok) {
          const rpcText = await rpcRes.text()
          let parsedData = null

          // 解析 JSON 以供 Priority 2 & 3 使用
          try {
            const cleanJson = rpcText.replace(/^\)]}'/, '').trim()
            parsedData = JSON.parse(cleanJson)

            const rpcName = parsedData?.[6]?.[11]
            if (rpcName && typeof rpcName === 'string') {
              console.log(`📍 Found Official Place Name in RPC: ${rpcName}`)
              lastFoundPlaceName = rpcName
            }
          } catch (e) {
            console.log('⚠️ RPC JSON parse failed (non-fatal)')
          }

          // ==========================================
          // 🎯 座標解析：4 階段策略
          // ==========================================

          // 【Priority 1】Regex 嚴格搜尋 [null, null, Lat, Lon] (Entity Pin)
          const strictMatch = rpcText.match(
            /\[\s*null\s*,\s*null\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/
          )
          if (strictMatch) {
            console.log(
              '✅ [Plan 1] Found strict Pin Location [null, null, ...]'
            )
            const [lat, lon] = normalizeCoords(strictMatch[1], strictMatch[2])
            return sendResult(lat, lon)
          }

          // 【Priority 2】JSON data[0]
          if (parsedData && isValidCoordArray(parsedData[0])) {
            console.log('✅ [Plan 2] Found coords in data[0]')
            const arr = parsedData[0]
            const [lat, lon] = normalizeCoords(arr[0], arr[1])
            return sendResult(lat, lon)
          }

          // 【Priority 3】JSON data[1][0]
          if (
            parsedData &&
            Array.isArray(parsedData[1]) &&
            isValidCoordArray(parsedData[1][0])
          ) {
            console.log('✅ [Plan 3] Found coords in data[1][0]')
            const arr = parsedData[1][0]
            const [lat, lon] = normalizeCoords(arr[0], arr[1])
            return sendResult(lat, lon)
          }

          // 【Priority 4 (Fallback)】Regex 寬鬆搜尋 [Num, Lon, Lat] (Viewport)
          console.log('⚠️ Plans 1-3 failed. Trying Plan 4 (Viewport Regex)...')
          const fallbackMatch = rpcText.match(
            /\[\s*\d+(?:\.\d+)?\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/
          )
          if (fallbackMatch) {
            console.log('✅ [Plan 4] Found Viewport Location [Num, ...]')
            const [lat, lon] = normalizeCoords(
              fallbackMatch[1],
              fallbackMatch[2]
            )
            return sendResult(lat, lon)
          }

          console.log('⚠️ All coordinate extraction plans failed.')
        }
      }
      break
    }

    // 3. 失敗回傳
    console.log('⚠️ No coords found, returning fallback.')
    return sendResult(null, null)
  } catch (err) {
    console.error('Error:', err.message)
    return res.status(500).json({
      error: 'Server Error',
      placeName: lastFoundPlaceName || ''
    })
  }
}
