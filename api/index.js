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

    // 如果找不到地名，嘗試從原始 Query 撈最後一次
    let finalName = lastFoundPlaceName
    if (!finalName) {
      try {
        const u = new URL(url)
        finalName = u.searchParams.get('q')
      } catch (e) {}
    }

    // 回傳狀態碼：有座標給 200，沒座標但有名字也給 200 (部分成功)，全空給 404
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

  // 🛠️ Helper: 提取地點名稱
  function extractPlaceName(currentUrl, htmlContent = '') {
    try {
      const u = new URL(currentUrl)

      // 1. URL Query (q=...)
      let name = u.searchParams.get('q')
      if (name) return name

      // 2. URL Path (/place/名稱/...)
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
          if (title !== 'Google Maps') return title
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

      // 每次請求前，先嘗試從 URL 抓地名
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

      // ==========================
      // 1. 處理 Redirect (攔截 FTID)
      // ==========================
      const locationHeader = r.headers.get('location')

      // 如果 header 裡有 FTID，直接跳關
      const redirectFtid = locationHeader ? getFtid(locationHeader) : null
      if (redirectFtid) {
        console.log(`⚡ Shortcut: Found FTID [${redirectFtid}]`)
        current = `http://googleusercontent.com/maps.google.com/maps?ftid=${redirectFtid}&hl=zh-TW`
        continue
      }

      // 普通轉導
      if (locationHeader) {
        console.log('➡️ Normal Redirect:', locationHeader)
        current = locationHeader.startsWith('/')
          ? new URL(current).origin + locationHeader
          : locationHeader
        continue
      }

      // ==========================
      // 2. 解析 HTML (提取座標 & 地名)
      // ==========================
      if (!r.ok) break
      const html = await r.text()

      // 嘗試從 HTML 抓地名 (通常 title 更準)
      const htmlName = extractPlaceName(current, html)
      if (htmlName) lastFoundPlaceName = htmlName

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

          // 🎯 核心修改：嚴格鎖定 [null, null, Lat, Lon]
          const rpcMatch = rpcText.match(
            /\[\s*null\s*,\s*null\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/
          )

          if (rpcMatch) {
            console.log('✅ Found strict [null, null, Lat, Lon] coords!')

            // Group 1: Lat, Group 2: Lon (基於您提供的 txt 順序)
            const val1 = parseFloat(rpcMatch[1])
            const val2 = parseFloat(rpcMatch[2])

            // 防呆交換：若 val1 是經度 (數值較大)，則交換
            if (Math.abs(val1) > Math.abs(val2)) {
              return sendResult(val2, val1) // val2=Lat, val1=Lon
            }
            return sendResult(val1, val2) // val1=Lat, val2=Lon
          }
        }
      }
      break
    }

    // ==========================
    // 3. 失敗處理 (回傳僅有名字的 JSON)
    // ==========================
    console.log('⚠️ No coords found, returning fallback.')
    return sendResult(null, null)
  } catch (err) {
    console.error('Error:', err.message)
    // 發生錯誤時，至少嘗試回傳地名
    return res.status(500).json({
      error: 'Server Error',
      placeName: lastFoundPlaceName
    })
  }
}
