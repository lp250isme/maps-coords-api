const chromium = require('@sparticuz/chromium')
const puppeteer = require('puppeteer-core')

module.exports = async (req, res) => {
  // 1. 取得輸入的 url
  const { url } = req.query // 支援 GET /api?url=...
  // 若你要支援 POST，可用 const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: '請提供 url 參數' })
  }

  let browser = null

  try {
    // 2. 啟動瀏覽器 (針對 Vercel 環境優化)
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    })

    const page = await browser.newPage()

    // 3. 前往目標網址
    // waitUntil: 'domcontentloaded' 比較快，只要 DOM 載入就好，不用等圖片
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 })

    // 4. 等待網址轉換 (最多等 5 秒)
    // Google Maps 分享網址會跳轉成含有座標的長網址
    try {
      await page.waitForFunction(() => window.location.href.includes('@'), {
        timeout: 5000
      })
    } catch (e) {
      // 就算超時，也嘗試讀取當前網址看看
    }

    const finalUrl = page.url()

    // 5. 正則表達式提取座標
    // 格式通常是: .../place/.../@25.1309767,121.5255809,17z/...
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const match = finalUrl.match(regex)

    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])

      // 只要回傳你要的格式字串
      res.status(200).send(`${lat},${lng}`)
    } else {
      res.status(404).json({
        error: '找不到座標',
        finalUrl: finalUrl // 除錯用，讓你知道最後停在哪個網址
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '伺服器錯誤', details: error.message })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
