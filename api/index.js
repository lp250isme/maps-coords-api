const chromium = require('@sparticuz/chromium')
const puppeteer = require('puppeteer-core')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { url } = req.query
  if (!url) return res.status(400).send('Missing url parameter')

  let browser

  try {
    const executablePath = await chromium.executablePath()

    if (!executablePath) {
      throw new Error('Chromium executablePath is null')
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless
    })

    const page = await browser.newPage()

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    )

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    })

    const finalUrl = page.url()

    const match = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (match) {
      return res.status(200).send(`${match[1]},${match[2]}`)
    }

    const qMatch = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (qMatch) {
      return res.status(200).send(`${qMatch[1]},${qMatch[2]}`)
    }

    return res.status(404).json({ error: 'Coords not found', finalUrl })
  } catch (err) {
    console.error('PUPPETEER ERROR:', err)
    return res.status(500).json({
      error: err.message,
      name: err.name
    })
  } finally {
    if (browser) await browser.close()
  }
}
