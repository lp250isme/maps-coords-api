module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

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

    // ========= 3️⃣ OpenStreetMap fallback =========
    let query = null

    try {
      const u = new URL(current)
      query = u.searchParams.get('q')

      // 處理 /place/ 格式
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

    // ✂️✂️✂️ 核心修改：針對「黏在一起」的地址進行清洗 ✂️✂️✂️
    // 範例輸入: "335桃園市大溪區335月眉停車場"

    // 1. 先做基本的逗號/空格切割 (防守第一層)
    let cleanQuery = query.split(/,|，/)[0].trim()

    // 2. 剝洋蔥清洗法 (針對台灣地址結構)
    // 步驟 A: 移除開頭的郵遞區號或數字 (移除 "335")
    cleanQuery = cleanQuery.replace(/^\d+\s?/, '')

    // 步驟 B: 移除縣市 (移除 "桃園市"、"台北縣" 等)
    cleanQuery = cleanQuery.replace(/^.{2,3}[縣市]\s?/, '')

    // 步驟 C: 移除鄉鎮市區 (移除 "大溪區"、"中壢市" 等)
    cleanQuery = cleanQuery.replace(/^.{2,3}[鄉鎮市區]\s?/, '')

    // 步驟 D: 再次移除可能殘留的數字 (針對您案例中第二個 "335")
    // 邏輯：地址被移除後，如果緊接著又是數字，通常是路段號碼或重複的郵遞區號
    cleanQuery = cleanQuery.replace(/^\d+\s?/, '')

    // 步驟 E: 移除常見路名開頭 (選擇性，避免誤刪 "中正紀念堂" 的 "中正")
    // 只有當確定後面還有字時才移除路名，這裡先保守一點，不移除路名

    // 如果清洗後變空字串 (例如原本只有 "桃園市")，則還原回原始 query，避免送出空值
    if (!cleanQuery || cleanQuery.length < 2) {
      cleanQuery = query.split(/,|，/)[0].trim() // 只做最簡單切割
    }

    // =======================================================

    const osmParams = new URLSearchParams({
      q: cleanQuery, // 使用清洗後的名稱
      format: 'jsonv2',
      polygon_geojson: '1',
      limit: '1'
    })

    const osmUrl = `https://nominatim.openstreetmap.org/search?${osmParams.toString()}`

    const osmRes = await fetch(osmUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
      }
    })

    const contentType = osmRes.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    if (!osmRes.ok || !isJson) {
      const errText = await osmRes.text()
      return res.status(502).json({
        error: 'OSM API Error',
        statusCode: osmRes.status,
        preview: errText.slice(0, 200)
      })
    }

    const data = await osmRes.json()

    if (data.length > 0) {
      return res.status(200).send(`${data[0].lat},${data[0].lon}`)
    }

    return res.status(404).json({
      error: 'Coords not found (OSM returned empty)',
      originalQuery: query,
      cleanedQuery: cleanQuery, // 回傳清洗後的字串，方便你除錯看結果
      finalUrl: current
    })
  } catch (err) {
    console.error('Handler Critical Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
