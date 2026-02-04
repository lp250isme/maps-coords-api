module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  let current = url
  let attempt = 0
  const MAX_ATTEMPTS = 5 // 減少嘗試次數，因為我們有捷徑

  function sendLatLon(lat, lon) {
    const format = val => parseFloat(val).toFixed(6)
    return res.status(200).send(`${format(lat)},${format(lon)}`)
  }

  // 🛠️ Helper: 從 URL 字串中提取 ftid
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

      // 1. 檢查當前 URL 是否已有 ftid
      // 如果有，我們就不需要這一輪的 fetch 了，直接構造標準網址進入下一輪 (或直接 fetch)
      // 但為了邏輯統一，我們讓它跑一次 fetch，重點是在 redirect 處攔截

      const r = await fetch(current, {
        redirect: 'manual', // 必須手動，才能攔截第一次 302
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-TW,en-US;q=0.9'
        }
      })

      // ==========================================
      // 🚀 關鍵優化：在 Redirect 階段直接攔截 FTID
      // ==========================================
      const locationHeader = r.headers.get('location')

      // 檢查 Header 裡有沒有 ftid
      const redirectFtid = locationHeader ? getFtid(locationHeader) : null

      if (redirectFtid) {
        console.log(`⚡ Shortcut: Found FTID [${redirectFtid}] in redirect!`)
        console.log(
          '🚀 Skipping redirect chain, jumping to Google Maps directly.'
        )

        // 強制構造標準網址，這張網頁保證會有 preview link
        current = `https://www.google.com/maps?ftid=${redirectFtid}&hl=zh-TW`
        continue // 直接進入下一輪，去抓這個標準網頁
      }

      // 如果沒有 ftid，但有轉導，就乖乖跟隨 (例如短網址轉長網址)
      if (locationHeader) {
        console.log('➡️ Normal Redirect:', locationHeader)
        current = locationHeader.startsWith('/')
          ? new URL(current).origin + locationHeader
          : locationHeader
        continue
      }

      // ==========================================
      // 🎯 核心策略: HTML -> Preview Link -> RPC
      // 來到這裡代表已經是 200 OK 的頁面 (通常就是我們構造的那個 maps?ftid=...)
      // ==========================================
      if (!r.ok) break
      const html = await r.text()

      const previewLinkMatch = html.match(
        /<link\s+[^>]*href="(\/maps\/preview\/place\?[^"]+)"/
      )

      if (previewLinkMatch) {
        console.log('🔗 Found Preview Link, fetching RPC...')
        // 還原網址
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
          // 解析 f.txt: [magic, 經度, 緯度]
          const rpcMatch = rpcText.match(
            /\[\s*\d+(?:\.\d+)?\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/
          )

          if (rpcMatch) {
            const val1 = parseFloat(rpcMatch[1])
            const val2 = parseFloat(rpcMatch[2])
            console.log('✅ Coordinates extracted from RPC!')

            // 經度 > 緯度
            if (Math.abs(val1) < Math.abs(val2)) {
              return sendLatLon(val1, val2)
            }
            return sendLatLon(val2, val1)
          }
        }
      }

      // 如果到了這一步還沒抓到，代表這個頁面結構不對，跳出
      break
    }

    // ==========================================
    // 🏁 失敗處理
    // ==========================================
    // 最後一搏：如果網址本身就有 q=...，直接回傳地名
    try {
      const u = new URL(current)
      const q = u.searchParams.get('q')
      if (q) return res.status(200).send(q)
    } catch (e) {}

    return res.status(404).send('Coords not found')
  } catch (err) {
    console.error('Error:', err.message)
    return res.status(500).send('Server Error')
  }
}
