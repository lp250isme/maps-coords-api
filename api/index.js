const chromium = require('@sparticuz/chromium')
const puppeteerCore = require('puppeteer-core')

module.exports = async (req, res) => {
  // 設定 CORS，避免被瀏覽器擋
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { url } = req.query
  if (!url) return res.status(400).send('Missing url parameter')

  let browser = null

  try {
    if (process.env.VERCEL) {
      // === Vercel 環境 ===
      browser = await puppeteerCore.launch({
        args: [
          ...chromium.args,
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--no-sandbox'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless
      })
    } else {
      // === 本地測試環境 ===
      const puppeteer = require('puppeteer')
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
      })
    }

    const page = await browser.newPage()
    // 偽裝 User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    )

    // 存取目標網址
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 })
    const finalUrl = page.url()

    // 抓取經緯度
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const match = finalUrl.match(regex)

    if (match) {
      res.status(200).send(`${match[1]},${match[2]}`)
    } else {
      // 嘗試抓取 ?q= 格式
      const qMatch = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (qMatch) {
        res.status(200).send(`${qMatch[1]},${qMatch[2]}`)
      } else {
        res.status(404).json({ error: 'Coords not found', finalUrl })
      }
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  } finally {
    if (browser) await browser.close()
  }
}
