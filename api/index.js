const chromium = require('@sparticuz/chromium')
const puppeteerCore = require('puppeteer-core')

module.exports = async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  let browser = null

  try {
    const isVercel = process.env.VERCEL === '1'

    if (isVercel) {
      // === Vercel 線上環境 (Node 20 + Chromium 131) ===
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(), // 這裡一定要是 await 函式呼叫
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
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })

    try {
      await page.waitForFunction(() => window.location.href.includes('@'), {
        timeout: 6000
      })
    } catch (e) {}

    const finalUrl = page.url()
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const match = finalUrl.match(regex)

    if (match) {
      res.status(200).send(`${match[1]},${match[2]}`)
    } else {
      res.status(404).json({ error: 'No coords found', finalUrl })
    }
  } catch (error) {
    console.error('Puppeteer Error:', error)
    res.status(500).json({ error: 'Server Error', details: error.message })
  } finally {
    if (browser) await browser.close()
  }
}
