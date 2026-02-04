module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  let current = url
  let attempt = 0
  const MAX_ATTEMPTS = 10

  function sendLatLon(lat, lon) {
    return res.status(200).send(`${lat},${lon}`)
  }

  try {
    while (attempt < MAX_ATTEMPTS) {
      attempt++
      console.log(`\n🔍 Attempt ${attempt}: Fetching ${current}`)

      const r = await fetch(current, {
        redirect: 'manual', // 手動處理 Redirect，確保能捕捉中間過程
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-TW,en-US;q=0.9,en;q=0.8',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      })

      // 1. 處理 HTTP 3xx Redirect
      // 這是最自然的流程，伺服器叫我們去哪，我們就去哪
      const locationHeader = r.headers.get('location')
      if (locationHeader) {
        console.log('➡️ HTTP Redirect:', locationHeader)
        current = locationHeader.startsWith('/')
          ? new URL(current).origin + locationHeader
          : locationHeader
        continue
      }

      // 2. 檢查 URL 本身座標 (Regex)
      // 有時候跳轉後的網址本身就帶著座標
      const pinMatch = current.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
      if (pinMatch) {
        console.log('✅ Found via URL Data Param (!3d!4d)')
        return sendLatLon(pinMatch[1], pinMatch[2])
      }

      // 3. 讀取 HTML 進行深度解析
      if (!r.ok) break
      const html = await r.text()

      // ==========================================
      // 🎯 核心策略: 抓取 Preview Link 並進行二次請求 (RPC Call)
      // 這是目前驗證過最準確的數據源 (f.txt)
      // ==========================================
      const previewLinkMatch = html.match(
        /<link\s+[^>]*href="(\/maps\/preview\/place\?[^"]+)"/
      )

      if (previewLinkMatch) {
        console.log('🔗 Found Preview Link Tag, processing...')
        let rawHref = previewLinkMatch[1]

        // 移除所有 "amp;" (還原 & 符號) 並補上 domain
        const cleanHref = rawHref.replace(/amp;/g, '')
        const rpcUrl = `https://www.google.com${cleanHref}`

        console.log('🚀 Fetching RPC Data from:', rpcUrl)

        // 發送二次請求 (Fetch RPC Data)
        const rpcRes = await fetch(rpcUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: current
          }
        })

        if (rpcRes.ok) {
          const rpcText = await rpcRes.text()

          // 解析 f.txt 格式: [[magic_num, 經度, 緯度], ...]
          // Group 1: 經度, Group 2: 緯度
          const rpcMatch = rpcText.match(
            /\[\s*\d+(?:\.\d+)?\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/
          )

          if (rpcMatch) {
            console.log('✅ Found coords in RPC Response!')
            const val1 = parseFloat(rpcMatch[1])
            const val2 = parseFloat(rpcMatch[2])

            // 防呆判斷：台灣/亞洲地區通常 經度(120+) > 緯度(20+)
            // 如果 val1 比較小 (例如 25.1)，那它可能是緯度，需要交換
            if (Math.abs(val1) < Math.abs(val2)) {
              return sendLatLon(val1, val2) // val1=Lat, val2=Lon
            }
            return sendLatLon(val2, val1) // val2=Lat, val1=Lon
          }
        }
      }

      // ==========================================
      // [備案策略] 當前頁面靜態分析
      // ==========================================

      // 策略 B: APP_INITIALIZATION_STATE
      const stateMatch = html.match(
        /APP_INITIALIZATION_STATE\s*=\s*\[\s*\[\s*\[\s*[^,]+,\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\s*\]/
      )
      if (stateMatch) {
        console.log('✅ Found via APP_INITIALIZATION_STATE')
        return sendLatLon(stateMatch[2], stateMatch[1])
      }

      // 策略 C: JS Redirect (window.ES5DGURL)
      // 如果還沒拿到座標，但有跳轉指令，就跟隨它
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

      break // 沒戲唱了
    }

    // ==========================================
    // 🏁 失敗處理
    // ==========================================
    console.log('⚠️ All attempts exhausted. No coordinates found.')
    return res.status(404).json({
      error: 'Coords not found',
      finalUrl: current
    })
  } catch (err) {
    console.error('Critical Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
