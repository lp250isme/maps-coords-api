module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  let current = url
  let attempt = 0
  const MAX_ATTEMPTS = 5

  // 用來暫存沿途抓到的地名
  let lastFoundPlaceName = null

  // 🛠️ Helper: 統一回傳 JSON 格式
  function sendResult(lat, lon) {
    const format = val => parseFloat(val).toFixed(6)

    // 如果有座標，組合成字串；否則為 null
    const coords = lat && lon ? `${format(lat)},${format(lon)}` : null

    // 如果找不到地名，嘗試從原始 Query 撈最後一次 (雙重保險)
    let finalName = lastFoundPlaceName
    if (!finalName) {
      try {
        const u = new URL(url)
        const q = u.searchParams.get('q')
        if (q) finalName = q
      } catch (e) {}
    }

    // 回傳狀態碼
    if (coords || finalName) {
      return res.status(200).json({
        coords: coords,
        placeName: finalName || null
      })
    } else {
      return res.status(404).json({
        error: 'Coords not found',
        placeName: null
      })
    }
  }

  // 🛠️ Helper: 提取地點名稱 (從 URL 或 HTML)
  function extractPlaceName(currentUrl, htmlContent = '') {
    try {
      const u = new URL(currentUrl)

      // 1. URL Query
      let name = u.searchParams.get('q') || u.searchParams.get('query')

      // 排除看起來像座標的字串
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
          let title = titleMatch[1].replace(' - Google Maps', '').trim()
          if (title && title !== 'Google Maps') return title
        }

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
    } catch (e) {}
    return null
  }

  // 🛠️ Helper: 提取 FTID
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

      // 每次 Fetch 前先從 URL 抓名字 (作為備案)
      const urlName = extractPlaceName(current)
      if (urlName) {
        // console.log(`📍 Found Place Name in URL: ${urlName}`)
        lastFoundPlaceName = urlName
      }

      const r = await fetch(current, {
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-TW,en-US;q=0.9'
        }
      })

      // ==========================
      // 1. 處理 Redirect
      // ==========================
      const locationHeader = r.headers.get('location')

      // FTID Shortcut
      const redirectFtid = locationHeader ? getFtid(locationHeader) : null
      if (redirectFtid) {
        console.log(`⚡ Shortcut: Found FTID [${redirectFtid}]`)
        current = `https://www.google.com/maps?ftid=${redirectFtid}&hl=zh-TW`
        continue
      }

      // Normal Redirect
      if (locationHeader) {
        console.log('➡️ Normal Redirect:', locationHeader)
        current = locationHeader.startsWith('/')
          ? new URL(current).origin + locationHeader
          : locationHeader
        continue
      }

      // ==========================
      // 2. 解析 HTML
      // ==========================
      if (!r.ok) break
      const html = await r.text()

      // 嘗試從 HTML 抓地名 (備案)
      const htmlName = extractPlaceName(current, html)
      if (htmlName) {
        lastFoundPlaceName = htmlName
      }

      // 抓 Preview Link -> RPC
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

          // ==========================================
          // 🆕 核心修改：解析 JSON 提取 [6][11] 地名
          // ==========================================
          try {
            // 1. 去除 Google JSON 前綴 )]}'
            const cleanJson = rpcText.replace(/^\)]}'/, '').trim()

            // 2. 解析 JSON
            const data = JSON.parse(cleanJson)

            // 3. 提取 [6][11] (使用 Optional Chaining 防止報錯)
            const rpcName = data?.[6]?.[11]

            if (rpcName && typeof rpcName === 'string') {
              console.log(
                `📍 Found Official Place Name in RPC [6][11]: ${rpcName}`
              )
              // 這是最準的，直接覆蓋之前的名字
              lastFoundPlaceName = rpcName
            }
          } catch (e) {
            console.log('⚠️ Failed to parse RPC JSON for name:', e.message)
          }

          // ==========================================
          // 🎯 座標解析 (維持嚴格模式)
          // ==========================================
          const rpcMatch = rpcText.match(
            /\[\s*null\s*,\s*null\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/
          )

          if (rpcMatch) {
            console.log('✅ Found strict [null, null, Lat, Lon] coords!')

            const val1 = parseFloat(rpcMatch[1])
            const val2 = parseFloat(rpcMatch[2])

            // 防呆交換
            if (Math.abs(val1) > Math.abs(val2)) {
              return sendResult(val2, val1)
            }
            return sendResult(val1, val2)
          }
        }
      }
      break
    }

    // ==========================
    // 3. 失敗處理
    // ==========================
    console.log('⚠️ No coords found, returning fallback.')
    return sendResult(null, null)
  } catch (err) {
    console.error('Error:', err.message)
    return res.status(500).json({
      error: 'Server Error',
      placeName: lastFoundPlaceName
    })
  }
}
