const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: '請提供 url 參數' });
  }

  let browser = null;

  try {
    // 針對 Vercel 新環境的圖形設定
    // 這裡通常不需要額外設定 font，除非你要截圖有文字的畫面
    // chromium.setGraphicsMode = false; // 如果有報錯再打開這行

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(), // 這裡維持這樣
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // 設定 User Agent 避免被 Google 擋
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 前往目標網址
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });

    // 等待網址轉換
    try {
      await page.waitForFunction(() => window.location.href.includes('@'), { timeout: 6000 });
    } catch (e) {
      // 忽略超時
    }

    const finalUrl = page.url();
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = finalUrl.match(regex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      res.status(200).send(`${lat},${lng}`);
    } else {
      res.status(404).json({ error: '找不到座標', finalUrl });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '伺服器錯誤', details: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
