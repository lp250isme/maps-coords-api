const chromium = require('@sparticuz/chromium')
const puppeteerCore = require('puppeteer-core')

module.exports = async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: '請提供 url 參數' })
  }

  let browser = null

  try {
    // 判斷是否在 Vercel 環境 (Vercel 會自動注入此變數)
    const isVercel = process.env.VERCEL === '1'

    if (isVercel) {
      // === Vercel 線上環境設定 ===
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless
      })
    } else {
      // === 本地測試環境設定 ===
      // 動態引入 puppeteer (避免 Vercel 打包時報錯)
      const puppeteer = require('puppeteer')
      browser = await puppeteer.launch({
        headless: 'new', // 本地測試可以看到瀏覽器跳出來，若想隱藏請設為 "new" 或 true
        args: ['--no-sandbox']
      })
    }

    const page = await browser.newPage()

    // 設定 User Agent (模擬真實瀏覽器)
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // 前往目標網址
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }) // 本地網路可能慢，時間設長一點

    // 等待網址轉換
    try {
      await page.waitForFunction(() => window.location.href.includes('@'), {
        timeout: 8000
      })
    } catch (e) {
      // 忽略超時
    }

    const finalUrl = page.url()
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const match = finalUrl.match(regex)

    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      res.status(200).send(`${lat},${lng}`)
    } else {
      res.status(404).json({ error: '找不到座標', finalUrl })
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
