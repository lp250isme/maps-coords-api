// api/index.js

module.exports = async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  try {
    // 1. 發送請求，模擬瀏覽器 User-Agent (避免被擋)
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow', // 自動跟隨轉址
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    // 2. 取得最終轉導後的網址
    const finalUrl = response.url
    console.log('Final URL:', finalUrl)

    // 3. 用原本的正則表達式抓取座標
    // Google Maps 格式通常為: .../place/地點名稱/@緯度,經度,縮放...
    // 或者: ...?q=緯度,經度...

    // 你的原始正則 (針對 @lat,lng)
    let regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    let match = finalUrl.match(regex)

    // 備用正則：有時候網址是 ?q=lat,lng 格式
    if (!match) {
      regex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/
      match = finalUrl.match(regex)
    }

    // 備用正則：有時候是在 !3d 和 !4d 後面 (Google 的 CID 格式)
    if (!match) {
      // 這比較複雜，通常 @ 格式最常見，先保留上述兩個
    }

    if (match) {
      // match[1] 是緯度, match[2] 是經度
      res.status(200).send(`${match[1]},${match[2]}`)
    } else {
      // 雖然請求成功，但網址內沒看到座標 (可能是純文字搜尋結果頁)
      res.status(404).json({ error: 'No coords found in final URL', finalUrl })
    }
  } catch (error) {
    console.error('Fetch Error:', error)
    res.status(500).json({ error: 'Server Error', details: error.message })
  }
}
