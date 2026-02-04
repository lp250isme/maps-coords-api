module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  let current = url
  let attempt = 0
  const MAX_ATTEMPTS = 5

  function sendLatLon(lat, lon) {
    const format = val => parseFloat(val).toFixed(6)
    return res.status(200).send(`${format(lat)},${format(lon)}`)
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
        console.log(`⚡ Shortcut: Found FTID [${redirectFtid}] in redirect!`)
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
          // 🎯 核心修改：鎖定 [null, null, Lat, Lon] 格式
          // ==========================================
          // 您的目標: [null,null,25.1676953,121.445523]
          // Regex 解釋:
          // \[ \s* null \s* , \s* null \s* ,  -> 匹配開頭的 [null, null,
          // \s* (-?\d+\.\d+)                  -> Group 1: 緯度 (Lat)
          // \s* , \s* -> 逗號
          // \s* (-?\d+\.\d+)                  -> Group 2: 經度 (Lon)

          const rpcMatch = rpcText.match(
            /\[\s*null\s*,\s*null\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/
          )

          if (rpcMatch) {
            console.log('✅ Found strict [null, null, Lat, Lon] coords!')

            // 注意：根據您的 txt 範例，順序是 [null, null, 25..., 121...]
            // 所以 Group 1 是 Lat (緯度)，Group 2 是 Lon (經度)
            const val1 = parseFloat(rpcMatch[1]) // Lat
            const val2 = parseFloat(rpcMatch[2]) // Lon

            // 雙重保險：如果在台灣/亞洲，經度(100+)通常大於緯度(20+)
            // 如果 val1 數值很大 (121)，那它其實是經度，代表順序反了，交換回來
            // 如果 val1 數值小 (25)，那它就是緯度，順序正確
            if (Math.abs(val1) > Math.abs(val2)) {
              return sendLatLon(val2, val1) // val2=Lat, val1=Lon
            }

            return sendLatLon(val1, val2) // val1=Lat, val2=Lon
          } else {
            console.log('⚠️ Strict pattern [null, null, lat, lon] not found.')
          }
        }
      }

      break
    }

    // Fallback: 回傳地名
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
