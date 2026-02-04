module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  const LOCATIONIQ_TOKEN = process.env.LOCATIONIQ_TOKEN
  if (!LOCATIONIQ_TOKEN) {
    console.warn('WARNING: LOCATIONIQ_TOKEN is missing.')
  }

  let current = url

  try {
    // ========= 1️⃣ 跟隨 Google Maps redirect =========
    for (let i = 0; i < 8; i++) {
      const r = await fetch(current, {
        redirect: 'manual',
        method: 'GET',
        headers: {
          // 🛠️ 修改：改用電腦版 UA，這能拿到資訊更豐富的 Desktop 頁面，而非 Mobile Preview
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
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

    // ========= 2.5️⃣ 爬取 HTML (強力解析版) =========
    // 這裡處理您遇到的 "Preview Page" 或 "og:image 被縮短" 的情況
    try {
      console.log('Fetching HTML for scrapping:', current)

      const htmlRes = await fetch(current, {
        headers: {
          // 再次強調，使用 Desktop UA
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
        }
      })

      if (htmlRes.ok) {
        const html = await htmlRes.text()

        // 策略 A: 找 og:image 裡的 center 參數 (最準確)
        // 格式: staticmap?center=25.123,121.123
        let metaMatch =
          html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/) ||
          html.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/)

        if (metaMatch) {
          console.log('✅ Found via Meta Tag')
          return res.status(200).send(`${metaMatch[1]},${metaMatch[2]}`)
        }

        // 策略 B: 找 Google Maps PB (Protocol Buffer) 格式 (您提供的 HTML 就是這種)
        // 格式 1: !3d(緯度)!4d(經度) -> 這是精準地標
        // 格式 2: !2d(經度)!3d(緯度) -> 這是視窗中心 (Fallback)
        // 注意：HTML 裡面的 url 可能被 encode，所以要找 !3d 或是 %213d

        // B1. 精準地標 (!3d緯度 !4d經度)
        let pbMatch =
          html.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
          html.match(/%213d(-?\d+\.\d+)%214d(-?\d+\.\d+)/)

        if (pbMatch) {
          console.log('✅ Found via PB Pin (!3d!4d)')
          return res.status(200).send(`${pbMatch[1]},${pbMatch[2]}`)
        }

        // B2. 視窗中心 (!2d經度 !3d緯度) - 您提供的 HTML 屬於這類
        // 注意順序：!2d 是經度(Lon)，!3d 是緯度(Lat)
        let viewMatch =
          html.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/) ||
          html.match(/%212d(-?\d+\.\d+)%213d(-?\d+\.\d+)/)

        if (viewMatch) {
          console.log('✅ Found via PB Viewport (!2d!3d)')
          // viewMatch[1] 是經度, viewMatch[2] 是緯度 -> 轉成 Lat,Lon
          return res.status(200).send(`${viewMatch[2]},${viewMatch[1]}`)
        }

        // 策略 C: 暴力搜尋 window.APP_INITIALIZATION_STATE (最後手段)
        // 您的 HTML 裡有：[[[28897.39..., 121.52668..., 25.12977...], ...]
        // 格式通常是 [zoom?, lon, lat]
        const stateMatch = html.match(
          /\[\[\[\d+\.?\d*,(-?\d+\.\d+),(-?\d+\.\d+)\]/
        )
        if (stateMatch) {
          console.log('✅ Found via APP_INITIALIZATION_STATE')
          // stateMatch[1] 是 Lon, stateMatch[2] 是 Lat
          return res.status(200).send(`${stateMatch[2]},${stateMatch[1]}`)
        }
      }
    } catch (scrapeErr) {
      console.warn('HTML Scraping warning:', scrapeErr.message)
    }

    // ========= 3️⃣ Fallback: LocationIQ API =========
    // 只有當上面所有 regex 都失敗時，才走 API

    if (!LOCATIONIQ_TOKEN) {
      return res
        .status(500)
        .json({
          error: 'Server Config Error: Missing API Token and scraping failed'
        })
    }

    let query = null

    try {
      const u = new URL(current)
      query = u.searchParams.get('q')

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

    // 清洗地址邏輯
    let cleanQuery = query.split(/,|，/)[0].trim()
    cleanQuery = cleanQuery.replace(/^\d+\s?/, '')
    cleanQuery = cleanQuery.replace(/^.{2,3}[縣市]\s?/, '')
    cleanQuery = cleanQuery.replace(/^.{2,3}[鄉鎮市區]\s?/, '')
    cleanQuery = cleanQuery.replace(/^\d+\s?/, '')

    if (!cleanQuery || cleanQuery.length < 2) {
      cleanQuery = query.split(/,|，/)[0].trim()
    }

    console.log('Fallback to LocationIQ with query:', cleanQuery)

    const params = new URLSearchParams({
      key: LOCATIONIQ_TOKEN,
      q: cleanQuery,
      format: 'json',
      limit: '1'
    })

    const targetUrl = `https://us1.locationiq.com/v1/search?${params.toString()}`

    const apiRes = await fetch(targetUrl)

    if (!apiRes.ok) {
      const errText = await apiRes.text()
      return res.status(502).json({
        error: 'LocationIQ API Error',
        statusCode: apiRes.status,
        preview: errText.slice(0, 100)
      })
    }

    const data = await apiRes.json()

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
