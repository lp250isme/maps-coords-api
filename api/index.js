// pages/api/index.js 或任一 Node/Next.js API route
module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  let current = url
  let attempt = 0
  const MAX_ATTEMPTS = 10

  // 用來儲存最後找到的地點名稱
  let lastFoundPlaceName = null

  // 🛠️ Helper: 格式化並回傳座標 (純文字)
  function sendLatLon(lat, lon) {
    const format = val => parseFloat(val).toFixed(6)
    return res.status(200).send(`${format(lat)},${format(lon)}`)
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

      // 3. 從 HTML <title>
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
    } catch (e) {}
    return null
  }

  try {
    while (attempt < MAX_ATTEMPTS) {
      attempt++
      console.log(`\n🔍 Attempt ${attempt}: Fetching ${current}`)

      // 每次迴圈都更新地點名稱
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

      // 2. 檢查 URL 本身座標
      const pinMatch = current.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
      if (pinMatch) {
        console.log('✅ Found via URL Data Param (!3d!4d)')
        return sendLatLon(pinMatch[1], pinMatch[2])
      }

      // 3. 讀取 HTML
      if (!r.ok) break
      const html = await r.text()

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
          const rpcMatch = rpcText.match(
            /\[\s*\d+(?:\.\d+)?\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/
          )

          if (rpcMatch) {
            console.log('✅ Found coords in RPC Response!')
            const val1 = parseFloat(rpcMatch[1])
            const val2 = parseFloat(rpcMatch[2])
            if (Math.abs(val1) < Math.abs(val2)) {
              return sendLatLon(val1, val2)
            }
            return sendLatLon(val2, val1)
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
        return sendLatLon(stateMatch[2], stateMatch[1])
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
    // 🏁 失敗處理 (Fallback)
    // ==========================================
    console.log('⚠️ All attempts exhausted. No coordinates found.')

    // 1. 如果過程中（跳轉中間）有抓到地名，直接回傳
    if (lastFoundPlaceName) {
      console.log('🔙 Returning Place Name from history:', lastFoundPlaceName)
      return res.status(200).send(lastFoundPlaceName)
    }

    // 2. 如果過程中沒抓到，回去「最原始的 URL」硬抓一次
    let fallbackQuery = null
    try {
      const u = new URL(url) // 注意：這裡是 req.query.url (使用者輸入的原始網址)
      fallbackQuery = u.searchParams.get('q')

      // 處理 place 路徑
      if (!fallbackQuery && u.pathname.includes('/place/')) {
        fallbackQuery = decodeURIComponent(
          u.pathname.split('/place/')[1].split('/')[0]
        ).replace(/\+/g, ' ')
      }
    } catch (e) {}

    if (fallbackQuery) {
      console.log(
        '🔙 Returning raw query param from original URL:',
        fallbackQuery
      )
      return res.status(200).send(fallbackQuery)
    }

    // 3. 真的徹底沒救了，才回傳 404
    return res.status(404).send('Coords not found')
  } catch (err) {
    console.error('Critical Error:', err)

    // 發生例外時，也優先回傳名字
    if (lastFoundPlaceName) {
      return res.status(200).send(lastFoundPlaceName)
    }

    // 嘗試從原始 URL 抓名字
    try {
      const u = new URL(url)
      const q = u.searchParams.get('q')
      if (q) return res.status(200).send(q)
    } catch (e) {}

    return res.status(500).send('Server Error')
  }
}
