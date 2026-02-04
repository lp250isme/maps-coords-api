module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  // 檢查環境變數是否設定
  const LOCATIONIQ_TOKEN = process.env.LOCATIONIQ_TOKEN
  if (!LOCATIONIQ_TOKEN) {
    console.error(
      'CRITICAL: LOCATIONIQ_TOKEN is missing in environment variables.'
    )
    // 這裡不直接 return，或許前面步驟就能解掉，但在 Step 3 會失敗
  }

  let current = url

  try {
    // ========= 1️⃣ 跟隨 Google Maps redirect =========
    for (let i = 0; i < 8; i++) {
      const r = await fetch(current, {
        redirect: 'manual',
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
            'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
            'Version/17.0 Mobile/15E148 Safari/604.1'
        }
      })

      const nextLocation = r.headers.get('location')
      if (!nextLocation) break

      if (nextLocation.startsWith('/')) {
        const u = new URL(current)
        current = u.origin + nextLocation
      } else {
        current = nextLocation
      }
    }

    // ========= 2️⃣ 嘗試直接從 URL 拿座標 (Regex) =========
    let match = current.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (match) {
      return res.status(200).send(`${match[1]},${match[2]}`)
    }

    match = current.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (match) {
      return res.status(200).send(`${match[1]},${match[2]}`)
    }

    // ========= 3️⃣ Fallback: LocationIQ API =========
    // LocationIQ 是 Nominatim 的付費/託管版，參數邏輯幾乎一樣

    if (!LOCATIONIQ_TOKEN) {
      return res
        .status(500)
        .json({ error: 'Server Config Error: Missing API Token' })
    }

    let query = null

    try {
      const u = new URL(current)
      query = u.searchParams.get('q')

      // 處理 /place/ 路徑格式
      if (!query && current.includes('/place/')) {
        const parts = u.pathname.split('/place/')
        if (parts[1]) {
          query = decodeURIComponent(parts[1].split('/')[0]).replace(/\+/g, ' ')
        }
      }
    } catch (e) {
      console.warn('URL parsing failed:', e.message)
    }

    if (!query) {
      return res.status(404).json({
        error: 'Coords not found (No query param extracted)',
        finalUrl: current
      })
    }

    // ✂️✂️✂️ 地址清洗邏輯 (保留您驗證過的剝洋蔥法) ✂️✂️✂️
    let cleanQuery = query.split(/,|，/)[0].trim()
    cleanQuery = cleanQuery.replace(/^\d+\s?/, '')
    cleanQuery = cleanQuery.replace(/^.{2,3}[縣市]\s?/, '')
    cleanQuery = cleanQuery.replace(/^.{2,3}[鄉鎮市區]\s?/, '')
    cleanQuery = cleanQuery.replace(/^\d+\s?/, '')

    if (!cleanQuery || cleanQuery.length < 2) {
      cleanQuery = query.split(/,|，/)[0].trim()
    }

    // 建構 LocationIQ 請求
    const params = new URLSearchParams({
      key: LOCATIONIQ_TOKEN,
      q: cleanQuery,
      format: 'json',
      limit: '1'
    })

    // LocationIQ 官方 Endpoint
    const targetUrl = `https://us1.locationiq.com/v1/search?${params.toString()}`

    const apiRes = await fetch(targetUrl)

    // LocationIQ 錯誤處理 (例如 Quota Exceeded 或 Token 錯誤)
    if (!apiRes.ok) {
      const errText = await apiRes.text()
      console.error(`LocationIQ Error [${apiRes.status}]:`, errText)

      // 401 = Token 錯誤, 429 = 超過額度
      return res.status(502).json({
        error: 'LocationIQ API Error',
        statusCode: apiRes.status,
        preview: errText.slice(0, 100)
      })
    }

    const data = await apiRes.json()

    // LocationIQ 回傳格式與 OSM 幾乎一致
    if (data.length > 0) {
      return res.status(200).send(`${data[0].lat},${data[0].lon}`)
    }

    return res.status(404).json({
      error: 'Coords not found (LocationIQ returned empty)',
      originalQuery: query,
      cleanedQuery: cleanQuery,
      finalUrl: current
    })
  } catch (err) {
    console.error('Handler Critical Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
